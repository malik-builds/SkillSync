from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
from auth.models import User
from auth.dependencies import get_current_user
from routers.recruiter_models import RecruiterProfile, RecruiterJob
from routers.application_models import Application
from routers.message_models import Conversation, Message
from models import Student
from jobs.models import Job

router = APIRouter()

# ─── Auth helpers ─────────────────────────────────────────────────────────────

async def require_recruiter(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role.lower() != "recruiter":
        raise HTTPException(403, "Access denied. Recruiter role required.")
    return current_user

async def get_recruiter_profile(current_user: User) -> RecruiterProfile:
    profile = await RecruiterProfile.find_one(RecruiterProfile.recruiter_email == current_user.email)
    if not profile:
        profile = RecruiterProfile(recruiter_email=current_user.email, company_name=current_user.name or "My Company")
        await profile.insert()
    return profile

# ─── Helpers ──────────────────────────────────────────────────────────────────

def days_ago(dt: datetime) -> int:
    return max(0, (datetime.utcnow() - dt).days)

AVATAR_COLORS = ["bg-blue-500","bg-indigo-500","bg-violet-500","bg-purple-500","bg-pink-500","bg-rose-500","bg-teal-500","bg-emerald-500"]

def avatar_color(name: str) -> str:
    return AVATAR_COLORS[sum(ord(c) for c in name) % len(AVATAR_COLORS)]

def initials(name: str) -> str:
    parts = (name or "?").split()
    return (parts[0][0] + parts[-1][0]).upper() if len(parts) >= 2 else parts[0][:2].upper()

async def compute_match_score(student: Optional[Student], job: Optional[RecruiterJob]) -> int:
    if not student or not job:
        return 0
    student_skills = set(s.lower() for s in student.skills)
    job_reqs = set(r.lower() for r in (job.requirements or []))
    if not job_reqs:
        return 0
    matched = student_skills & job_reqs
    return int((len(matched) / len(job_reqs)) * 100)

def map_status_to_stage(status: str) -> str:
    """Map DB application status to frontend stage."""
    mapping = {
        "applied": "New",
        "reviewing": "Screening",
        "shortlisted": "Shortlisted",
        "interview": "Interview",
        "offer": "Offer",
        "hired": "Hired",
        "rejected": "Rejected",
    }
    return mapping.get(status.lower(), "New")

def map_stage_to_status(stage: str) -> str:
    """Map frontend stage to DB status."""
    mapping = {
        "New": "applied",
        "Screening": "reviewing",
        "Shortlisted": "shortlisted",
        "Interview": "interview",
        "Offer": "offer",
        "Hired": "hired",
        "Rejected": "rejected",
    }
    return mapping.get(stage, "applied")

def normalize_work_type(value: Optional[str]) -> str:
    """Normalize work type values to canonical API value: OnSite, Remote, Hybrid."""
    raw = (value or "").strip().lower()
    if raw in {"office", "on site", "onsite"}:
        return "OnSite"
    if raw == "remote":
        return "Remote"
    if raw == "hybrid":
        return "Hybrid"
    return "OnSite"

async def format_application(app: Application, student: Optional[Student], job: Optional[RecruiterJob]) -> dict:
    """Format an application into the shape the frontend RecruiterApplication type expects."""
    name = student.name if student else app.student_email
    match_score = await compute_match_score(student, job)
    ext = student.extracted_data or {} if student else {}
    github_report = ext.get("github_report", {}) or {}
    github = None
    if student and student.github_url:
        repos = github_report.get("repo_count", 0)
        commits = github_report.get("total_commits", 0)
        github = {"repos": repos, "commits6mo": commits}

    return {
        "id": str(app.id),
        "candidateName": name,
        "candidateInitials": initials(name),
        "avatarColor": avatar_color(name),
        "university": (student.course or "Unknown University") if student else "Unknown",
        "degree": "BSc",
        "major": (student.target_role or "Computer Science") if student else "Technology",
        "location": "Colombo, Sri Lanka",
        "jobId": str(app.job_id),
        "jobTitle": job.title if job else "Unknown Role",
        "department": "Engineering",
        "source": "Direct",
        "appliedOn": app.applied_at.isoformat(),
        "appliedDaysAgo": days_ago(app.applied_at),
        "stage": map_status_to_stage(app.status),
        "matchScore": match_score,
        "skills": student.skills[:8] if student else [],
        "github": github,
        "availabilityStatus": "Immediate",
        "tags": app.tags,
        "note": app.notes[-1]["text"] if app.notes else None,
        "recruiterRating": 0,
        "studentEmail": app.student_email,
    }

async def format_job(j: RecruiterJob, profile: RecruiterProfile) -> dict:
    """Format RecruiterJob to the shape frontend expects."""
    job_apps = await Application.find(Application.job_id == str(j.id)).to_list()
    new_count = sum(1 for a in job_apps if a.status == "applied")
    shortlisted = sum(1 for a in job_apps if a.status == "shortlisted")
    interview = sum(1 for a in job_apps if a.status == "interview")

    # Find top candidate by match score
    top_candidate = None
    best_score = 0
    for app in job_apps:
        student = await Student.find_one(Student.email == app.student_email)
        score = await compute_match_score(student, j)
        if score > best_score:
            best_score = score
            if student:
                top_candidate = {"name": student.name, "match": score}

    # Compute avg match
    scores = []
    for app in job_apps:
        student = await Student.find_one(Student.email == app.student_email)
        scores.append(await compute_match_score(student, j))
    avg_match = int(sum(scores) / len(scores)) if scores else 0

    status_map = {"active": "Active", "draft": "Draft", "closed": "Closed"}
    return {
        "id": str(j.id),
        "title": j.title,
        "company": profile.company_name,
        "location": j.location,
        "workType": normalize_work_type(j.work_type),
        "salaryMin": j.salary_min or 80,
        "salaryMax": j.salary_max or 150,
        "postedDaysAgo": days_ago(j.created_at),
        "deadline": j.deadline or "Open",
        "status": status_map.get(j.status, "Active"),
        "skills": j.requirements,
        "department": j.department or "Engineering",
        "stats": {
            "total": len(job_apps),
            "new": new_count,
            "shortlisted": shortlisted,
            "interview": interview,
            "views": j.views,
            "avgMatch": avg_match,
        },
        "topCandidate": top_candidate,
    }

# ─── Dashboard ────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def get_dashboard(current_user: User = Depends(require_recruiter)):
    try:
        profile = await get_recruiter_profile(current_user)
        jobs = await RecruiterJob.find(RecruiterJob.recruiter_email == current_user.email).to_list()
        active_jobs = [j for j in jobs if j.status == "active"]

        job_ids = [str(j.id) for j in jobs]
        apps = await Application.find({"job_id": {"$in": job_ids}}).to_list()

        new_apps = [a for a in apps if a.status == "applied"]
        pipeline = {
            "New": len(new_apps),
            "Screening": sum(1 for a in apps if a.status == "reviewing"),
            "Shortlisted": sum(1 for a in apps if a.status == "shortlisted"),
            "Interview": sum(1 for a in apps if a.status == "interview"),
            "Offer": sum(1 for a in apps if a.status == "offer"),
            "Hired": sum(1 for a in apps if a.status == "hired"),
        }

        # Recent applicants table (last 5)
        recent_apps = []
        for app in sorted(apps, key=lambda a: a.applied_at, reverse=True)[:5]:
            student = await Student.find_one(Student.email == app.student_email)
            job = next((j for j in jobs if str(j.id) == app.job_id), None)
            match = await compute_match_score(student, job)
            name = student.name if student else app.student_email
            recent_apps.append({
                "id": str(app.id),
                "candidateName": name,
                "candidateInitials": initials(name),
                "avatarColor": avatar_color(name),
                "role": job.title if job else "Unknown",
                "stage": map_status_to_stage(app.status),
                "appliedDate": app.applied_at.isoformat(),
                "matchScore": match,
                "jobId": app.job_id,
            })

        # Active job postings for table
        job_rows = []
        for j in [jb for jb in jobs if jb.status == "active"][:5]:
            j_apps = [a for a in apps if a.job_id == str(j.id)]
            job_rows.append({
                "id": str(j.id),
                "title": j.title,
                "department": j.department or "Engineering",
                "applicants": len(j_apps),
                "hot": len(j_apps) >= 10,
                "status": "Active",
            })

        return {
            "stats": {
                "recruiterName": current_user.name or "Recruiter",
                "activeJobs": len(active_jobs),
                "totalCandidates": len(apps),
                "newApplicants": len(new_apps),
                "totalApplicants": len(apps),
                "interviews": pipeline["Interview"],
                "hires": pipeline["Hired"],
                "avgTimeToHire": 14,
                "offerAcceptRate": 80,
                "companyName": profile.company_name,
            },
            "pipelineStats": pipeline,
            "recentApplications": recent_apps,
            "activeJobRows": job_rows,
            "upcomingInterviews": [],
        }
    except Exception as e:
        print(f"[ERROR dashboard]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/analytics")
async def get_full_analytics(range: str = "30d", current_user: User = Depends(require_recruiter)):
    try:
        # Aggregated endpoint to prevent 404s from frontend
        trends = await get_analytics_trends(range, current_user)
        sources = await get_source_breakdown(current_user)
        skills = await get_skill_demand(current_user)
        funnel = await get_funnel(current_user)
        performance = await get_job_performance(current_user)
        
        # Calculate summary stats
        jobs = await RecruiterJob.find(RecruiterJob.recruiter_email == current_user.email).to_list()
        job_ids = [str(j.id) for j in jobs]
        apps = await Application.find({"job_id": {"$in": job_ids}}).to_list()
        
        total_apps = len(apps)
        interviews = sum(1 for a in apps if a.status in ("interview", "offer", "hired"))
        offers = sum(1 for a in apps if a.status in ("offer", "hired"))
        
        return {
            "stats": {
                "totalApplications": total_apps,
                "avgTimeToHire": 14,
                "interviewRate": int((interviews/total_apps*100)) if total_apps > 0 else 0,
                "offerAcceptRate": int((offers/interviews*100)) if interviews > 0 else 85,
                "costPerHire": 2400
            },
            "trends": trends,
            "sources": sources,
            "skillDemand": skills,
            "funnel": funnel,
            "jobPerformance": performance
        }
    except Exception as e:
        print(f"[ERROR analytics]: {e}")
        raise HTTPException(500, f"Internal error: {e}")

# ─── Analytics (real data) ────────────────────────────────────────────────────

@router.get("/analytics/trends")
async def get_analytics_trends(date_range: str = "30d", current_user: User = Depends(require_recruiter)):
    try:
        days = {"7d": 7, "30d": 30, "90d": 90}.get(date_range, 30)
        jobs = await RecruiterJob.find(RecruiterJob.recruiter_email == current_user.email).to_list()
        job_ids = [str(j.id) for j in jobs]
        apps = await Application.find({"job_id": {"$in": job_ids}}).to_list()

        # Bucket by week
        now = datetime.utcnow()
        num_weeks = max(1, days // 7)
        result = []
        for week_i in range(num_weeks):
            week_start = now - timedelta(days=(num_weeks - week_i) * 7)
            week_end = week_start + timedelta(days=7)
            week_apps = [a for a in apps if week_start <= a.applied_at < week_end]
            interviews = sum(1 for a in week_apps if a.status in ("interview", "offer", "hired"))
            offers = sum(1 for a in week_apps if a.status in ("offer", "hired"))
            result.append({
                "label": f"Wk {week_i + 1}",
                "apps": len(week_apps),
                "interviews": interviews,
                "offers": offers,
            })
        return result
    except Exception as e:
        print(f"[ERROR trends]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/analytics/sources")
async def get_source_breakdown(current_user: User = Depends(require_recruiter)):
    try:
        return [
            {"name": "SkillSync Native", "value": 100},
        ]
    except Exception:
        raise HTTPException(500, "Internal error")

@router.get("/analytics/skill-demand")
async def get_skill_demand(current_user: User = Depends(require_recruiter)):
    try:
        jobs = await RecruiterJob.find(RecruiterJob.recruiter_email == current_user.email).to_list()
        skill_count: dict = {}
        for j in jobs:
            for s in (j.requirements or []):
                skill_count[s] = skill_count.get(s, 0) + 1
        sorted_skills = sorted(skill_count.items(), key=lambda x: x[1], reverse=True)[:10]
        return [{"skill": s, "jobs": c} for s, c in sorted_skills] or [
            {"skill": "React", "jobs": 1}, {"skill": "Python", "jobs": 1}
        ]
    except Exception as e:
        print(f"[ERROR skill demand]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/analytics/funnel")
async def get_funnel(current_user: User = Depends(require_recruiter)):
    try:
        jobs = await RecruiterJob.find(RecruiterJob.recruiter_email == current_user.email).to_list()
        job_ids = [str(j.id) for j in jobs]
        apps = await Application.find({"job_id": {"$in": job_ids}}).to_list()
        total = len(apps)
        screening = sum(1 for a in apps if a.status in ("reviewing","shortlisted","interview","offer","hired"))
        interview = sum(1 for a in apps if a.status in ("interview","offer","hired"))
        offer = sum(1 for a in apps if a.status in ("offer","hired"))
        hired = sum(1 for a in apps if a.status == "hired")
        return [
            {"name": "Applied", "value": total, "fill": "#3b82f6"},
            {"name": "Screening", "value": screening, "fill": "#8b5cf6"},
            {"name": "Interview", "value": interview, "fill": "#ec4899"},
            {"name": "Offer", "value": offer, "fill": "#f43f5e"},
            {"name": "Hired", "value": hired, "fill": "#10b981"},
        ]
    except Exception as e:
        print(f"[ERROR funnel]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/analytics/job-performance")
async def get_job_performance(current_user: User = Depends(require_recruiter)):
    try:
        jobs = await RecruiterJob.find(RecruiterJob.recruiter_email == current_user.email).to_list()
        result = []
        for j in jobs:
            j_apps = await Application.find(Application.job_id == str(j.id)).to_list()
            scores = []
            for app in j_apps:
                student = await Student.find_one(Student.email == app.student_email)
                scores.append(await compute_match_score(student, j))
            avg_match = int(sum(scores) / len(scores)) if scores else 0
            age = days_ago(j.created_at)
            result.append({
                "title": j.title,
                "apps": len(j_apps),
                "match": avg_match,
                "days": age,
                "warn": age > 21 and len(j_apps) < 5,
            })
        return result
    except Exception as e:
        print(f"[ERROR job perf]: {e}")
        raise HTTPException(500, "Internal error")

# ─── Jobs ─────────────────────────────────────────────────────────────────────

@router.get("/jobs")
async def get_jobs(status: Optional[str] = None, current_user: User = Depends(require_recruiter)):
    try:
        query = {"recruiter_email": current_user.email}
        if status:
            query["status"] = status.lower()

        profile = await get_recruiter_profile(current_user)
        jobs = await RecruiterJob.find(query).to_list()
        result = []
        for j in jobs:
            result.append(await format_job(j, profile))
        return {"jobs": result, "total": len(result)}
    except Exception as e:
        print(f"[ERROR jobs]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/jobs/{job_id}")
async def get_job(job_id: str, current_user: User = Depends(require_recruiter)):
    try:
        j = await RecruiterJob.get(job_id)
        if not j:
            raise HTTPException(404, "Job not found")
        profile = await get_recruiter_profile(current_user)
        return await format_job(j, profile)
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR job detail]: {e}")
        raise HTTPException(500, "Internal error")

@router.post("/jobs")
async def create_job(data: dict = Body(...), current_user: User = Depends(require_recruiter)):
    try:
        profile = await get_recruiter_profile(current_user)
        job = RecruiterJob(
            recruiter_email=current_user.email,
            title=data.get("title", ""),
            description=data.get("description", ""),
            location=data.get("location", "Colombo, Sri Lanka"),
            work_type=normalize_work_type(data.get("workType", "OnSite")),
            type=data.get("type", "Full-time"),
            requirements=data.get("skills", data.get("requirements", [])),
            department=data.get("department", "Engineering"),
            status=data.get("status", "active").lower(),
            salary_min=data.get("salaryMin", 0),
            salary_max=data.get("salaryMax", 0),
            deadline=data.get("deadline", ""),
        )
        await job.insert()

        # Mirror to student Job collection with link to recruiter job
        student_job = Job(
            title=job.title,
            company=profile.company_name,
            description=job.description,
            required_skills=job.requirements,
            nice_to_have=[],
            location=job.location,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            work_type=job.work_type,
            type=job.type,
            deadline=job.deadline,
            department=job.department,
            source="Internal",
            created_at=datetime.utcnow(),
            recruiter_job_id=str(job.id),  # Store link to recruiter job
        )
        await student_job.insert()

        return {"success": True, "jobId": str(job.id)}
    except Exception as e:
        print(f"[ERROR create job]: {e}")
        raise HTTPException(500, "Internal error")

@router.put("/jobs/{job_id}")
async def update_job(job_id: str, data: dict = Body(...), current_user: User = Depends(require_recruiter)):
    try:
        j = await RecruiterJob.get(job_id)
        if not j or j.recruiter_email != current_user.email:
            raise HTTPException(404, "Job not found")
        for field in ["title", "description", "location", "status", "department", "deadline"]:
            if field in data:
                setattr(j, field, data[field])
        if "skills" in data:
            j.requirements = data["skills"]
        if "workType" in data:
            j.work_type = normalize_work_type(data["workType"])
        if "salaryMin" in data:
            j.salary_min = data["salaryMin"]
        if "salaryMax" in data:
            j.salary_max = data["salaryMax"]
        await j.save()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR update job]: {e}")
        raise HTTPException(500, "Internal error")

