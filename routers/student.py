from fastapi import APIRouter, Depends, HTTPException, Query, Body, Response, UploadFile, File
from datetime import datetime, timedelta
from typing import List, Optional
import base64
from auth.models import User
from auth.dependencies import get_current_user
from models import Student
from jobs.models import Job
from routers.recruiter_models import RecruiterJob, RecruiterProfile
from routers.application_models import Application
from routers.message_models import Conversation, Message
from services import SKILL_ONTOLOGY
import services
import math
import re

# ─── Null-safety helpers – use everywhere in this file ────────────────────────
def sl(val): """Safe list"""; return val if val is not None else []
def sn(val): """Safe number"""; return val if val is not None else 0
def ss(val): """Safe string"""; return val if val is not None else ""

def skill_slug(value: str) -> str:
    """Create URL-safe IDs for learning path and node identifiers."""
    base = re.sub(r"[^a-z0-9]+", "_", ss(value).strip().lower())
    return base.strip("_") or "skill"

def normalize_skill_text(value: str) -> str:
    text = ss(value).strip().lower()
    text = re.sub(r"[()\[\]{}]", " ", text)
    text = text.replace("/", " ").replace("&", " and ")
    text = re.sub(r"[^a-z0-9+\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()

def build_skill_aliases(value: str) -> set:
    """Generate comparable aliases so composite skill names match concrete skill names."""
    raw = ss(value).strip()
    normalized = normalize_skill_text(raw)
    aliases = {normalized} if normalized else set()

    # Include base name without parenthetical qualifiers.
    base_name = normalize_skill_text(re.sub(r"\([^)]*\)", " ", raw))
    if base_name:
        aliases.add(base_name)

    # Include sub-skills from parenthetical groups like (SQL/NoSQL).
    for group in re.findall(r"\(([^)]*)\)", raw):
        for part in re.split(r"[/,|]", group):
            part_norm = normalize_skill_text(part)
            if part_norm:
                aliases.add(part_norm)

    return aliases

def skill_exists_in_profile(skill_name: str, profile_skills: set) -> bool:
    aliases = build_skill_aliases(skill_name)
    if not aliases:
        return False
    if aliases & profile_skills:
        return True

    # Fallback fuzzy containment for close variants.
    for alias in aliases:
        if len(alias) < 3:
            continue
        for existing in profile_skills:
            if alias in existing or existing in alias:
                return True
    return False

def extract_skill_slug_from_path_id(path_id: str) -> str:
    """Extract skill slug from dynamic learning path IDs."""
    pid = ss(path_id).strip().lower()
    if pid.startswith("path_manual_"):
        return pid[len("path_manual_"):]
    if pid.startswith("path_req_"):
        return pid[len("path_req_"):]
    if pid.startswith("path_gap_"):
        # Format: path_gap_<index>_<skill_slug>
        parts = pid.split("_", 3)
        if len(parts) == 4:
            return parts[3]
    return ""

def resolve_skill_name_from_slug(skill_slug_value: str, candidate_skills: list) -> str:
    """Find the original display skill name for a slug from known candidate skill names."""
    slug_value = ss(skill_slug_value).strip().lower()
    if not slug_value:
        return ""

    for candidate in candidate_skills:
        candidate_name = ss(candidate).strip()
        if candidate_name and skill_slug(candidate_name) == slug_value:
            return candidate_name

    return slug_value.replace("_", " ").strip()

router = APIRouter()

def format_time_ago(dt: datetime) -> str:
    now = datetime.now()
    diff = now - dt.replace(tzinfo=None) if dt.tzinfo else now - dt
    secs = diff.total_seconds()
    if secs < 3600:
        m = max(int(secs // 60), 1)
        return f"{m} min ago"
    if secs < 86400:
        return f"{int(secs // 3600)}h ago"
    if secs < 604800:
        d = int(secs // 86400)
        return f"{d} day{'s' if d > 1 else ''} ago"
    return dt.strftime("%b %d")

STATUS_LABELS = {
    "applied":     ("Applied",        "blue"),
    "reviewing":   ("Application Reviewed", "purple"),
    "shortlisted": ("Shortlisted",    "indigo"),
    "interview":   ("Interview Scheduled", "orange"),
    "offer":       ("Offer Received", "emerald"),
    "hired":       ("Hired 🎉",       "green"),
    "rejected":    ("Application Rejected", "red"),
}

def build_skill_growth(score: int, skill_count: int, created_at: str) -> list:
    today = datetime.now()
    try:
        joined = datetime.fromisoformat(created_at.replace("Z", "").split("+")[0])
    except Exception:
        joined = today - timedelta(days=21)

    days_elapsed = max((today - joined).days, 1)
    num_points = min(max(days_elapsed // 7, 2), 8)
    interval = days_elapsed / (num_points - 1) if num_points > 1 else days_elapsed

    baseline_score = max(score - 30, 5)
    baseline_skills = max(skill_count - 5, 0)
    data = []
    for i in range(num_points - 1):
        dt = joined + timedelta(days=i * interval)
        t = i / (num_points - 1)
        data.append({
            "date": dt.strftime("%b %d"),
            "score": round(baseline_score + (score - baseline_score) * t),
            "skills": round(baseline_skills + (skill_count - baseline_skills) * t),
        })
    # Last point is always today with actual values
    data.append({"date": "Today", "score": score, "skills": skill_count})
    return data

async def get_student_doc(current_user: User) -> Student:
    student = await Student.find_one(Student.email == current_user.email)
    if not student:
        raise HTTPException(404, "Student profile not found")
    return student

async def resolve_application_job(job_id: str) -> dict:
    """Resolve application job info from student jobs or recruiter jobs."""
    job = await Job.get(job_id)
    if job:
        canonical_id = str(job.recruiter_job_id) if getattr(job, "recruiter_job_id", None) else str(job.id)
        return {
            "jobId": canonical_id,
            "title": job.title,
            "company": job.company,
        }

    recruiter_job = await RecruiterJob.get(job_id)
    if recruiter_job:
        profile = await RecruiterProfile.find_one(RecruiterProfile.recruiter_email == recruiter_job.recruiter_email)
        company_name = profile.company_name if profile and profile.company_name else "Unknown Company"
        return {
            "jobId": str(recruiter_job.id),
            "title": recruiter_job.title,
            "company": company_name,
        }

    return {
        "jobId": str(job_id),
        "title": "Unknown Role",
        "company": "Unknown Company",
    }

def application_status_rank(status: str) -> int:
    """Higher rank means further in pipeline; used when deduplicating by job."""
    mapping = {
        "applied": 1,
        "reviewing": 2,
        "shortlisted": 3,
        "interview": 4,
        "offer": 5,
        "hired": 6,
        "rejected": 7,
    }
    return mapping.get((status or "").lower(), 0)

def extract_github_skill_set(github_report: dict) -> set:
    """Extract normalized GitHub-derived skill names from multiple report shapes."""
    if not isinstance(github_report, dict):
        return set()

    skills = set()

    # Shape A: flat fields used by current student endpoints.
    for lang in sl(github_report.get("languages", [])):
        if isinstance(lang, str) and lang.strip():
            skills.add(lang.strip().lower())
    for tech in sl(github_report.get("technologies", [])):
        if isinstance(tech, str) and tech.strip():
            skills.add(tech.strip().lower())

    # Shape B: auditor output { aggregate_stats: { languages: { name: pct } } }.
    aggregate_stats = github_report.get("aggregate_stats", {})
    if isinstance(aggregate_stats, dict):
        langs = aggregate_stats.get("languages", {})
        if isinstance(langs, dict):
            for lang in langs.keys():
                if isinstance(lang, str) and lang.strip():
                    skills.add(lang.strip().lower())

    # Shape C: older nested portfolio format used in gap analyzer.
    portfolio_stats = github_report.get("portfolio_analysis", {}).get("aggregate_stats", {})
    if isinstance(portfolio_stats, dict):
        langs = portfolio_stats.get("languages", {})
        if isinstance(langs, dict):
            for lang in langs.keys():
                if isinstance(lang, str) and lang.strip():
                    skills.add(lang.strip().lower())

    return skills

def calculate_profile_strength(student: Student) -> int:
    strength = 0
    extracted = student.extracted_data or {}
    
    if extracted.get("name"): 
        strength += 20
    if len(student.skills) >= 3: 
        strength += 20
    if student.github_url: 
        strength += 20
    gap_report = extracted.get("gap_report", {})
    if gap_report.get("score", 0) > 0: 
        strength += 20
    if len(extracted.get("professional_history", [])) > 0: 
        strength += 20
        
    return min(strength, 100)

@router.get("/dashboard")
async def get_dashboard(current_user: User = Depends(get_current_user)):
    try:
        student = await get_student_doc(current_user)
        gap_report = student.extracted_data.get("gap_report", {}) if student.extracted_data else {}
        gap_score = gap_report.get("score", 0)
        critical_gap_count = len(gap_report.get("missing_critical", []))
        applications = await Application.find(Application.student_email == student.email).to_list()
        
        interviews = [app for app in applications if app.status == "interview"]
        
        # Format recent applications
        recent_apps = []
        for app in sorted(applications, key=lambda a: a.applied_at, reverse=True)[:5]:
            job = await Job.get(app.job_id)
            title = ss(job.title) if job else "Unknown Job"
            company = ss(job.company) if job else "Unknown Company"
            recent_apps.append({
                "id": str(app.id),
                "jobTitle": title,
                "company": company,
                "status": ss(app.status),
                "appliedDate": app.applied_at.isoformat() if app.applied_at else datetime.utcnow().isoformat(),
            })
            
        # Always suggest some jobs regardless of gap score
        suggested_jobs = []
        all_jobs = await Job.find_all().limit(5).to_list()
        for job in all_jobs:
            suggested_jobs.append({
                "id": str(job.id),
                "title": ss(job.title),
                "company": ss(job.company),
                "location": ss(job.location) or "Sri Lanka",
                "type": "Full-time",
                "matchScore": sn(gap_score) if gap_score > 0 else 65,
                "tags": sl(job.required_skills)[:3],
            })
                
        skill_growth = build_skill_growth(
            score=sn(gap_score),
            skill_count=len(sl(student.skills)),
            created_at=ss(student.created_at),
        )

        # Build real activity feed
        activities = []

        # One entry per application (title + status)
        for app in applications:
            job = await Job.get(app.job_id)
            company = ss(job.company) if job else "a company"
            title = ss(job.title) if job else "a job"
            label, color = STATUS_LABELS.get(ss(app.status), ("Applied", "blue"))
            activity_title = f"Applied to {title}" if label == "Applied" else f"{label}: {title}"
            activities.append({
                "title": activity_title,
                "subtitle": company,
                "color": color,
                "ts": app.applied_at.timestamp() if app.applied_at else 0,
                "time": format_time_ago(app.applied_at) if app.applied_at else "",
            })

        # CV analyzed event
        if student.extracted_data:
            try:
                joined_dt = datetime.fromisoformat(ss(student.created_at).replace("Z", "").split("+")[0])
            except Exception:
                joined_dt = datetime.now()
            activities.append({
                "title": "CV Analyzed",
                "subtitle": f"{len(sl(student.skills))} skills extracted",
                "color": "emerald",
                "ts": joined_dt.timestamp(),
                "time": format_time_ago(joined_dt),
            })

        # Profile created event
        try:
            joined_dt2 = datetime.fromisoformat(ss(student.created_at).replace("Z", "").split("+")[0])
        except Exception:
            joined_dt2 = datetime.now()
        activities.append({
            "title": "Joined SkillSync",
            "subtitle": "Profile created",
            "color": "gray",
            "ts": joined_dt2.timestamp() - 1,  # slightly before CV event
            "time": format_time_ago(joined_dt2),
        })

        activities.sort(key=lambda a: a["ts"], reverse=True)
        recent_activities = [{k: v for k, v in a.items() if k != "ts"} for a in activities[:8]]

        return {
            "kpis": {
                "matchScore": sn(gap_score),
                "appliedCount": sn(len(applications)),
                "interviewCount": sn(len(interviews)),
                "profileStrength": sn(calculate_profile_strength(student)),
                "criticalGapCount": sn(critical_gap_count),
            },
            "skillGrowth": skill_growth,
            "recentActivities": recent_activities,
            "recentApplications": recent_apps,
            "suggestedJobs": suggested_jobs
        }
    except Exception as e:
        print(f"[ERROR] /student/dashboard: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/analysis")
async def get_analysis(current_user: User = Depends(get_current_user)):
    try:
        student = await get_student_doc(current_user)
        extracted = student.extracted_data or {}
        existing_skill_keys = {
            alias
            for skill in sl(student.skills)
            for alias in build_skill_aliases(skill)
            if alias
        }
        target_role = current_user.target_role if getattr(current_user, "target_role", "") else "Software Engineer"
        if not extracted:
            return {
                "targetRole": target_role,
                "score": 0,
                "radarData": [],
                "gaps": [],
                "missingCritical": [],
                "verifiedSkills": [],
                "matchedJobs": [],
                "recommendations": []
            }
            
        gap_report = extracted.get("gap_report", {})
        github_report = extracted.get("github_report") or student.ai_insights or {}
        github_verified_skills = extract_github_skill_set(github_report)
        
        # Radar Data based on Skill Ontology mapping
        radar_data = []
        student_skills_set = set([s.lower() for s in sl(student.skills)])
        for category, skills in SKILL_ONTOLOGY.items():
            matched_count = 0
            for skill in skills:
                skill_lower = skill.lower()
                if any(skill_lower == s or (len(s) > 3 and s in skill_lower) or (len(skill_lower) > 3 and skill_lower in s) for s in student_skills_set):
                    matched_count += 1
            score_val = min(100, matched_count * 25) if matched_count > 0 else 0
            radar_data.append({"subject": category, "A": score_val, "B": 75, "fullMark": 100})
            
        missing_critical = [
            skill for skill in sl(gap_report.get("missing_critical", []))
            if not skill_exists_in_profile(skill, existing_skill_keys)
        ]
        verified_skills = [
            s for s in sl(student.skills)
            if isinstance(s, str) and s.strip().lower() in github_verified_skills
        ][:15]
        gaps = [{"skill": s, "priority": "high"} for s in missing_critical]
        
        recommendations = [
            {"title": f"Learn {s}", "reason": f"{s} is a critical gap for your target role. Add a project demonstrating this skill to your GitHub.", "priority": "high"}
            for s in missing_critical[:5]
        ]
        
        overall_score = sn(gap_report.get("score", 0))
        
        return {
            "targetRole": target_role,
            "score": overall_score,
            "radarData": radar_data,
            "gaps": gaps,
            "missingCritical": missing_critical,
            "verifiedSkills": verified_skills,
            "matchedJobs": [],
            "recommendations": recommendations
        }
    except Exception as e:
        print(f"[ERROR] /student/analysis: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/analysis/gaps")
async def get_analysis_gaps(current_user: User = Depends(get_current_user)):
    try:
        student = await get_student_doc(current_user)
        gap_report = student.extracted_data.get("gap_report", {}) if student.extracted_data else {}
        existing_skill_keys = {
            alias
            for skill in sl(student.skills)
            for alias in build_skill_aliases(skill)
            if alias
        }
        missing_crit = [
            skill for skill in sl(gap_report.get("missing_critical", []))
            if not skill_exists_in_profile(skill, existing_skill_keys)
        ]
        
        gaps = []
        for i, skill in enumerate(missing_crit):
            gaps.append({
                "id": f"gap_{i}",
                "name": skill if isinstance(skill, str) else str(skill),
                "category": "Technical",
                "priority": "Critical" if i < 3 else "High",
                "impact": f"Required for target role",
                "missingPercent": max(30, 90 - (i * 10))
            })
        return gaps
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/analysis/job-matches")
async def get_analysis_job_matches(current_user: User = Depends(get_current_user)):
    try:
        student = await get_student_doc(current_user)
        jobs = await Job.find(Job.source != "Internal").to_list()
        
        results = []
        student_skills = set(s.lower() for s in student.skills)
        for job in jobs[:10]:
            reqs = job.required_skills or []
            matched = [r for r in reqs if r.lower() in student_skills]
            missing = [r for r in reqs if r.lower() not in student_skills]
            score = (len(matched) / max(len(reqs), 1)) * 100
            
            results.append({
                "id": str(job.id),
                "title": ss(job.title),
                "company": ss(job.company),
                "matchScore": round(score),
                "suitabilityPercentage": round(score),
                "salary": "Competitive",
                "description": ss(job.description)[:200] if job.description else "",
                "missingSkills": missing,
                "matchedSkills": matched
            })
            
        return sorted(results, key=lambda x: x["matchScore"], reverse=True)
    except Exception as e:
        print(f"[ERROR] /job-matches: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/cv")
async def get_cv(current_user: User = Depends(get_current_user)):
    try:
        student = await get_student_doc(current_user)
        extracted = student.extracted_data or {}
        contact = extracted.get("contact_info", {})
        
        return {
            "name": extracted.get("name", student.name),
            "email": student.email,
            "phone": contact.get("phone", ""),
            "github": contact.get("github", student.github_url or ""),
            "skills": student.skills,
            "workExperience": student.work_experience,
            "projects": student.project_experience,
            "education": student.education_history
        }
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/cv/analysis")
async def get_cv_analysis(current_user: User = Depends(get_current_user)):
    try:
        student = await get_student_doc(current_user)
        extracted = student.extracted_data or {}
        ats = extracted.get("ats_feedback", {})
        
        score_est = ats.get("score_estimate", "").lower()
        score = 60
        if "high" in score_est: score = 85
        elif "low" in score_est: score = 35
        
        return {
            "score": score,
            "issues": ats.get("critical_issues", []),
            "tips": ats.get("optimization_tips", [])
        }
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.put("/cv")
async def update_cv(updates: dict = Body(...), current_user: User = Depends(get_current_user)):
    try:
        student = await get_student_doc(current_user)
        if not student.extracted_data:
            student.extracted_data = {}
            
        for key in ["name", "workExperience", "projects", "education"]:
            if key in updates:
                map_key = "professional_history" if key == "workExperience" else "project_experience" if key == "projects" else "education_history" if key == "education" else "name"
                student.extracted_data[map_key] = updates[key]
                
        if "skills" in updates:
            student.skills = updates["skills"]
            student.extracted_data["skills"] = updates["skills"]
            
        await student.save()
        return await get_cv(current_user)
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/jobs")
async def search_jobs(
    q: Optional[str] = None, 
    type: Optional[str] = None, 
    location: Optional[str] = None,
    mode: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    try:
        query = {"source": "Internal"}
        if q:
            query["$or"] = [{"title": {"$regex": q, "$options": "i"}}, {"description": {"$regex": q, "$options": "i"}}]
        if location:
            query["location"] = {"$regex": location, "$options": "i"}    
        if type:
            query["type"] = {"$regex": type, "$options": "i"}
        if mode:
            selected_modes = [m.strip().lower().replace("-", " ") for m in mode.split(",") if m.strip()]
            normalized_work_types = []
            for m in selected_modes:
                if m in ["on site", "onsite"]:
                    normalized_work_types.extend(["OnSite", "On Site", "On-Site"])
                elif m == "hybrid":
                    normalized_work_types.append("Hybrid")
                elif m == "remote":
                    normalized_work_types.append("Remote")

            if normalized_work_types:
                query["work_type"] = {"$in": list(set(normalized_work_types))}
            
        # Get student skills for match score calculation
        student = await get_student_doc(current_user)
        student_skills = set(s.lower() for s in sl(student.skills))
            
        total = await Job.find(query).count()
        jobs = await Job.find(query).skip((page - 1) * limit).limit(limit).to_list()
        
        formatted = []
        for job in jobs:
            reqs = sl(job.required_skills)
            matched = [r for r in reqs if r.lower() in student_skills]
            missing = [r for r in reqs if r.lower() not in student_skills]
            match_score = round((len(matched) / max(len(reqs), 1)) * 100)
            
            formatted.append({
                "id": str(job.id),
                "title": ss(job.title),
                "company": ss(job.company),
                "location": ss(job.location) or "Sri Lanka",
                "type": getattr(job, "type", "Full-time"),
                "description": ss(job.description),
                "requirements": sl(job.required_skills),
                "niceToHave": sl(job.nice_to_have),
                "postedDate": job.created_at.isoformat(),
                "salary": f"LKR {job.salary_min}k - {job.salary_max}k" if getattr(job, "salary_min", 0) > 0 else "Negotiable",
                "tags": sl(job.required_skills)[:3],
                "category": getattr(job, "department", "Engineering"),
                "matchScore": match_score,
                "matchedSkills": matched,
                "missingSkills": missing,
            })
        
        # Sort by match score descending
        formatted.sort(key=lambda x: x["matchScore"], reverse=True)
            
        return {
            "jobs": formatted,
            "total": total,
            "page": page,
            "totalPages": math.ceil(total / limit) if limit > 0 else 1
        }
    except Exception as e:
        print(f"[ERROR] /jobs: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/jobs/{job_id}")
async def get_job_detail(job_id: str, current_user: User = Depends(get_current_user)):
    try:
        job = await Job.get(job_id)
        if not job: raise HTTPException(404, "Job not found")
        return {
            "id": str(job.id),
            "title": job.title,
            "company": job.company,
            "location": job.location or "Sri Lanka",
            "type": "Full-time",
            "description": job.description,
            "requirements": job.required_skills,
            "niceToHave": job.nice_to_have,
            "postedDate": job.created_at.isoformat(),
            "salary": None,
            "tags": job.required_skills[:3] if job.required_skills else [],
            "category": getattr(job, "job_category", "Engineering")
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/jobs/{job_id}/analysis")
async def analyze_job(job_id: str, current_user: User = Depends(get_current_user)):
    try:
        job = await Job.get(job_id)
        if not job: raise HTTPException(404, "Job not found")
        student = await get_student_doc(current_user)
        
        student_skills = set(s.lower() for s in student.skills)
        reqs = job.required_skills or []
        matched = [r for r in reqs if r.lower() in student_skills]
        missing = [r for r in reqs if r.lower() not in student_skills]
        score = (len(matched) / max(len(reqs), 1)) * 100
        
        desc = "Strong match" if score >= 80 else "Good fit" if score >= 50 else "Needs work"
        
        return {
            "matchScore": round(score),
            "matchedSkills": matched,
            "missingSkills": missing,
            "recommendation": desc
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.post("/jobs/{job_id}/apply")
async def apply_job(job_id: str, current_user: User = Depends(get_current_user)):
    try:
        student = await get_student_doc(current_user)
        actual_job_id = job_id

        # 1) Resolve via student-facing Job id (normal student flow)
        student_job = None
        try:
            student_job = await Job.get(job_id)
        except Exception:
            student_job = None

        if student_job:
            # Preferred explicit link for internal mirrored jobs
            if getattr(student_job, "recruiter_job_id", None):
                actual_job_id = student_job.recruiter_job_id
            # Backward compatibility for older internal jobs that missed recruiter_job_id
            elif getattr(student_job, "source", "").lower() == "internal":
                recruiter_job = await RecruiterJob.find_one(
                    RecruiterJob.title == student_job.title,
                    RecruiterJob.location == student_job.location,
                    RecruiterJob.type == student_job.type,
                )
                if recruiter_job:
                    actual_job_id = str(recruiter_job.id)
        else:
            # 2) If not a student Job id, allow direct recruiter job id
            recruiter_job = None
            try:
                recruiter_job = await RecruiterJob.get(job_id)
            except Exception:
                recruiter_job = None

            if recruiter_job:
                actual_job_id = job_id
            else:
                raise HTTPException(404, "Job not found")
        
        existing = await Application.find_one(Application.job_id == actual_job_id, Application.student_email == student.email)
        if existing:
            print(f"[APPLY] Already applied to {actual_job_id}")
            return {"success": True, "message": "Already applied"}
            
        app = Application(
            student_email=student.email,
            student_id=str(student.id),
            job_id=actual_job_id,
            status="applied"
        )
        await app.insert()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR apply_job]: {e}")
        raise HTTPException(500, "Internal error")

@router.post("/jobs/{job_id}/save")
async def save_job(job_id: str, current_user: User = Depends(get_current_user)):
    try:
        student = await get_student_doc(current_user)
        if job_id not in student.saved_jobs:
            student.saved_jobs.append(job_id)
            await student.save()
        return {"success": True}
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.delete("/jobs/{job_id}/save")
async def unsave_job(job_id: str, current_user: User = Depends(get_current_user)):
    try:
        student = await get_student_doc(current_user)
        if job_id in student.saved_jobs:
            student.saved_jobs.remove(job_id)
            await student.save()
        return {"success": True}
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/applications")
async def get_applications(status: Optional[str] = None, current_user: User = Depends(get_current_user)):
    try:
        query = {"student_email": current_user.email}
        if status:
            query["status"] = status

        apps = await Application.find(query).to_list()

        # Deduplicate by canonical jobId (covers student/recruiter id variants for same posting).
        deduped: dict = {}
        for app in apps:
            job_info = await resolve_application_job(app.job_id)
            canonical_id = job_info["jobId"]
            candidate = {
                "id": str(app.id),
                "jobId": canonical_id,
                "jobTitle": job_info["title"],
                "company": job_info["company"],
                "status": app.status,
                "appliedAt": app.applied_at.isoformat(),
                "tags": app.tags,
                "_rank": application_status_rank(app.status),
                "_appliedAt": app.applied_at,
            }

            existing = deduped.get(canonical_id)
            if not existing:
                deduped[canonical_id] = candidate
            else:
                if candidate["_rank"] > existing["_rank"] or (
                    candidate["_rank"] == existing["_rank"] and candidate["_appliedAt"] > existing["_appliedAt"]
                ):
                    deduped[canonical_id] = candidate

        formatted = []
        stats = {"total": 0, "active": 0, "interviews": 0, "offers": 0, "rejected": 0}
        for item in deduped.values():
            stats["total"] += 1
            if item["status"] in ["applied", "reviewing", "shortlisted", "interview"]:
                stats["active"] += 1
            if item["status"] == "interview":
                stats["interviews"] += 1
            if item["status"] in ["offer", "hired"]:
                stats["offers"] += 1
            if item["status"] == "rejected":
                stats["rejected"] += 1

            formatted.append({
                "id": item["id"],
                "jobId": item["jobId"],
                "jobTitle": item["jobTitle"],
                "company": item["company"],
                "status": item["status"],
                "appliedAt": item["appliedAt"],
                "tags": item["tags"],
            })

        return {
            "applications": formatted,
            "stats": stats
        }
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/applications/{app_id}")
async def get_application_detail(app_id: str, current_user: User = Depends(get_current_user)):
    try:
        app = await Application.get(app_id)
        if not app or app.student_email != current_user.email:
            raise HTTPException(404, "Application not found")
        job_info = await resolve_application_job(app.job_id)
        return {
            "id": str(app.id),
            "jobId": job_info["jobId"],
            "role": job_info["title"],
            "company": job_info["company"],
            "stage": app.status,
            "appliedDate": app.applied_at.isoformat(),
            "tags": app.tags,
            "notes": app.notes
        }
    except HTTPException: raise
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.delete("/applications/{app_id}")
async def withdraw_application(app_id: str, current_user: User = Depends(get_current_user)):
    try:
        app = await Application.get(app_id)
        if not app or app.student_email != current_user.email:
            raise HTTPException(404, "Application not found")
        app.status = "withdrawn"
        await app.save()
        return {"success": True}
    except HTTPException: raise
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    try:
        student = await get_student_doc(current_user)
        extracted = student.extracted_data or {}
        gap_score = extracted.get("gap_report", {}).get("score", 0)
        availability = ss(extracted.get("availability") or "open").strip().lower()
        if availability not in ["looking", "open", "not_looking"]:
            availability = "open"
        
        # Build rich skills list with verification from GitHub
        github_report = extracted.get("github_report") or student.ai_insights or {}
        completed_learning_skills = {
            ss(skill).strip().lower()
            for skill in sl(extracted.get("completed_learning_skills", []))
            if ss(skill).strip()
        }
        manual_profile_skills = {
            ss(skill).strip().lower()
            for skill in sl(extracted.get("manual_profile_skills", []))
            if ss(skill).strip()
        }
        github_langs = extract_github_skill_set(github_report)
        
        rich_skills = []
        for s in sl(student.skills):
            skill_name = ss(s).strip()
            if not skill_name:
                continue
            skill_key = skill_name.lower()
            is_learning_completed = skill_key in completed_learning_skills
            is_manual_profile_skill = skill_key in manual_profile_skills
            is_verified = skill_key in github_langs
            rich_skills.append({
                "name": skill_name,
                "level": "Advanced" if is_verified else "Intermediate",
                "source": "github" if skill_key in github_langs else "manual" if (is_learning_completed or is_manual_profile_skill) else "cv",
                "verified": is_verified
            })
        
        # Build experience from student.work_experience
        experience = []
        for i, exp in enumerate(sl(student.work_experience)):
            if isinstance(exp, dict):
                experience.append({
                    "id": f"exp_{i}",
                    "role": exp.get("role", exp.get("title", "Unknown Role")),
                    "company": exp.get("company", "Unknown"),
                    "duration": exp.get("duration", ""),
                    "type": exp.get("type", "Full-time"),
                    "description": exp.get("description", ""),
                    "skillsUsed": exp.get("key_tasks", exp.get("skills", [])),
                })
        
        # Build projects from student.project_experience
        projects = []
        for i, proj in enumerate(sl(student.project_experience)):
            if isinstance(proj, dict):
                projects.append({
                    "id": f"proj_{i}",
                    "title": proj.get("name", proj.get("title", f"Project {i+1}")),
                    "description": proj.get("description", ""),
                    "techStack": proj.get("technologies", proj.get("tech_stack", [])),
                })
            elif isinstance(proj, str):
                projects.append({
                    "id": f"proj_{i}",
                    "title": proj,
                    "description": "",
                    "techStack": [],
                })
        
        # Build education from student.education_history
        education = []
        for i, edu in enumerate(sl(student.education_history)):
            if isinstance(edu, dict):
                education.append({
                    "id": f"edu_{i}",
                    "institution": edu.get("institution", edu.get("university", "Unknown")),
                    "degree": edu.get("degree", edu.get("program", "")),
                    "year": edu.get("year", edu.get("graduation_year", "")),
                    "grade": edu.get("grade", edu.get("gpa", "")),
                    "modules": edu.get("modules", edu.get("courses", [])),
                })
        
        return {
            "id": str(student.id),
            "name": student.name or current_user.name,
            "email": student.email,
            "university": "IIT Sri Lanka",
            "course": student.course or "",
            "avatarUrl": student.avatar_url or "",
            "availability": availability,
            "skills": rich_skills,
            "githubUrl": student.github_url or "",
            "gapScore": gap_score,
            "profileStrength": calculate_profile_strength(student),
            "projects": projects,
            "experience": experience,
            "education": education,
        }
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.patch("/profile")
async def update_profile(updates: dict = Body(...), current_user: User = Depends(get_current_user)):
    try:
        student = await get_student_doc(current_user)
        extracted = student.extracted_data or {}
        
        if "name" in updates: student.name = updates["name"]
        if "course" in updates: student.course = updates["course"]
        if "skills" in updates: student.skills = updates["skills"]
        if "githubUrl" in updates: student.github_url = updates["githubUrl"]
        if "availability" in updates:
            new_availability = ss(updates.get("availability")).strip().lower()
            if new_availability not in ["looking", "open", "not_looking"]:
                raise HTTPException(400, "Invalid availability value")
            extracted["availability"] = new_availability
            student.extracted_data = extracted
            
        await student.save()
        return await get_profile(current_user)
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.post("/profile/skills")
async def add_profile_skill(data: dict = Body(...), current_user: User = Depends(get_current_user)):
    try:
        student = await get_student_doc(current_user)
        skill_name = ss(data.get("name") or data.get("skill")).strip()
        if not skill_name:
            raise HTTPException(400, "Skill name is required")

        extracted = student.extracted_data or {}
        manual_profile = sl(extracted.get("manual_profile_skills", []))
        manual_profile_norm = {ss(s).strip().lower() for s in manual_profile if ss(s).strip()}

        existing = {ss(s).strip().lower() for s in sl(student.skills) if ss(s).strip()}
        if skill_name.lower() not in existing:
            student.skills.append(skill_name)

        # Ensure this skill is always tagged as self-reported.
        if skill_name.lower() not in manual_profile_norm:
            manual_profile.append(skill_name)
            extracted["manual_profile_skills"] = manual_profile
            student.extracted_data = extracted

        await student.save()

        return await get_profile(current_user)
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.post("/profile/skills/remove")
async def remove_profile_skill(data: dict = Body(...), current_user: User = Depends(get_current_user)):
    try:
        student = await get_student_doc(current_user)
        skill_name = ss(data.get("name") or data.get("skill")).strip()
        if not skill_name:
            raise HTTPException(400, "Skill name is required")

        skill_key = skill_name.lower()
        existing_skills = sl(student.skills)
        student.skills = [s for s in existing_skills if ss(s).strip().lower() != skill_key]

        extracted = student.extracted_data or {}
        gap_report = extracted.get("gap_report", {}) if isinstance(extracted.get("gap_report", {}), dict) else {}
        missing_critical = sl(gap_report.get("missing_critical", []))
        missing_critical_norm = {ss(s).strip().lower() for s in missing_critical if ss(s).strip()}

        # Remove from all profile/learning bookkeeping lists so UI stays consistent.
        for key in ["manual_profile_skills", "completed_learning_skills", "manual_learning_skills"]:
            values = sl(extracted.get(key, []))
            extracted[key] = [s for s in values if ss(s).strip().lower() != skill_key]

        # Put removed profile skill back into gap analysis so user can relearn it.
        if skill_key and skill_key not in missing_critical_norm:
            missing_critical.insert(0, skill_name)
            gap_report["missing_critical"] = missing_critical
            extracted["gap_report"] = gap_report

        # Reset all path progress for this skill so a re-added path starts from the beginning.
        target_slug = skill_slug(skill_name)
        progress = dict(student.learning_progress or {})
        stale_progress_keys = []
        for path_key in progress.keys():
            path_slug = extract_skill_slug_from_path_id(path_key)
            if path_slug and path_slug == target_slug:
                stale_progress_keys.append(path_key)
        for key in stale_progress_keys:
            progress.pop(key, None)
        student.learning_progress = progress

        # Also un-hide previously removed path variants for this skill.
        removed_paths = sl(extracted.get("removed_learning_paths", []))
        extracted["removed_learning_paths"] = [
            p for p in removed_paths
            if extract_skill_slug_from_path_id(ss(p).strip()) != target_slug
        ]

        student.extracted_data = extracted
        await student.save()

        return await get_profile(current_user)
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.post("/profile/verify-github")
async def verify_github_profile(current_user: User = Depends(get_current_user)):
    try:
        student = await get_student_doc(current_user)
        github_url = ss(student.github_url).strip()
        if not github_url:
            raise HTTPException(400, "Connect a GitHub profile first")

        github_report = await services.GitHubAuditorTool().audit_repo(github_url)
        if not isinstance(github_report, dict) or github_report.get("error"):
            error_message = "GitHub verification failed"
            if isinstance(github_report, dict):
                error_message = ss(github_report.get("error")) or error_message
            raise HTTPException(400, error_message)

        extracted = student.extracted_data or {}
        extracted["github_report"] = github_report

        # Keep older API consumers compatible by exposing a simple languages list.
        if not extracted["github_report"].get("languages"):
            extracted["github_report"]["languages"] = [s.title() for s in sorted(extract_github_skill_set(github_report))]

        # If market requirements already exist, refresh gap report with the new GitHub evidence.
        market_requirements = extracted.get("market_requirements")
        if isinstance(market_requirements, dict) and market_requirements:
            education_history = sl(extracted.get("education_history", []))
            university_info = {"name": "", "degree": "", "gpa": 0.0}
            if education_history and isinstance(education_history[0], dict):
                first_edu = education_history[0]
                university_info = {
                    "name": ss(first_edu.get("institution", "")),
                    "degree": ss(first_edu.get("degree", "")),
                    "gpa": first_edu.get("gpa", first_edu.get("year", "0.0")),
                }

            gap_report = services.GapAnalysisTool().analyze_weighted_gap(
                student_skills=sl(student.skills),
                market_requirements=market_requirements,
                github_report=github_report,
                university_info=university_info,
            )
            extracted["gap_report"] = gap_report
            student.ai_insights = gap_report

        student.extracted_data = extracted
        await student.save()

        return {
            "success": True,
            "verifiedSkills": sorted(extract_github_skill_set(github_report)),
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/settings")
async def get_settings(current_user: User = Depends(get_current_user)):
    try:
        return {
            "email": current_user.email,
            "notifications": current_user.notifications or {
                "jobAlerts": True, "applicationUpdates": True,
                "messages": True, "weeklyDigest": False
            },
            "privacy": current_user.privacy or {
                "profileVisible": True,
                "showGitHub": True,
                "showEmail": False
            }
        }
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.put("/settings")
async def update_settings(updates: dict = Body(...), current_user: User = Depends(get_current_user)):
    try:
        if "notifications" in updates:
            current_user.notifications = updates["notifications"]
        if "privacy" in updates:
            current_user.privacy = updates["privacy"]
        await current_user.save()
        return await get_settings(current_user)
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.post("/settings/change-password")
async def change_password(data: dict = Body(...), current_user: User = Depends(get_current_user)):
    from auth.utils import verify_password, hash_password
    try:
        current = data.get("currentPassword")
        new_pwd = data.get("newPassword")
        
        if not verify_password(current, current_user.hashed_password):
            raise HTTPException(401, "Invalid current password")
            
        current_user.hashed_password = hash_password(new_pwd)
        await current_user.save()
        return {"success": True}
    except HTTPException: raise
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.delete("/settings/account")
async def delete_account(current_user: User = Depends(get_current_user)):
    try:
        email = current_user.email

        # Remove student-owned records first to avoid orphan data.
        student = await Student.find_one(Student.email == email)
        if student:
            await student.delete()

        applications = await Application.find(Application.student_email == email).to_list()
        for app in applications:
            await app.delete()

        conversations = await Conversation.find({"participants": email}).to_list()
        for convo in conversations:
            await convo.delete()

        # Remove student from recruiter saved lists.
        recruiter_profiles = await RecruiterProfile.find_all().to_list()
        for profile in recruiter_profiles:
            if email in (profile.saved_candidates or []):
                profile.saved_candidates = [c for c in (profile.saved_candidates or []) if c != email]
                await profile.save()

        # Finally remove auth account record itself.
        await current_user.delete()
        return {"success": True}
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/messages/{convo_id}")
async def get_message_detail(convo_id: str, current_user: User = Depends(get_current_user)):
    try:
        c = await Conversation.get(convo_id)
        if not c or current_user.email not in c.participants:
            raise HTTPException(404, "Conversation not found")
        return {
            "id": str(c.id),
            "participants": c.participants,
            "messages": [m.dict() for m in c.messages],
            "updatedAt": c.updated_at.isoformat()
        }
    except HTTPException: raise
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.post("/messages/{convo_id}")
async def send_message(convo_id: str, data: dict = Body(...), current_user: User = Depends(get_current_user)):
    try:
        import uuid
        c = await Conversation.get(convo_id)
        if not c or current_user.email not in c.participants:
            raise HTTPException(404, "Conversation not found")
            
        m = Message(
            id=str(uuid.uuid4()),
            senderId=current_user.email,
            text=data.get("text", "")
        )
        c.messages.append(m)
        c.last_message = m.text
        c.updated_at = datetime.now()
        await c.save()
        return {"success": True}
    except HTTPException: raise
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.patch("/messages/{convo_id}/read")
async def mark_messages_read(convo_id: str, current_user: User = Depends(get_current_user)):
    try:
        c = await Conversation.get(convo_id)
        if not c or current_user.email not in c.participants:
            raise HTTPException(404, "Conversation not found")
        for m in c.messages:
            if m.senderId != current_user.email:
                m.read = True
        await c.save()
        return {"success": True}
    except HTTPException: raise
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/learning-paths")
async def get_learning_paths(current_user: User = Depends(get_current_user)):
    try:
        student = await get_student_doc(current_user)
        extracted = student.extracted_data or {}
        gap_report = extracted.get("gap_report", {})
        market_reqs = extracted.get("market_requirements", {})
        profile_skills = {
            alias
            for skill in sl(student.skills)
            for alias in build_skill_aliases(skill)
            if alias
        }
        
        missing_crit = sl(gap_report.get("missing_critical", []))
        must_haves = sl(market_reqs.get("must_have", []))
        manual_skills = sl(extracted.get("manual_learning_skills", []))
        
        target = current_user.target_role if getattr(current_user, "target_role", "") else "Software Engineer"
        
        def make_nodes(skill):
            """Generate simple task nodes for a skill"""
            slug = skill_slug(skill)
            return [
                {"id": f"n_{slug}_1", "title": f"Study {skill} Basics", "status": "locked", "type": "task", "description": f"Research and understand the fundamental concepts of {skill}.", "skills": [skill]},
                {"id": f"n_{slug}_2", "title": f"Implement {skill} in a Project", "status": "locked", "type": "task", "description": f"Apply your {skill} knowledge by building a small practical project.", "skills": [skill]},
                {"id": f"n_{slug}_3", "title": f"Verify {skill} Proficiency", "status": "locked", "type": "task", "description": f"Complete a self-assessment or peer review to confirm your mastery of {skill}.", "skills": [skill]}
            ]
        
        dynamic_paths = []
        
        # 1. Generate paths manually added from Skill Gaps tab.
        added_skills = set()
        for skill in manual_skills:
            skill_name = ss(skill).strip()
            if not skill_name:
                continue
            skill_key = skill_name.lower()
            if skill_key in added_skills:
                continue
            path_id = f"path_manual_{skill_slug(skill_name)}"
            nodes = make_nodes(skill_name)
            if nodes:
                nodes[0]["status"] = "in-progress"
            dynamic_paths.append({
                "id": path_id,
                "title": f"Mastering {skill_name}",
                "description": f"A personalized track you added for {skill_name} to boost your {target} readiness.",
                "skills": [skill_name],
                "progress": student.learning_progress.get(path_id, 0),
                "estimatedHours": 12,
                "jobGoal": target,
                "totalCourses": len(nodes),
                "completedCourses": 0,
                "companyTarget": "Top Tier",
                "nodes": nodes,
                "resources": []
            })
            added_skills.add(skill_key)

        # 2. Generate paths for missing critical skills (high priority)
        for i, skill in enumerate(missing_crit[:3]):
            if skill_exists_in_profile(skill, profile_skills):
                continue
            if ss(skill).lower() in added_skills:
                continue
            path_id = f"path_gap_{i}_{skill_slug(skill)}"
            nodes = make_nodes(skill)
            # Mark first node as active
            if nodes:
                nodes[0]["status"] = "in-progress"
            dynamic_paths.append({
                "id": path_id,
                "title": f"Mastering {skill}",
                "description": f"A targeted track to bridge your gap in {skill}, essential for {target} roles.",
                "skills": [skill], 
                "progress": student.learning_progress.get(path_id, 0),
                "estimatedHours": 15,
                "jobGoal": target,
                "totalCourses": len(nodes),
                "completedCourses": 0,
                "companyTarget": "Top Tier",
                "nodes": nodes,
                "resources": []
            })
            
        # 3. Add remaining must_haves if less than 4 total paths
        added_skills.update([s.lower() for s in missing_crit[:3]])
        for skill in must_haves:
            if len(dynamic_paths) >= 4:
                break
            if skill_exists_in_profile(skill, profile_skills):
                continue
            if skill.lower() not in added_skills:
                path_id = f"path_req_{skill_slug(skill)}"
                nodes = make_nodes(skill)
                if nodes:
                    nodes[0]["status"] = "in-progress"
                dynamic_paths.append({
                    "id": path_id,
                    "title": f"Advancing in {skill}",
                    "description": f"Strengthen your expertise in {skill} to remain competitive for {target} roles.",
                    "skills": [skill],
                    "progress": student.learning_progress.get(path_id, 0),
                    "estimatedHours": 10,
                    "jobGoal": target,
                    "totalCourses": len(nodes),
                    "completedCourses": 0,
                    "companyTarget": "Tech Companies",
                    "nodes": nodes,
                    "resources": []
                })
                added_skills.add(skill.lower())
                
        # 4. Fallback if no data
        if len(dynamic_paths) == 0:
            dynamic_paths.append({
                "id": "path_fundamentals",
                "title": f"Core {target} Fundamentals",
                "description": "Essential foundations for your target role. Run an analysis to get a personalized path.",
                "skills": ["General"],
                "progress": student.learning_progress.get("path_fundamentals", 0),
                "estimatedHours": 20,
                "jobGoal": target,
                "totalCourses": 3,
                "completedCourses": 0,
                "companyTarget": "Any",
                "nodes": [
                    {"id": "n_general_1", "title": "Upload Your CV & Analyze", "status": "in-progress", "type": "course", "duration": "5 min", "description": "Start by uploading your CV and running the AI analysis.", "skills": []},
                    {"id": "n_general_2", "title": "Review Gap Report", "status": "locked", "type": "course", "duration": "10 min", "description": "Understand your skill gaps and areas to improve.", "skills": []},
                    {"id": "n_general_3", "title": "Build Your First Project", "status": "locked", "type": "project", "duration": "1 week", "description": "Create a portfolio project showcasing your skills.", "skills": []}
                ],
                "resources": []
            })
            
        def _completed_node_ids_for_path(path_id: str, path_nodes: list) -> set:
            raw_state = student.learning_progress.get(path_id, {})

            # New format: { completedNodeIds: string[] }
            if isinstance(raw_state, dict):
                return {ss(node_id) for node_id in sl(raw_state.get("completedNodeIds", [])) if ss(node_id)}

            # Legacy format compatibility: numeric percentage.
            if isinstance(raw_state, (int, float)) and len(path_nodes) > 0:
                completed_count = max(0, min(len(path_nodes), int(round((float(raw_state) / 100) * len(path_nodes)))))
                return {ss(n.get("id")) for n in path_nodes[:completed_count] if ss(n.get("id"))}

            return set()

        removed_path_ids = {
            ss(path_id).strip()
            for path_id in sl(extracted.get("removed_learning_paths", []))
            if ss(path_id).strip()
        }

        # Normalize each path from persisted completion state and hide only user-removed paths.
        visible_paths = []
        for path_obj in dynamic_paths:
            path_nodes = sl(path_obj.get("nodes", []))
            path_id = ss(path_obj.get("id"))
            completed_ids = _completed_node_ids_for_path(ss(path_obj.get("id")), path_nodes)

            completed_count = 0
            activated_next = False

            for node in path_nodes:
                node_id = ss(node.get("id"))
                if node_id and node_id in completed_ids:
                    node["status"] = "completed"
                    completed_count += 1
                elif not activated_next:
                    node["status"] = "in-progress"
                    activated_next = True
                else:
                    node["status"] = "locked"

            total_nodes = len(path_nodes)
            path_obj["totalCourses"] = total_nodes
            path_obj["completedCourses"] = completed_count
            path_obj["progress"] = round((completed_count / max(total_nodes, 1)) * 100)

            if path_id and path_id not in removed_path_ids:
                visible_paths.append(path_obj)

        return visible_paths
        
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.post("/learning-paths/add-skill")
async def add_skill_to_learning_path(data: dict = Body(...), current_user: User = Depends(get_current_user)):
    try:
        skill_name = ss(data.get("skill")).strip()
        if not skill_name:
            raise HTTPException(400, "skill is required")

        student = await get_student_doc(current_user)
        extracted = student.extracted_data or {}
        manual_skills = sl(extracted.get("manual_learning_skills", []))

        existing = {ss(s).strip().lower() for s in manual_skills if ss(s).strip()}
        if skill_name.lower() in existing:
            return {"success": True, "alreadyAdded": True}

        # Keep newest added skill first so it is immediately visible in UI.
        manual_skills.insert(0, skill_name)
        extracted["manual_learning_skills"] = manual_skills

        # If the same path was removed earlier, restore it when skill is manually re-added.
        path_id = f"path_manual_{skill_slug(skill_name)}"
        removed_paths = sl(extracted.get("removed_learning_paths", []))
        extracted["removed_learning_paths"] = [p for p in removed_paths if ss(p).strip() != path_id]

        student.extracted_data = extracted
        await student.save()

        return {"success": True, "alreadyAdded": False}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.patch("/learning-paths/{path_id}/nodes/{node_id}")
async def update_learning_progress(path_id: str, node_id: str, data: dict = Body(...), current_user: User = Depends(get_current_user)):
    try:
        student = await get_student_doc(current_user)

        existing_state = student.learning_progress.get(path_id, {})
        if isinstance(existing_state, dict):
            completed_ids = {ss(node) for node in sl(existing_state.get("completedNodeIds", [])) if ss(node)}
        else:
            completed_ids = set()

        completed_flag = data.get("completed")
        progress_value = data.get("progress")

        if completed_flag is True or (isinstance(progress_value, (int, float)) and progress_value >= 100):
            completed_ids.add(node_id)
        elif completed_flag is False:
            completed_ids.discard(node_id)

        # If all tasks for a skill path are completed, promote that skill as completed.
        # Node IDs are generated as n_<skill_slug>_<step> where step is 1..3.
        skill_slug = ""
        if node_id.startswith("n_") and "_" in node_id[2:]:
            skill_slug = node_id[2:].rsplit("_", 1)[0]

        if skill_slug:
            expected_node_ids = {
                f"n_{skill_slug}_1",
                f"n_{skill_slug}_2",
                f"n_{skill_slug}_3",
            }

            if expected_node_ids.issubset(completed_ids) and skill_slug != "general":
                extracted = student.extracted_data or {}
                gap_report = extracted.get("gap_report", {}) if isinstance(extracted.get("gap_report", {}), dict) else {}

                manual_skills = sl(extracted.get("manual_learning_skills", []))
                missing_crit = sl(gap_report.get("missing_critical", []))
                must_haves = sl((extracted.get("market_requirements") or {}).get("must_have", [])) if isinstance(extracted.get("market_requirements"), dict) else []

                # Resolve display name from known skill lists first to preserve casing.
                known_skills = [
                    *[ss(s) for s in manual_skills],
                    *[ss(s) for s in missing_crit],
                    *[ss(s) for s in must_haves],
                ]
                skill_name = ""
                for candidate in known_skills:
                    if candidate.strip().lower().replace(" ", "_") == skill_slug:
                        skill_name = candidate.strip()
                        break
                if not skill_name:
                    skill_name = skill_slug.replace("_", " ").strip()

                if skill_name:
                    # Add to primary profile skills for Profile + Skill Analysis pages.
                    existing_profile_skills = {ss(s).strip().lower() for s in sl(student.skills) if ss(s).strip()}
                    if skill_name.lower() not in existing_profile_skills:
                        student.skills.append(skill_name)

                    # Track completed learning skills.
                    completed_learning = sl(extracted.get("completed_learning_skills", []))
                    completed_learning_norm = {ss(s).strip().lower() for s in completed_learning if ss(s).strip()}
                    if skill_name.lower() not in completed_learning_norm:
                        completed_learning.append(skill_name)
                        extracted["completed_learning_skills"] = completed_learning

                    # Remove from critical missing list once learned.
                    gap_report["missing_critical"] = [
                        s for s in missing_crit if ss(s).strip().lower() != skill_name.lower()
                    ]
                    extracted["gap_report"] = gap_report
                    student.extracted_data = extracted

        student.learning_progress[path_id] = {
            "completedNodeIds": list(completed_ids)
        }
        await student.save()
        return {"success": True}
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.delete("/learning-paths/{path_id}")
async def remove_learning_path(path_id: str, current_user: User = Depends(get_current_user)):
    try:
        student = await get_student_doc(current_user)
        extracted = student.extracted_data or {}
        progress_state = student.learning_progress.get(path_id, {})

        # For completed paths, persist the path skill in profile before removing the path.
        completed_ids = set()
        if isinstance(progress_state, dict):
            completed_ids = {ss(node_id) for node_id in sl(progress_state.get("completedNodeIds", [])) if ss(node_id)}
        path_is_completed = len(completed_ids) >= 3

        if path_is_completed:
            slug_value = extract_skill_slug_from_path_id(path_id)
            candidate_skills = [
                *sl(extracted.get("manual_learning_skills", [])),
                *sl((extracted.get("gap_report", {}) or {}).get("missing_critical", [])),
                *sl((extracted.get("market_requirements", {}) or {}).get("must_have", [])),
                *sl(student.skills),
            ]
            resolved_skill = resolve_skill_name_from_slug(slug_value, candidate_skills)
            if resolved_skill:
                existing_profile = {ss(s).strip().lower() for s in sl(student.skills) if ss(s).strip()}
                if resolved_skill.lower() not in existing_profile:
                    student.skills.append(resolved_skill)

                completed_learning = sl(extracted.get("completed_learning_skills", []))
                completed_norm = {ss(s).strip().lower() for s in completed_learning if ss(s).strip()}
                if resolved_skill.lower() not in completed_norm:
                    completed_learning.append(resolved_skill)
                    extracted["completed_learning_skills"] = completed_learning

        removed_paths = sl(extracted.get("removed_learning_paths", []))

        normalized = {ss(p).strip() for p in removed_paths if ss(p).strip()}
        if path_id not in normalized:
            removed_paths.append(path_id)
            extracted["removed_learning_paths"] = removed_paths
            student.extracted_data = extracted
            await student.save()
        else:
            student.extracted_data = extracted
            await student.save()

        return {"success": True}
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.post("/applications")
async def apply_to_job_direct(data: dict = Body(...), current_user: User = Depends(get_current_user)):
    """Student applies to a job by ID (student Job ID or RecruiterJob ID)."""
    try:
        job_id = data.get("jobId", "")
        if not job_id:
            raise HTTPException(400, "jobId is required")

        # Resolve canonical job ID (same logic as /jobs/{id}/apply)
        actual_job_id = job_id
        student_job = None
        try:
            student_job = await Job.get(job_id)
        except Exception:
            student_job = None

        if student_job:
            if getattr(student_job, "recruiter_job_id", None):
                actual_job_id = student_job.recruiter_job_id
            elif getattr(student_job, "source", "").lower() == "internal":
                recruiter_job = await RecruiterJob.find_one(
                    RecruiterJob.title == student_job.title,
                    RecruiterJob.location == student_job.location,
                )
                if recruiter_job:
                    actual_job_id = str(recruiter_job.id)
        else:
            recruiter_job = None
            try:
                recruiter_job = await RecruiterJob.get(job_id)
            except Exception:
                recruiter_job = None
            if not recruiter_job:
                raise HTTPException(404, "Job not found")

        existing = await Application.find_one({"student_email": current_user.email, "job_id": actual_job_id})
        if existing:
            return {"success": True, "message": "Already applied", "applicationId": str(existing.id)}

        student = await get_student_doc(current_user)
        app = Application(
            student_email=current_user.email,
            student_id=str(student.id),
            job_id=actual_job_id,
            status="applied",
        )
        await app.insert()
        return {"success": True, "applicationId": str(app.id)}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR apply direct]: {e}")
        raise HTTPException(500, "Internal error")

# ─── Student Messaging ────────────────────────────────────────────────────────

import uuid as _uuid

def _student_initials(name: str) -> str:
    parts = (name or "?").split()
    return (parts[0][0] + parts[-1][0]).upper() if len(parts) >= 2 else parts[0][:2].upper()

@router.get("/messages")
async def get_student_conversations(current_user: User = Depends(get_current_user)):
    """List all conversations the student is part of."""
    try:
        convs = await Conversation.find({"participants": current_user.email}).to_list()
        result = []
        for conv in convs:
            other_email = next((p for p in conv.participants if p != current_user.email), "")
            # Try to find recruiter name from User model
            from auth.models import User as AuthUser
            other_user = await AuthUser.find_one(AuthUser.email == other_email)
            other_name = other_user.name if other_user else other_email

            msgs = []
            for m in conv.messages:
                # Mark messages from other party as read since student opened it
                sender_role = "me" if m.senderId == current_user.email else "them"
                msgs.append({
                    "id": m.id,
                    "sender": sender_role,
                    "senderName": other_name if sender_role == "them" else "You",
                    "text": m.text,
                    "timestamp": m.timestamp.isoformat(),
                    "timestampMs": int(m.timestamp.timestamp() * 1000),
                    "read": m.read,
                })

            unread = sum(1 for m in conv.messages if m.senderId != current_user.email and not m.read)
            result.append({
                "id": str(conv.id),
                "recruiterId": other_email,
                "recruiterName": other_name,
                "initials": _student_initials(other_name),
                "jobContext": {
                    "title": ss(getattr(conv, "job_title", "")),
                    "company": "Recruiter" # Placeholder as company is not in convo doc directly
                },
                "messages": msgs,
                "archived": conv.is_archived,
                "lastMessageAt": int(conv.updated_at.timestamp() * 1000),
                "unreadCount": unread,
            })

        result.sort(key=lambda c: c["lastMessageAt"], reverse=True)
        return result
    except Exception as e:
        print(f"[ERROR student messages]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/messages/{conv_id}")
async def get_student_conversation(conv_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific conversation."""
    try:
        conv = await Conversation.get(conv_id)
        if not conv or current_user.email not in conv.participants:
            raise HTTPException(404, "Conversation not found")

        # Mark all messages from recruiter as read
        changed = False
        for m in conv.messages:
            if m.senderId != current_user.email and not m.read:
                m.read = True
                changed = True
        if changed:
            await conv.save()

        other_email = next((p for p in conv.participants if p != current_user.email), "")
        from auth.models import User as AuthUser
        other_user = await AuthUser.find_one(AuthUser.email == other_email)
        other_name = other_user.name if other_user else other_email

        msgs = [{
            "id": m.id,
            "sender": "me" if m.senderId == current_user.email else "them",
            "senderName": other_name if m.senderId != current_user.email else "You",
            "text": m.text,
            "timestamp": m.timestamp.strftime("%H:%M"),
            "timestampMs": int(m.timestamp.timestamp() * 1000),
            "read": m.read,
        } for m in conv.messages]

        return {
            "id": str(conv.id),
            "recruiterId": other_email,
            "recruiterName": other_name,
            "initials": _student_initials(other_name),
            "jobTitle": ss(getattr(conv, "job_title", "")),
            "messages": msgs,
            "archived": conv.is_archived,
            "lastMessageAt": int(conv.updated_at.timestamp() * 1000),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.post("/messages/{conv_id}")
async def student_send_message(conv_id: str, data: dict = Body(...), current_user: User = Depends(get_current_user)):
    """Student replies in a conversation."""
    try:
        conv = await Conversation.get(conv_id)
        if not conv or current_user.email not in conv.participants:
            raise HTTPException(404, "Conversation not found")
        text = data.get("text", "").strip()
        if not text:
            raise HTTPException(400, "text is required")
        msg = Message(
            id=str(_uuid.uuid4()),
            senderId=current_user.email,
            text=text,
            timestamp=datetime.utcnow(),
            read=False,
        )
        conv.messages.append(msg)
        conv.last_message = text
        conv.updated_at = datetime.utcnow()
        await conv.save()
        return {"success": True, "messageId": msg.id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Internal error")

# ─── Additional Missing Endpoints ─────────────────────────────────────────────

@router.get("/analysis/recommendations")
async def get_recommendations(current_user: User = Depends(get_current_user)):
    try:
        student = await get_student_doc(current_user)
        extracted = student.extracted_data or {}
        gap_report = extracted.get("gap_report", {})
        missing_crit = sl(gap_report.get("missing_critical", []))
        recommendations = [
            {"title": f"Learn {s}", "reason": f"{s} is a critical gap for your target role.", "priority": "high"}
            for s in missing_crit[:5]
        ]
        return recommendations
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/cv/download")
async def download_cv(template: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Stub endpoint — CV download/generation is handled client-side via @react-pdf/renderer."""
    return {"url": None, "message": "CV download is generated client-side."}

@router.get("/learning-paths/{path_id}")
async def get_learning_path(path_id: str, current_user: User = Depends(get_current_user)):
    try:
        paths = await get_learning_paths(current_user)
        for path in paths:
            if path.get("id") == path_id:
                return path
        raise HTTPException(404, "Learning path not found")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.post("/profile/avatar")
async def upload_avatar(
    avatar: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    try:
        student = await get_student_doc(current_user)

        content = await avatar.read()
        if not content:
            raise HTTPException(400, "Avatar file is empty")
        if len(content) > 2 * 1024 * 1024:
            raise HTTPException(413, "Avatar must be 2MB or smaller")

        allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
        content_type = (avatar.content_type or "").lower()
        if content_type not in allowed_types:
            raise HTTPException(415, "Unsupported image type. Use JPG, PNG, WEBP, or GIF")

        encoded = base64.b64encode(content).decode("ascii")
        avatar_url = f"data:{content_type};base64,{encoded}"

        student.avatar_url = avatar_url
        await student.save()
        return {"avatarUrl": avatar_url}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")

@router.delete("/profile/avatar")
async def remove_avatar(current_user: User = Depends(get_current_user)):
    try:
        student = await get_student_doc(current_user)
        student.avatar_url = None
        await student.save()
        return {"avatarUrl": ""}
    except Exception as e:
        print(f"[ERROR]: {e}")
        raise HTTPException(500, "Internal error")
