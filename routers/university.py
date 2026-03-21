from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import List, Optional
from datetime import datetime
from collections import defaultdict
from auth.models import User
from auth.dependencies import get_current_user
from routers.university_models import UniversityProfile
from routers.application_models import Application
from jobs.models import Job
from models import Student
from services import SKILL_ONTOLOGY

router = APIRouter()

async def require_university(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "university":
        raise HTTPException(403, "Access denied. University role required.")
    return current_user

async def get_university_profile(current_user: User) -> UniversityProfile:
    profile = await UniversityProfile.find_one(UniversityProfile.uni_email == current_user.email)
    if not profile:
        profile = UniversityProfile(uni_email=current_user.email)
        await profile.insert()
    return profile

async def compute_university_analytics(institution: str):
    """Aggregates real data across Student documents linked to this institution."""
    students = await Student.find(Student.institution == institution).to_list()
    total_students = len(students)
    if total_students == 0:
        return {
            "totalStudents": 0,
            "avgScore": 0,
            "placedCount": 0,
            "placementRate": 0,
            "skillsFreq": {},
            "missingFreq": {},
            "avgProfile": 0,
            "avgGithub": 0,
            "avgCv": 0,
        }

    total_score = 0
    skills_freq: dict = {}
    missing_freq: dict = {}
    placed_count = 0
    github_count = 0
    cv_count = 0
    profile_count = 0

    for s in students:
        ext = s.extracted_data or {}
        if ext:
            profile_count += 1
            
        if s.github_url:
            github_count += 1
            
        if ext.get("cv_filename"):
            cv_count += 1

        gap = ext.get("gap_report", {}) or {}
        score = gap.get("score", 0) or 0
        total_score += score

        if score >= 70:
            placed_count += 1

        for sk in s.skills:
            sk_l = sk.lower()
            skills_freq[sk_l] = skills_freq.get(sk_l, 0) + 1

        for m in gap.get("missing_critical", []):
            m_l = m.lower()
            missing_freq[m_l] = missing_freq.get(m_l, 0) + 1

    avg_score = round(total_score / total_students, 1)

    return {
        "totalStudents": total_students,
        "avgScore": avg_score,
        "placedCount": placed_count,
        "placementRate": round((placed_count / total_students) * 100, 1),
        "skillsFreq": skills_freq,
        "missingFreq": missing_freq,
        "avgProfile": round((profile_count / total_students) * 100, 1),
        "avgGithub": round((github_count / total_students) * 100, 1),
        "avgCv": round((cv_count / total_students) * 100, 1),
    }

def make_radar_from_analytics(analytics: dict) -> list:
    """Build radar data from real skill frequency vs SKILL_ONTOLOGY categories."""
    categories: dict = {
        "Frontend": ["react", "vue", "angular", "typescript", "css", "html"],
        "Backend": ["python", "node.js", "java", "django", "fastapi", "express"],
        "Database": ["mongodb", "postgresql", "mysql", "redis", "sql"],
        "Cloud": ["aws", "azure", "docker", "kubernetes", "gcp"],
        "AI/ML": ["tensorflow", "pytorch", "scikit-learn", "machine learning", "nlp"],
    }
    skills_freq = analytics.get("skillsFreq", {})
    total = analytics.get("totalStudents", 1)
    result = []
    for cat, keywords in categories.items():
        matched = sum(skills_freq.get(kw, 0) for kw in keywords)
        coverage = min(100, int((matched / total) * 100)) if total else 0
        result.append({
            "subject": cat,
            "category": cat,
            "score": coverage,
            "industry": 85,
            "curriculum": coverage,
            "benchmark": 70,
            "fullMark": 100,
        })
    return result

def _safe_int(value: object) -> int:
    try:
        return int(value)  # type: ignore[arg-type]
    except Exception:
        return 0

def _partner_logo_color(name: str) -> str:
    palette = [
        "from-blue-500 to-indigo-600",
        "from-emerald-500 to-teal-600",
        "from-slate-500 to-gray-700",
        "from-rose-500 to-red-600",
        "from-cyan-500 to-blue-600",
        "from-amber-500 to-orange-600",
    ]
    if not name:
        return palette[0]
    return palette[sum(ord(ch) for ch in name) % len(palette)]

def normalize_partner_company(partner: dict) -> dict:
    name = str(partner.get("name") or "").strip()
    active_jobs = _safe_int(partner.get("activeJobs", 0))
    students_hired = _safe_int(partner.get("hiredStudents", partner.get("studentsHired", 0)))

    raw_status = str(partner.get("status") or "").strip()
    if raw_status in {"Active", "Partner", "New", "Inactive"}:
        status = raw_status
    elif active_jobs > 0:
        status = "Active"
    elif students_hired > 0:
        status = "Partner"
    else:
        status = "New"

    rating = _safe_int(partner.get("rating", 0))
    if rating <= 0 and (active_jobs > 0 or students_hired > 0):
        rating = min(5, 1 + (1 if active_jobs > 0 else 0) + min(3, students_hired // 5))

    return {
        "id": str(partner.get("id") or name.lower().replace(" ", "-") or "partner"),
        "name": name,
        "industry": str(partner.get("industry") or "Unknown"),
        "size": str(partner.get("size") or partner.get("companySize") or "Unknown"),
        "status": status,
        "studentsHired": students_hired,
        "activeJobs": active_jobs,
        "rating": max(0, min(5, rating)),
        "email": str(partner.get("email") or partner.get("careersEmail") or ""),
        "topRoles": list(partner.get("topRoles") or []),
        "since": _safe_int(partner.get("since", datetime.now().year)),
        "logoColor": str(partner.get("logoColor") or _partner_logo_color(name)),
        "website": str(partner.get("website") or ""),
    }

@router.get("/dashboard")
async def get_dashboard(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        analytics = await compute_university_analytics(profile.institution_name)

        # Real stats, fallback to sensible defaults if no data
        total_students = analytics["totalStudents"] if analytics else 0
        avg_score = analytics["avgScore"] if analytics else 0
        placed = analytics["placedCount"] if analytics else 0
        placement_rate = analytics["placementRate"] if analytics else 0
        missing_freq = analytics["missingFreq"] if analytics else {}

        stats = {
            "totalStudents": total_students,
            "averageMatchScore": avg_score,
            "placedStudents": placed,
            "totalPartners": len(profile.partner_companies),
            "recentJobMatches": 0,
            "atRiskStudents": sum(1 for _ in range(total_students)) - placed,  # students not yet placed
            "institutionName": profile.institution_name,
            "personalName": profile.personal_name or current_user.name or "Administrator"
        }

        radar_data = make_radar_from_analytics(analytics) if analytics else [
            {"subject": "Frontend", "score": 0, "industry": 85, "benchmark": 70, "fullMark": 100},
            {"subject": "Backend", "score": 0, "industry": 90, "benchmark": 75, "fullMark": 100},
            {"subject": "Database", "score": 0, "industry": 80, "benchmark": 65, "fullMark": 100},
            {"subject": "Cloud", "score": 0, "industry": 95, "benchmark": 60, "fullMark": 100},
            {"subject": "AI/ML", "score": 0, "industry": 85, "benchmark": 50, "fullMark": 100},
        ]

        # Generate alerts from real data
        alerts = []
        if analytics:
            top_missing = sorted(missing_freq.items(), key=lambda x: x[1], reverse=True)[:3]
            for skill, count in top_missing:
                alerts.append({
                    "id": f"gap_{skill}",
                    "type": "warning",
                    "message": f"{count} students show critical gaps in {skill.title()}.",
                    "date": datetime.now().isoformat(),
                    "actionLabel": "View",
                })
        if placement_rate > 0:
            alerts.append({
                "id": "placement_rate",
                "type": "success",
                "message": f"Placement-ready rate is {placement_rate}% across all students.",
                "date": datetime.now().isoformat(),
                "actionLabel": "View",
            })

        # Real skill bar data
        skill_bar = []
        if analytics:
            all_skills = analytics["skillsFreq"]
            total = analytics["totalStudents"]
            top_skills = sorted(all_skills.items(), key=lambda x: x[1], reverse=True)[:6]
            for sk, cnt in top_skills:
                coverage = min(100, int((cnt / total) * 100))
                skill_bar.append({"skill": sk.title(), "demand": 85, "coverage": coverage, "gap": max(0, 85 - coverage)})

        normalized_partners = [normalize_partner_company(c) for c in (profile.partner_companies or [])[:5]]
        total_partner_hires = sum(c["studentsHired"] for c in normalized_partners) or 1

        placed_pct = int(placement_rate)
        return {
            "stats": stats,
            "radarData": radar_data,
            "alerts": alerts,
            "skillBarData": skill_bar,
            "placementDonut": [
                {"name": "Placement Ready", "value": placed_pct, "color": "#10B981"},
                {"name": "Needs Work", "value": 100 - placed_pct, "color": "#E5E7EB"},
            ],
            "programmePlacements": [
                {"programme": "All Programmes", "rate": placed_pct, "total": total_students, "placed": placed}
            ],
            "topEmployers": [{
                "name": c["name"],
                "hires": c["studentsHired"],
                "percentage": round((c["studentsHired"] / total_partner_hires) * 100),
                "topRole": (c.get("topRoles") or ["-"])[0],
                "avgSalary": "Not available",
                "color": "#4F46E5",
                "initials": "".join(part[0] for part in c["name"].split()[:2]).upper() or c["name"][:1].upper(),
            } for c in normalized_partners],
            "interventions": [],
        }
    except Exception as e:
        print(f"[ERROR uni dashboard]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/dashboard/alerts")
async def get_dashboard_alerts(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        analytics = await compute_university_analytics(profile.institution_name)
        alerts = []
        if analytics:
            missing_freq = analytics["missingFreq"]
            for skill, count in sorted(missing_freq.items(), key=lambda x: x[1], reverse=True)[:5]:
                alerts.append({
                    "id": f"gap_{skill}",
                    "type": "warning",
                    "message": f"{count} students show critical gaps in {skill.title()}.",
                    "date": datetime.now().isoformat(),
                    "actionLabel": "View",
                })
        return alerts
    except Exception:
        raise HTTPException(500, "Internal error")

@router.get("/students")
async def get_students_analytics(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        analytics = await compute_university_analytics(profile.institution_name)

        total = analytics["totalStudents"] if analytics else 0
        avg_score = analytics["avgScore"] if analytics else 0
        placed = analytics["placedCount"] if analytics else 0
        missing_freq = analytics["missingFreq"] if analytics else {}

        # Real score distribution
        all_students = await Student.find(Student.institution == profile.institution_name).to_list()
        dist_buckets: dict = {"90-100": 0, "80-89": 0, "70-79": 0, "60-69": 0, "50-59": 0, "<50": 0}
        for s in all_students:
            ext = s.extracted_data or {}
            score = (ext.get("gap_report") or {}).get("score", 0) or 0
            if score >= 90: dist_buckets["90-100"] += 1
            elif score >= 80: dist_buckets["80-89"] += 1
            elif score >= 70: dist_buckets["70-79"] += 1
            elif score >= 60: dist_buckets["60-69"] += 1
            elif score >= 50: dist_buckets["50-59"] += 1
            else: dist_buckets["<50"] += 1

        dist = [{"range": k, "count": v} for k, v in dist_buckets.items()]

        top_missing = [
            {"skill": k.title(), "count": v}
            for k, v in sorted(missing_freq.items(), key=lambda x: x[1], reverse=True)[:8]
        ]

        return {
            "stats": {
                "totalStudents": total,
                "activeProfiles": len([s for s in all_students if s.extracted_data]),
                "avgMatchScore": avg_score,
                "placedStudents": placed,
            },
            "programmes": [
                {"id": "all", "name": "All Programmes", "studentCount": total, "avgScore": avg_score}
            ],
            "missingSkills": top_missing,
            "scoreDistribution": dist,
            "scoreByProgramme": {"All Programmes": dist},
        }
    except Exception as e:
        print(f"[ERROR uni students]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/placements")
async def get_placements(year: Optional[str] = None, current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        analytics = await compute_university_analytics(profile.institution_name)
        placed = analytics["placedCount"] if analytics else 0
        total = analytics["totalStudents"] if analytics else 0
        rate = analytics["placementRate"] if analytics else 0

        students = await Student.find(Student.institution == profile.institution_name).to_list()
        student_emails = {s.email.lower() for s in students if s.email}
        apps = await Application.find_all().to_list()
        institution_apps = [a for a in apps if (a.student_email or "").lower() in student_emails]
        actively_seeking = len({(a.student_email or "").lower() for a in institution_apps if a.status in ("applied", "reviewing", "shortlisted", "interview")})

        return {
            "stats": {
                "totalEligible": total,
                "activelySeeking": actively_seeking,
                "secured": placed,
                "overallRate": rate,
            },
            "programmes": [],
            "companies": [],
            "roles": [],
            "durations": [],
        }
    except Exception:
        raise HTTPException(500, "Internal error")

@router.get("/placements/funnel")
async def get_placement_funnel(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        analytics = await compute_university_analytics(profile.institution_name)
        students = await Student.find(Student.institution == profile.institution_name).to_list()
        student_emails = {(s.email or "").lower() for s in students}
        total = analytics["totalStudents"] if analytics else len(students)
        active = len([s for s in students if s.extracted_data])
        apps = await Application.find_all().to_list()
        institution_apps = [a for a in apps if (a.student_email or "").lower() in student_emails]
        interview_count = sum(1 for a in institution_apps if a.status == "interview")
        offer_count = sum(1 for a in institution_apps if a.status in ("offer", "hired"))
        return [
            {"stage": "Total Students", "count": total},
            {"stage": "Active Profiles", "count": active},
            {"stage": "Applications", "count": len(institution_apps)},
            {"stage": "Interviews", "count": interview_count},
            {"stage": "Offers", "count": offer_count},
        ]
    except Exception:
        raise HTTPException(500, "Internal error")

@router.get("/placements/by-programme")
async def get_placements_by_programme(year: Optional[str] = None, current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        analytics = await compute_university_analytics(profile.institution_name)
        placed = analytics["placedCount"] if analytics else 0
        total = analytics["totalStudents"] if analytics else 0
        rate = analytics["placementRate"] if analytics else 0
        return [{
            "name": "All Programmes",
            "eligible": total,
            "seeking": total - placed,
            "secured": placed,
            "rate": rate,
            "trend": 0
        }]
    except Exception:
        raise HTTPException(500, "Internal error")

@router.get("/placements/top-companies")
async def get_top_companies(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        students = await Student.find(Student.institution == profile.institution_name).to_list()
        student_by_email = {(s.email or "").lower(): s for s in students if s.email}
        apps = await Application.find_all().to_list()
        institution_apps = [a for a in apps if (a.student_email or "").lower() in student_by_email]

        jobs = await Job.find_all().to_list()
        job_company = {str(j.id): j.company for j in jobs}

        by_company: dict = defaultdict(lambda: {"interns": 0, "roles": defaultdict(int)})
        for app in institution_apps:
            company = job_company.get(str(app.job_id)) or "Unknown Company"
            if app.status in ("offer", "hired"):
                by_company[company]["interns"] += 1

            student = student_by_email.get((app.student_email or "").lower())
            role = (student.target_role if student and student.target_role else "Unknown")
            by_company[company]["roles"][role] += 1

        if not by_company:
            normalized = [normalize_partner_company(c) for c in (profile.partner_companies or [])]
            normalized.sort(key=lambda c: c["studentsHired"], reverse=True)
            return [
                {
                    "id": c["id"],
                    "rank": idx + 1,
                    "name": c["name"],
                    "interns": c["studentsHired"],
                    "roles": [{"role": r, "count": 0} for r in (c.get("topRoles") or [])[:3]],
                }
                for idx, c in enumerate(normalized)
            ]

        ranked = sorted(by_company.items(), key=lambda x: x[1]["interns"], reverse=True)
        results = []
        for idx, (company, data) in enumerate(ranked[:10]):
            top_roles = sorted(data["roles"].items(), key=lambda x: x[1], reverse=True)[:3]
            results.append({
                "id": company.lower().replace(" ", "-") or f"company-{idx+1}",
                "rank": idx + 1,
                "name": company,
                "interns": data["interns"],
                "roles": [{"role": role, "count": count} for role, count in top_roles],
            })
        return results
    except Exception:
        raise HTTPException(500, "Internal error")

@router.get("/placements/by-role")
async def get_placements_by_role(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        all_students = await Student.find(Student.institution == profile.institution_name).to_list()
        role_counts: dict = {}
        for s in all_students:
            role = s.target_role or "Unknown"
            role_counts[role] = role_counts.get(role, 0) + 1
        total = sum(role_counts.values()) or 1
        roles = [
            {
                "name": r,
                "students": c,
                "percent": round((c / total) * 100),
                "duration": 0,
            }
            for r, c in sorted(role_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        return roles
    except Exception:
        raise HTTPException(500, "Internal error")

@router.get("/placements/by-duration")
async def get_placements_by_duration(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        students = await Student.find(Student.institution == profile.institution_name).to_list()
        student_emails = {(s.email or "").lower() for s in students if s.email}
        apps = await Application.find_all().to_list()
        institution_apps = [a for a in apps if (a.student_email or "").lower() in student_emails]

        buckets = {
            "0-1 Months": 0,
            "1-3 Months": 0,
            "3-6 Months": 0,
            "6+ Months": 0,
        }
        for app in institution_apps:
            start = app.applied_at
            end = app.status_updated_at or app.applied_at
            if not start or not end:
                continue
            days = max(0, (end - start).days)
            if days <= 30:
                buckets["0-1 Months"] += 1
            elif days <= 90:
                buckets["1-3 Months"] += 1
            elif days <= 180:
                buckets["3-6 Months"] += 1
            else:
                buckets["6+ Months"] += 1

        total = sum(buckets.values()) or 1
        return [
            {"label": label, "count": count, "percentage": round((count / total) * 100)}
            for label, count in buckets.items()
        ]
    except Exception:
        raise HTTPException(500, "Internal error")

@router.get("/partners")
async def get_partners(
    status: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    size: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_university)
):
    try:
        profile = await get_university_profile(current_user)
        companies = [normalize_partner_company(c) for c in (profile.partner_companies or [])]

        if status:
            companies = [c for c in companies if c["status"].lower() == status.lower()]
        if industry:
            companies = [c for c in companies if c["industry"].lower() == industry.lower()]
        if size:
            companies = [c for c in companies if c["size"].lower() == size.lower()]
        if search:
            q = search.lower().strip()
            companies = [
                c for c in companies
                if q in c["name"].lower() or q in c["industry"].lower() or q in (c.get("website") or "").lower()
            ]

        active_partners = sum(1 for c in companies if c["status"] == "Active")
        total_hired = sum(c.get("studentsHired", 0) for c in companies)
        total_jobs = sum(c.get("activeJobs", 0) for c in companies)
        return {
            "companies": companies,
            "stats": {
                "totalPartners": len(companies),
                "activePartners": active_partners,
                "totalHired": total_hired,
                "totalJobs": total_jobs,
            }
        }
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.get("/partners/stats")
async def get_partner_stats(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        companies = [normalize_partner_company(c) for c in (profile.partner_companies or [])]
        return {
            "totalPartners": len(companies),
            "activePartners": sum(1 for c in companies if c["status"] == "Active"),
            "totalHired": sum(c.get("studentsHired", 0) for c in companies),
            "totalJobs": sum(c.get("activeJobs", 0) for c in companies),
        }
    except Exception:
        raise HTTPException(500, "Internal error")

@router.post("/partners")
async def add_partner(data: dict = Body(...), current_user: User = Depends(require_university)):
    try:
        import uuid
        profile = await get_university_profile(current_user)
        company_name = str(data.get("name", "")).strip()
        partner = {
            "id": str(uuid.uuid4()),
            "name": company_name,
            "industry": data.get("industry", "Unknown"),
            "website": data.get("website", ""),
            "size": data.get("size", "Unknown"),
            "status": data.get("status", "New"),
            "activeJobs": 0,
            "hiredStudents": 0,
            "email": data.get("email", ""),
            "topRoles": data.get("topRoles", []),
            "since": datetime.now().year,
            "logo": company_name[0].upper() if company_name else "?",
            "logoColor": _partner_logo_color(company_name),
        }
        profile.partner_companies.append(partner)
        await profile.save()
        return {"success": True, "partner": normalize_partner_company(partner)}
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.get("/curriculum/skills")
async def get_curriculum_skills(
    programme: Optional[str] = None,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    current_user: User = Depends(require_university)
):
    try:
        profile = await get_university_profile(current_user)
        analytics = await compute_university_analytics(profile.institution_name)
        if not analytics:
            return {"stats": {"totalSkillsTracked": 0, "skillsAtRisk": 0, "averageCoverage": 0, "industryAlignment": 0}, "skills": []}

        skills_freq = analytics["skillsFreq"]
        missing_freq = analytics["missingFreq"]
        total = analytics["totalStudents"]

        # Build skill list from what we know
        all_skill_data = []
        skill_categories = {
            "react": "Frontend", "vue": "Frontend", "angular": "Frontend", "typescript": "Frontend", "html": "Frontend", "css": "Frontend",
            "python": "Backend", "node.js": "Backend", "java": "Backend", "django": "Backend", "fastapi": "Backend",
            "mongodb": "Database", "postgresql": "Database", "mysql": "Database", "sql": "Database",
            "docker": "DevOps", "aws": "Cloud", "kubernetes": "Cloud", "gcp": "Cloud",
            "tensorflow": "AI/ML", "pytorch": "AI/ML", "machine learning": "AI/ML",
        }

        seen = set()
        all_skill_names = set(skills_freq.keys()) | set(missing_freq.keys())
        for i, sk in enumerate(all_skill_names):
            if sk in seen: continue
            seen.add(sk)
            freq = skills_freq.get(sk, 0)
            miss = missing_freq.get(sk, 0)
            coverage = min(100, int((freq / total) * 100))
            demand = min(100, 60 + miss * 5)  # Higher demand if more students are missing it
            gap = max(0, demand - coverage)
            cat = skill_categories.get(sk, "General")
            if category and cat.lower() != category.lower():
                continue
            trend = "up" if gap > 25 else "stable"
            if severity == "critical" and gap < 30:
                continue
            if severity == "moderate" and gap >= 30:
                continue
            all_skill_data.append({
                "id": f"s_{i}",
                "name": sk.title(),
                "category": cat,
                "marketDemand": demand,
                "studentCompetency": coverage,
                "gap": gap,
                "trend": trend,
            })

        all_skill_data.sort(key=lambda x: x["gap"], reverse=True)
        at_risk = sum(1 for s in all_skill_data if s["gap"] >= 30)
        avg_cov = int(sum(s["studentCompetency"] for s in all_skill_data) / len(all_skill_data)) if all_skill_data else 0

        return {
            "stats": {
                "totalSkillsTracked": len(all_skill_data),
                "skillsAtRisk": at_risk,
                "averageCoverage": avg_cov,
                "industryAlignment": max(0, avg_cov - 10),
            },
            "skills": all_skill_data,
        }
    except Exception as e:
        print(f"[ERROR curriculum]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/curriculum/stats")
async def get_curriculum_stats(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        analytics = await compute_university_analytics(profile.institution_name)
        if not analytics:
            return {"totalSkillsTracked": 0, "skillsAtRisk": 0, "averageCoverage": 0, "industryAlignment": 0}
        skills_freq = analytics["skillsFreq"]
        missing_freq = analytics["missingFreq"]
        total = analytics["totalStudents"]
        all_skills = set(skills_freq.keys()) | set(missing_freq.keys())
        at_risk = sum(1 for sk in all_skills if missing_freq.get(sk, 0) > total * 0.3)
        coverages = [min(100, int((skills_freq.get(sk, 0) / total) * 100)) for sk in all_skills]
        avg_cov = int(sum(coverages) / len(coverages)) if coverages else 0
        return {
            "totalSkillsTracked": len(all_skills),
            "skillsAtRisk": at_risk,
            "averageCoverage": avg_cov,
            "industryAlignment": max(0, avg_cov - 10),
        }
    except Exception:
        raise HTTPException(500, "Internal error")

@router.get("/curriculum/skills/{skill_name}/detail")
async def get_skill_detail(skill_name: str, current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        analytics = await compute_university_analytics(profile.institution_name)
        if not analytics:
            return {"name": skill_name, "gap": 0, "recommendations": []}

        skills_freq = analytics["skillsFreq"]
        missing_freq = analytics["missingFreq"]
        total = analytics["totalStudents"]

        freq = skills_freq.get(skill_name.lower(), 0)
        miss = missing_freq.get(skill_name.lower(), 0)
        coverage = min(100, int((freq / total) * 100))
        demand = min(100, 60 + miss * 5)
        gap = max(0, demand - coverage)

        # Basic recommendations based on gap
        recs = []
        if gap > 50:
            recs = [
                f"Immediate curriculum revision required for {skill_name}.",
                "Introduce mandatory practical modules.",
                "Partner with industry for guest lectures."
            ]
        elif gap > 30:
            recs = [
                f"Strengthen {skill_name} in existing modules.",
                "Offer optional certification bootcamps.",
                "Update lab materials to latest industry standards."
            ]
        else:
            recs = [
                f"{skill_name} competency is well-aligned.",
                "Monitor for future industry shifts.",
                "Encourage advanced project work in this area."
            ]

        return {
            "name": skill_name,
            "category": "Technology",
            "marketDemand": demand,
            "studentCompetency": coverage,
            "gap": gap,
            "trend": "up" if gap > 25 else "stable",
            "relatedCourses": ["Advanced Web Dev", "Professional Practice"],
            "recommendations": recs
        }
    except Exception as e:
        print(f"[ERROR skill detail]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/settings")
async def get_settings(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        return {
            "institutionName": profile.institution_name,
            "website": profile.website,
            "address": profile.address,
            "personalName": profile.personal_name or current_user.name,
            "personalEmail": current_user.email,
            "personalRole": profile.personal_role,
            "personalPhone": profile.personal_phone,
            "faculty": profile.faculty,
            "accountType": profile.account_type,
            "notifications": profile.notification_settings or {
                "placementAlerts": True,
                "curriculumGaps": True,
                "monthlyReport": True,
            }
        }
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.put("/settings")
async def update_settings(data: dict = Body(...), current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        if "personalName" in data:
            profile.personal_name = data["personalName"]
            current_user.name = data["personalName"]
            await current_user.save()
        if "institutionName" in data: profile.institution_name = data["institutionName"]
        if "website" in data: profile.website = data["website"]
        if "address" in data: profile.address = data["address"]
        if "personalRole" in data: profile.personal_role = data["personalRole"]
        if "personalPhone" in data: profile.personal_phone = data["personalPhone"]
        if "faculty" in data: profile.faculty = data["faculty"]
        if "accountType" in data: profile.account_type = data["accountType"]
        if "notifications" in data: profile.notification_settings = data["notifications"]
        await profile.save()

        # Return the full updated account object so frontend forms can
        # consume a consistent response shape after saving.
        return await get_settings(current_user)
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.post("/settings/deactivate")
async def deactivate_account(current_user: User = Depends(require_university)):
    try:
        profile = await UniversityProfile.find_one(UniversityProfile.uni_email == current_user.email)
        if profile:
            await profile.delete()

        # Permanently remove the university user account.
        await current_user.delete()
        return {"success": True}
    except Exception as e:
        raise HTTPException(500, "Internal error")

# ─── Settings aliases expected by frontend ────────────────────────────────────

@router.get("/settings/account")
async def get_settings_account(current_user: User = Depends(require_university)):
    """Alias — frontend calls /settings/account instead of /settings."""
    return await get_settings(current_user)

@router.put("/settings/account")
async def update_settings_account(data: dict = Body(...), current_user: User = Depends(require_university)):
    """Alias — frontend calls /settings/account instead of /settings."""
    return await update_settings(data, current_user)

@router.get("/settings/notifications")
async def get_notification_settings(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        return profile.notification_settings or {
            "placementAlerts": True,
            "curriculumGaps": True,
            "monthlyReport": True,
        }
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.put("/settings/notifications")
async def update_notification_settings(data: dict = Body(...), current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        profile.notification_settings = data
        await profile.save()
        return {"success": True}
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.get("/settings/data")
async def get_data_governance(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        students = await Student.find(Student.institution == profile.institution_name).to_list()
        with_profiles = len([s for s in students if s.extracted_data])
        return {
            "studentsTracked": len(students),
            "profilesWithData": with_profiles,
            "institution": profile.institution_name,
            "lastUpdated": datetime.now().isoformat(),
        }
    except Exception:
        raise HTTPException(500, "Internal error")

@router.put("/settings/data")
async def update_data_governance(data: dict = Body(...), current_user: User = Depends(require_university)):
    # Endpoint retained for frontend compatibility until data-governance persistence is introduced.
    return {"success": True, "settings": data}

@router.get("/settings/team")
async def get_team(current_user: User = Depends(require_university)):
    profile = await get_university_profile(current_user)
    name = (profile.personal_name or current_user.name or "").strip() or "University Admin"
    initials = "".join(part[0] for part in name.split()[:2]).upper() or "UA"
    return {
        "members": [
            {
                "id": str(current_user.id),
                "name": name,
                "email": current_user.email,
                "role": "Owner",
                "isYou": True,
                "avatar": initials,
                "avatarColor": "#2563EB",
                "department": profile.faculty or "Administration",
                "joinedDate": "-",
            }
        ],
        "invites": []
    }

@router.post("/settings/team/invite")
async def invite_team_member(data: dict = Body(...), current_user: User = Depends(require_university)):
    raise HTTPException(501, "Team invitations are not enabled yet.")

@router.delete("/settings/team/{member_id}")
async def remove_team_member(member_id: str, current_user: User = Depends(require_university)):
    raise HTTPException(501, "Team member removal is not enabled yet.")

@router.delete("/settings/team/invites/{invite_id}")
async def revoke_team_invite(invite_id: str, current_user: User = Depends(require_university)):
    raise HTTPException(501, "Invite revocation is not enabled yet.")

@router.post("/settings/change-password")
async def change_password(data: dict = Body(...), current_user: User = Depends(require_university)):
    from auth.utils import verify_password, hash_password
    try:
        current = data.get("currentPassword")
        new_pwd = data.get("newPassword")
        if not verify_password(current, current_user.hashed_password):
            raise HTTPException(401, "Invalid current password")
        current_user.hashed_password = hash_password(new_pwd)
        await current_user.save()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Internal error")

# ─── Dashboard sub-endpoints ──────────────────────────────────────────────────

@router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        analytics = await compute_university_analytics(profile.institution_name)
        total = analytics["totalStudents"] if analytics else 0
        avg = analytics["avgScore"] if analytics else 0
        placed = analytics["placedCount"] if analytics else 0
        return {
            "totalStudents": total,
            "averageMatchScore": avg,
            "placedStudents": placed,
            "totalPartners": len(profile.partner_companies),
            "recentJobMatches": 0,
            "atRiskStudents": total - placed,
            "institutionName": profile.institution_name,
            "personalName": profile.personal_name or current_user.name or "Administrator",
        }
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.put("/dashboard/alerts/{alert_id}/dismiss")
async def dismiss_alert(alert_id: str, current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        if not profile.dismissed_alerts:
            profile.dismissed_alerts = []
        if alert_id not in profile.dismissed_alerts:
            profile.dismissed_alerts.append(alert_id)
            await profile.save()
        return {"success": True}
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.get("/dashboard/skill-gap-radar")
async def get_skill_gap_radar(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        analytics = await compute_university_analytics(profile.institution_name)
        if not analytics:
            return []
        return make_radar_from_analytics(analytics)
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.get("/dashboard/skill-bar")
async def get_skill_bar(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        analytics = await compute_university_analytics(profile.institution_name)
        if not analytics:
            return []
        all_skills = analytics["skillsFreq"]
        total = analytics["totalStudents"]
        top_skills = sorted(all_skills.items(), key=lambda x: x[1], reverse=True)[:6]
        return [
            {"skill": sk.title(), "demand": 85, "coverage": min(100, int((cnt / total) * 100)), "gap": max(0, 85 - min(100, int((cnt / total) * 100)))}
            for sk, cnt in top_skills
        ]
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.get("/dashboard/placement-summary")
async def get_placement_summary(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        analytics = await compute_university_analytics(profile.institution_name)
        placed_pct = int(analytics["placementRate"]) if analytics else 0
        return [
            {"name": "Placement Ready", "value": placed_pct, "color": "#10B981"},
            {"name": "Needs Work", "value": 100 - placed_pct, "color": "#E5E7EB"},
        ]
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.get("/dashboard/programme-placements")
async def get_programme_placements(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        analytics = await compute_university_analytics(profile.institution_name)
        placed = analytics["placedCount"] if analytics else 0
        total = analytics["totalStudents"] if analytics else 0
        rate = analytics["placementRate"] if analytics else 0
        return [{"programme": "All Programmes", "rate": int(rate), "total": total, "placed": placed}]
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.get("/dashboard/top-employers")
async def get_top_employers(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        return [
            {
                "name": c["name"],
                "hires": c.get("hiredStudents", 0),
                "percentage": 0,
                "topRole": "SE",
                "avgSalary": "N/A",
                "color": "#4F46E5",
                "initials": c["name"][0],
            }
            for c in (profile.partner_companies or [])[:5]
        ]
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.get("/dashboard/interventions")
async def get_interventions(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        return profile.interventions or []
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.post("/dashboard/interventions")
async def create_intervention(data: dict = Body(...), current_user: User = Depends(require_university)):
    try:
        import uuid
        profile = await get_university_profile(current_user)
        if not profile.interventions:
            profile.interventions = []
        intervention = {"id": str(uuid.uuid4()), **data}
        profile.interventions.append(intervention)
        await profile.save()
        return intervention
    except Exception as e:
        raise HTTPException(500, "Internal error")

# ─── Students sub-endpoints ───────────────────────────────────────────────────

@router.get("/students/stats")
async def get_student_stats(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        analytics = await compute_university_analytics(profile.institution_name)
        all_students = await Student.find(Student.institution == profile.institution_name).to_list()
        return {
            "totalStudents": analytics["totalStudents"],
            "avgScore": analytics["avgScore"],
            "avgProfile": analytics["avgProfile"],
            "avgGithub": analytics["avgGithub"],
            "avgCv": analytics["avgCv"],
            "placedStudents": analytics["placedCount"],
            "totalAtRisk": analytics["totalStudents"] - analytics["placedCount"]
        }
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.get("/students/programmes")
async def get_programmes(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        analytics = await compute_university_analytics(profile.institution_name)
        total = analytics["totalStudents"]
        avg = analytics["avgScore"]
        return [{
            "id": "all",
            "name": "All Programmes",
            "students": total,
            "avgScore": avg,
            "atRisk": total - analytics["placedCount"],
            "profileCompletion": analytics["avgProfile"],
            "githubRate": analytics["avgGithub"],
            "cvRate": analytics["avgCv"]
        }]
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.get("/students/score-distribution")
async def get_score_distribution(programme: Optional[str] = None, current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        all_students = await Student.find(Student.institution == profile.institution_name).to_list()
        buckets: dict = {"90-100": 0, "80-89": 0, "70-79": 0, "60-69": 0, "50-59": 0, "<50": 0}
        for s in all_students:
            ext = s.extracted_data or {}
            score = (ext.get("gap_report") or {}).get("score", 0) or 0
            if score >= 90: buckets["90-100"] += 1
            elif score >= 80: buckets["80-89"] += 1
            elif score >= 70: buckets["70-79"] += 1
            elif score >= 60: buckets["60-69"] += 1
            elif score >= 50: buckets["50-59"] += 1
            else: buckets["<50"] += 1
        return [{"range": k, "count": v} for k, v in buckets.items()]
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.get("/students/missing-skills")
async def get_missing_skills(current_user: User = Depends(require_university)):
    try:
        profile = await get_university_profile(current_user)
        analytics = await compute_university_analytics(profile.institution_name)
        if not analytics:
            return []
        missing_freq = analytics["missingFreq"]
        total = analytics["totalStudents"] or 1
        
        results = []
        for k, v in sorted(missing_freq.items(), key=lambda x: x[1], reverse=True)[:8]:
            pct = (v / total) * 100
            severity = "critical" if pct > 50 else "moderate" if pct > 25 else "low"
            results.append({
                "skill": k.title(),
                "studentsLacking": v,
                "category": "General", # Default category
                "severity": severity
            })
        return results
    except Exception as e:
        raise HTTPException(500, "Internal error")

# ─── Partners contact stub ────────────────────────────────────────────────────

@router.post("/partners/{partner_id}/contact")
async def contact_partner(partner_id: str, data: dict = Body(...), current_user: User = Depends(require_university)):
    raise HTTPException(501, "Partner contact workflow is not enabled yet.")