@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str, current_user: User = Depends(require_recruiter)):
    try:
        j = await RecruiterJob.get(job_id)
        if not j or j.recruiter_email != current_user.email:
            raise HTTPException(404, "Job not found")
        await j.delete()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Internal error")

# ─── Applications ─────────────────────────────────────────────────────────────

@router.get("/applications")
async def get_all_applications(
    jobId: Optional[str] = None,
    stage: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_recruiter)
):
    try:
        jobs = await RecruiterJob.find(RecruiterJob.recruiter_email == current_user.email).to_list()
        job_ids = [str(j.id) for j in jobs]
        job_map = {str(j.id): j for j in jobs}

        query: dict = {"job_id": {"$in": job_ids}}
        if jobId:
            query["job_id"] = jobId
        if stage:
            query["status"] = map_stage_to_status(stage)

        apps = await Application.find(query).to_list()

        result = []
        for app in apps:
            student = await Student.find_one(Student.email == app.student_email)
            job = job_map.get(app.job_id)
            formatted = await format_application(app, student, job)
            if search:
                if search.lower() not in formatted["candidateName"].lower() and search.lower() not in formatted["jobTitle"].lower():
                    continue
            result.append(formatted)

        result.sort(key=lambda a: a["appliedOn"], reverse=True)
        return {"applications": result, "total": len(result)}
    except Exception as e:
        print(f"[ERROR applications]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/jobs/{job_id}/applications")
async def get_job_applications(job_id: str, current_user: User = Depends(require_recruiter)):
    try:
        j = await RecruiterJob.get(job_id)
        apps = await Application.find(Application.job_id == job_id).to_list()
        result = []
        for app in apps:
            student = await Student.find_one(Student.email == app.student_email)
            result.append(await format_application(app, student, j))
        return result
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.patch("/applications/{app_id}/stage")
async def update_application_stage(app_id: str, data: dict = Body(...), current_user: User = Depends(require_recruiter)):
    try:
        app = await Application.get(app_id)
        if not app:
            raise HTTPException(404, "Application not found")
        stage = data.get("stage", "")
        app.status = map_stage_to_status(stage)
        await app.save()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.post("/applications/{app_id}/tags")
async def add_application_tag(app_id: str, data: dict = Body(...), current_user: User = Depends(require_recruiter)):
    try:
        app = await Application.get(app_id)
        if not app:
            raise HTTPException(404, "Application not found")
        tag = data.get("tag", "")
        if tag and tag not in app.tags:
            app.tags.append(tag)
            await app.save()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.delete("/applications/{app_id}/tags/{tag}")
async def remove_application_tag(app_id: str, tag: str, current_user: User = Depends(require_recruiter)):
    try:
        app = await Application.get(app_id)
        if not app:
            raise HTTPException(404, "Application not found")
        app.tags = [t for t in app.tags if t != tag]
        await app.save()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.post("/applications/{app_id}/notes")
async def add_application_note(app_id: str, data: dict = Body(...), current_user: User = Depends(require_recruiter)):
    try:
        app = await Application.get(app_id)
        if not app:
            raise HTTPException(404, "Application not found")
        app.notes.append({
            "text": data.get("note", data.get("text", "")),
            "author": current_user.name or current_user.email,
            "timestamp": datetime.now().isoformat()
        })
        await app.save()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Internal error")

# ─── Talent ───────────────────────────────────────────────────────────────────

@router.get("/talent")
async def search_talent(
    q: Optional[str] = None,
    skills: Optional[str] = None,
    current_user: User = Depends(require_recruiter)
):
    try:
        query = {}
        if q:
            query["name"] = {"$regex": q, "$options": "i"}

        students = await Student.find(query).limit(50).to_list()
        req_skills = [s.strip().lower() for s in skills.split(",")] if skills else []

        result = []
        for s in students:
            s_skills = set(sk.lower() for sk in s.skills)
            match_score = 0
            if req_skills:
                matched = [sk for sk in req_skills if sk in s_skills]
                match_score = int((len(matched) / len(req_skills)) * 100)
            else:
                gap = (s.extracted_data or {}).get("gap_report", {})
                match_score = min(100, int(gap.get("score", 0))) if gap else 0

            ext = s.extracted_data or {}
            github_report = ext.get("github_report", {}) or {}

            result.append({
                "id": str(s.id),
                "name": s.name,
                "degree": "BSc",
                "major": getattr(s, "target_role", None) or s.course or "Computer Science",
                "university": s.course or "University",
                "graduatingYear": 2025,
                "graduatingMonth": "June",
                "location": "Colombo, Sri Lanka",
                "availableFor": "Any",
                "experience": "Fresh",
                "skills": [{"name": sk, "score": 80, "source": "CV"} for sk in s.skills[:10]],
                "github": {
                    "repos": github_report.get("repo_count", 0),
                    "commits6mo": github_report.get("total_commits", 0),
                    "active": github_report.get("repo_count", 0) > 0,
                } if s.github_url else None,
                "overallScore": match_score,
                "matchScore": match_score,
                "availabilityStatus": "Immediate",
                "salaryMin": 80,
                "salaryMax": 150,
                "saved": s.email in (await get_recruiter_profile(current_user)).saved_candidates,
                "githubUrl": s.github_url,
                "email": s.email,
            })

        if req_skills:
            result.sort(key=lambda x: x["matchScore"], reverse=True)

        return {"candidates": result, "total": len(result), "page": 1, "totalPages": 1}
    except Exception as e:
        print(f"[ERROR talent]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/talent/{candidate_id}")
async def get_candidate_detail(candidate_id: str, current_user: User = Depends(require_recruiter)):
    try:
        student = await Student.get(candidate_id)
        if not student:
            raise HTTPException(404, "Candidate not found")
        ext = student.extracted_data or {}
        github_report = ext.get("github_report", {}) or {}
        gap = ext.get("gap_report", {}) or {}
        match_score = min(100, int(gap.get("score", 0)))
        profile = await get_recruiter_profile(current_user)
        return {
            "id": str(student.id),
            "name": student.name,
            "degree": "BSc",
            "major": student.target_role or "Computer Science",
            "university": student.course or "University",
            "graduatingYear": 2025,
            "graduatingMonth": "June",
            "location": "Colombo, Sri Lanka",
            "availableFor": "Any",
            "experience": "Fresh",
            "skills": [{"name": sk, "score": 80, "source": "CV"} for sk in student.skills],
            "github": {
                "repos": github_report.get("repo_count", 0),
                "commits6mo": github_report.get("total_commits", 0),
                "active": True,
            } if student.github_url else None,
            "overallScore": match_score,
            "matchScore": match_score,
            "availabilityStatus": "Immediate",
            "salaryMin": 80,
            "salaryMax": 150,
            "saved": student.email in profile.saved_candidates,
            "githubUrl": student.github_url,
            "email": student.email,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.post("/talent/{candidate_id}/save")
async def save_candidate(candidate_id: str, current_user: User = Depends(require_recruiter)):
    try:
        student = await Student.get(candidate_id)
        if not student:
            raise HTTPException(404, "Candidate not found")
        profile = await get_recruiter_profile(current_user)
        if student.email not in profile.saved_candidates:
            profile.saved_candidates.append(student.email)
            await profile.save()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.delete("/talent/{candidate_id}/save")
async def unsave_candidate(candidate_id: str, current_user: User = Depends(require_recruiter)):
    try:
        student = await Student.get(candidate_id)
        if not student:
            raise HTTPException(404, "Candidate not found")
        profile = await get_recruiter_profile(current_user)
        profile.saved_candidates = [e for e in profile.saved_candidates if e != student.email]
        await profile.save()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Internal error")

# ─── Messaging ────────────────────────────────────────────────────────────────

def format_conversation(conv: Conversation, current_email: str) -> dict:
    """Format a Conversation to RecruiterConversation shape."""
    other_email = next((p for p in conv.participants if p != current_email), "")
    msgs = []
    for m in conv.messages:
        sender_role = "recruiter" if m.senderId == current_email else "candidate"
        msgs.append({
            "id": m.id,
            "sender": sender_role,
            "text": m.text,
            "timestamp": m.timestamp.strftime("%H:%M"),
            "timestampMs": int(m.timestamp.timestamp() * 1000),
            "read": m.read,
        })
    last_msg = conv.messages[-1] if conv.messages else None
    last_text = last_msg.text if last_msg else ""
    candidate_name = other_email
    return {
        "id": str(conv.id),
        "candidateId": other_email,
        "candidateName": candidate_name,
        "initials": initials(candidate_name),
        "avatarColor": "#3B82F6",
        "jobTitle": conv.job_title if hasattr(conv, "job_title") else "Application",
        "messages": msgs,
        "archived": conv.is_archived,
        "lastMessageAt": int(conv.updated_at.timestamp() * 1000),
    }

async def enrich_conversation(conv: Conversation, current_email: str) -> dict:
    """Enrich conversation with real student name."""
    other_email = next((p for p in conv.participants if p != current_email), "")
    student = await Student.find_one(Student.email == other_email)
    candidate_name = student.name if student else other_email
    msgs = []
    for m in conv.messages:
        sender_role = "recruiter" if m.senderId == current_email else "candidate"
        msgs.append({
            "id": m.id,
            "sender": sender_role,
            "text": m.text,
            "timestamp": m.timestamp.strftime("%H:%M"),
            "timestampMs": int(m.timestamp.timestamp() * 1000),
            "read": m.read,
        })
    return {
        "id": str(conv.id),
        "candidateId": other_email,
        "candidateName": candidate_name,
        "initials": initials(candidate_name),
        "avatarColor": avatar_color(candidate_name),
        "jobTitle": getattr(conv, "job_title", "Applied Role"),
        "messages": msgs,
        "archived": conv.is_archived,
        "lastMessageAt": int(conv.updated_at.timestamp() * 1000),
    }

@router.get("/messages")
async def get_conversations(filter: Optional[str] = None, current_user: User = Depends(require_recruiter)):
    try:
        convs = await Conversation.find({"participants": current_user.email}).to_list()
        result = []
        for conv in convs:
            if filter == "archived" and not conv.is_archived:
                continue
            if filter == "unread" and conv.is_archived:
                continue
            result.append(await enrich_conversation(conv, current_user.email))
        result.sort(key=lambda c: c["lastMessageAt"], reverse=True)
        return result
    except Exception as e:
        print(f"[ERROR messages list]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/messages/{conv_id}")
async def get_conversation(conv_id: str, current_user: User = Depends(require_recruiter)):
    try:
        conv = await Conversation.get(conv_id)
        if not conv or current_user.email not in conv.participants:
            raise HTTPException(404, "Conversation not found")
        return await enrich_conversation(conv, current_user.email)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.post("/messages")
async def create_conversation(data: dict = Body(...), current_user: User = Depends(require_recruiter)):
    """Start a new conversation with a candidate."""
    try:
        candidate_email = data.get("candidateEmail", "")
        text = data.get("text", "")
        job_title = data.get("jobTitle", "")

        if not candidate_email:
            raise HTTPException(400, "candidateEmail is required")

        # Check if conversation already exists
        existing = await Conversation.find_one({
            "participants": {"$all": [current_user.email, candidate_email]}
        })

        msg = Message(
            id=str(uuid.uuid4()),
            senderId=current_user.email,
            text=text,
            timestamp=datetime.utcnow(),
            read=False,
        )

        if existing:
            existing.messages.append(msg)
            existing.last_message = text
            existing.updated_at = datetime.utcnow()
            await existing.save()
            return {"success": True, "conversationId": str(existing.id)}
        else:
            conv = Conversation(
                participants=[current_user.email, candidate_email],
                messages=[msg] if text else [],
                last_message=text,
                updated_at=datetime.utcnow(),
            )
            if job_title:
                conv.job_title = job_title  # type: ignore
            await conv.insert()
            return {"success": True, "conversationId": str(conv.id)}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR create conv]: {e}")
        raise HTTPException(500, "Internal error")

@router.post("/messages/{conv_id}")
async def send_message(conv_id: str, data: dict = Body(...), current_user: User = Depends(require_recruiter)):
    try:
        conv = await Conversation.get(conv_id)
        if not conv or current_user.email not in conv.participants:
            raise HTTPException(404, "Conversation not found")
        text = data.get("text", "").strip()
        if not text:
            raise HTTPException(400, "text is required")
        msg = Message(
            id=str(uuid.uuid4()),
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

@router.patch("/messages/{conv_id}/archive")
async def archive_conversation(conv_id: str, current_user: User = Depends(require_recruiter)):
    try:
        conv = await Conversation.get(conv_id)
        if not conv or current_user.email not in conv.participants:
            raise HTTPException(404, "Conversation not found")
        conv.is_archived = not conv.is_archived
        await conv.save()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Internal error")

# ─── Settings ─────────────────────────────────────────────────────────────────

@router.get("/settings")
async def get_settings(current_user: User = Depends(require_recruiter)):
    try:
        profile = await get_recruiter_profile(current_user)
        return {
            "name": current_user.name,
            "email": current_user.email,
            "companyName": profile.company_name,
            "companyWebsite": profile.company_website,
            "industry": profile.industry,
            "notifications": profile.notification_settings or {
                "newApplications": True,
                "messages": True,
                "weeklyReport": False,
            }
        }
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.put("/settings")
async def update_settings(data: dict = Body(...), current_user: User = Depends(require_recruiter)):
    try:
        profile = await get_recruiter_profile(current_user)
        if "name" in data:
            current_user.name = data["name"]
            await current_user.save()
        if "companyName" in data:
            profile.company_name = data["companyName"]
        if "companyWebsite" in data:
            profile.company_website = data["companyWebsite"]
        if "industry" in data:
            profile.industry = data["industry"]
        if "notifications" in data:
            profile.notification_settings = data["notifications"]
        await profile.save()
        return {"success": True}
    except Exception as e:
        raise HTTPException(500, "Internal error")

# ─── Company Profile ──────────────────────────────────────────────────────────

@router.get("/company")
async def get_company(current_user: User = Depends(require_recruiter)):
    try:
        profile = await get_recruiter_profile(current_user)
        return {
            "name": profile.company_name,
            "tagline": profile.company_tagline or "",
            "website": profile.company_website,
            "careersEmail": current_user.email,
            "location": profile.company_location or "Colombo, Sri Lanka",
            "size": profile.company_size or "11-50",
            "industry": profile.industry,
            "founded": profile.company_founded or "",
            "specialties": profile.company_specialties or [],
            "about": profile.company_about or "",
            "benefits": profile.company_benefits or [],
            "contact": {
                "primaryContact": current_user.name,
                "role": "Recruiter",
                "email": current_user.email,
                "phone": "",
                "address": profile.company_location or "",
            },
            "stats": [],
        }
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.put("/company")
async def update_company(data: dict = Body(...), current_user: User = Depends(require_recruiter)):
    try:
        profile = await get_recruiter_profile(current_user)
        field_map = {
            "name": "company_name",
            "tagline": "company_tagline",
            "website": "company_website",
            "location": "company_location",
            "size": "company_size",
            "industry": "industry",
            "founded": "company_founded",
            "specialties": "company_specialties",
            "about": "company_about",
            "benefits": "company_benefits",
        }
        for key, attr in field_map.items():
            if key in data:
                setattr(profile, attr, data[key])
        await profile.save()
        return {"success": True}
    except Exception as e:
        raise HTTPException(500, "Internal error")
