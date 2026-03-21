from fastapi import APIRouter, Depends, HTTPException, Query, Body, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import math
import uuid
import base64
from io import BytesIO
from PIL import Image
from auth.models import User
from auth.dependencies import get_current_user
from routers.recruiter_models import RecruiterProfile, RecruiterJob, ScheduleEvent
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
        profile = RecruiterProfile(recruiter_email=current_user.email, company_name="")
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
        "Hired": "hired",
        "Rejected": "rejected",
    }
    return mapping.get(stage, "applied")

def _as_naive_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if not dt:
        return None
    return dt.replace(tzinfo=None) if dt.tzinfo else dt

async def build_recruiter_analytics_scope(recruiter_email: str):
    """Return recruiter jobs, all linked application job IDs, and mapping to recruiter job IDs."""
    jobs = await RecruiterJob.find(RecruiterJob.recruiter_email == recruiter_email).to_list()
    recruiter_job_ids = {str(j.id) for j in jobs}

    app_job_to_recruiter_job = {jid: jid for jid in recruiter_job_ids}

    mirrored_student_jobs = await Job.find({"recruiter_job_id": {"$in": list(recruiter_job_ids)}}).to_list()
    for sj in mirrored_student_jobs:
        if getattr(sj, "recruiter_job_id", None):
            app_job_to_recruiter_job[str(sj.id)] = str(sj.recruiter_job_id)

    linked_app_job_ids = set(app_job_to_recruiter_job.keys())
    return jobs, linked_app_job_ids, app_job_to_recruiter_job

def build_dashboard_stats(current_user: User, profile: RecruiterProfile, jobs: List[RecruiterJob], apps: List[Application]) -> dict:
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    active_jobs = [j for j in jobs if j.status == "active"]
    new_apps = [a for a in apps if a.status == "applied"]
    interviews = sum(1 for a in apps if a.status == "interview")
    hires = sum(1 for a in apps if a.status == "hired")
    offers_total = sum(1 for a in apps if a.status in {"offer", "hired"})

    hired_apps = [a for a in apps if a.status == "hired" and a.applied_at]
    if hired_apps:
        avg_days = sum(max(0, (now - _as_naive_utc(a.applied_at)).days) for a in hired_apps) / len(hired_apps)
        avg_time_to_hire = int(round(avg_days))
    else:
        avg_time_to_hire = 0

    active_jobs_this_week = sum(1 for j in active_jobs if _as_naive_utc(getattr(j, "created_at", None)) and _as_naive_utc(j.created_at) >= week_ago)
    candidates_this_week = sum(1 for a in apps if _as_naive_utc(a.applied_at) and _as_naive_utc(a.applied_at) >= week_ago)

    return {
        "recruiterName": current_user.name or "Recruiter",
        "activeJobs": len(active_jobs),
        "totalCandidates": len(apps),
        "newApplicants": len(new_apps),
        "totalApplicants": len(apps),
        "interviews": interviews,
        "hires": hires,
        "avgTimeToHire": avg_time_to_hire,
        "offerAcceptRate": round((hires / offers_total) * 100) if offers_total > 0 else 0,
        "companyName": profile.company_name,
        "activeJobsThisWeek": active_jobs_this_week,
        "candidatesThisWeek": candidates_this_week,
    }

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
        "candidateId": str(student.id) if student else "",
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

    status_map = {"active": "Active", "draft": "Draft", "closed": "Closed", "archived": "Archived", "filled": "Filled"}
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
            "Rejected": sum(1 for a in apps if a.status == "rejected"),
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
            "stats": build_dashboard_stats(current_user, profile, jobs, apps),
            "pipelineStats": pipeline,
            "recentApplications": recent_apps,
            "activeJobRows": job_rows,
            "upcomingInterviews": [],
        }
    except Exception as e:
        print(f"[ERROR dashboard]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/dashboard/schedule")
async def get_schedule(current_user: User = Depends(require_recruiter)):
    try:
        events = await ScheduleEvent.find(
            ScheduleEvent.recruiter_email == current_user.email
        ).to_list()
        
        # Format for frontend: Record<string, { time, title, type, detail }[]>
        schedule_data = {}
        for ev in events:
            if ev.date not in schedule_data:
                schedule_data[ev.date] = []
            schedule_data[ev.date].append({
                "id": str(ev.id),
                "time": ev.time,
                "title": ev.title,
                "type": ev.type,
                "detail": ev.detail
            })
        
        # Sort events inside each date by time (string sort works as long as it's HH:MM)
        for date_key in schedule_data:
            schedule_data[date_key].sort(key=lambda x: x["time"])
            
        return schedule_data
    except Exception as e:
        print(f"[ERROR schedule GET]: {e}")
        raise HTTPException(500, "Internal error")

class ScheduleEventCreate(BaseModel):
    date: str
    time: str
    title: str
    type: str
    detail: str = ""

@router.post("/dashboard/schedule")
async def create_schedule_event(data: ScheduleEventCreate, current_user: User = Depends(require_recruiter)):
    try:
        new_event = ScheduleEvent(
            recruiter_email=current_user.email,
            date=data.date,
            time=data.time,
            title=data.title,
            type=data.type,
            detail=data.detail
        )
        await new_event.insert()
        return {"success": True, "id": str(new_event.id)}
    except Exception as e:
        print(f"[ERROR schedule POST]: {e}")
        raise HTTPException(500, "Internal error")

@router.delete("/dashboard/schedule/{event_id}")
async def delete_schedule_event(event_id: str, current_user: User = Depends(require_recruiter)):
    try:
        event = await ScheduleEvent.get(event_id)
        if not event:
            raise HTTPException(404, "Schedule event not found")
        if event.recruiter_email != current_user.email:
            raise HTTPException(403, "Access denied")

        await event.delete()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR schedule DELETE]: {e}")
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
        
        # Calculate summary stats (aligned to selected range)
        jobs, linked_job_ids, app_job_to_recruiter_job = await build_recruiter_analytics_scope(current_user.email)
        apps = await Application.find({"job_id": {"$in": list(linked_job_ids)}}).to_list()

        range_days = {"7d": 7, "30d": 30, "90d": 90}.get(range, 30)
        now = datetime.utcnow()
        range_start = now - timedelta(days=range_days)

        apps_in_range = [
            a for a in apps
            if a.applied_at and range_start <= _as_naive_utc(a.applied_at) <= now
        ]

        status_updates_in_range = [
            a for a in apps
            if (
                _as_naive_utc(getattr(a, "status_updated_at", None))
                or _as_naive_utc(a.applied_at)
            ) and (
                _as_naive_utc(getattr(a, "status_updated_at", None))
                or _as_naive_utc(a.applied_at)
            ) >= range_start
        ]
        
        total_apps = len(apps_in_range)
        interviews = sum(1 for a in status_updates_in_range if a.status in ("interview", "offer", "hired"))
        offers = sum(1 for a in status_updates_in_range if a.status in ("offer", "hired"))
        hired = sum(1 for a in status_updates_in_range if a.status == "hired")
        
        # Calculate avgMatchScore across all apps
        job_dict = {str(j.id): j for j in jobs}
        match_scores = []
        for a in apps_in_range:
            student = await Student.find_one(Student.email == a.student_email)
            recruiter_job_id = app_job_to_recruiter_job.get(str(a.job_id))
            if student and recruiter_job_id and recruiter_job_id in job_dict:
                match_scores.append(await compute_match_score(student, job_dict[recruiter_job_id]))
        avg_match = int(sum(match_scores) / len(match_scores)) if match_scores else 0
        
        # Real time-to-hire approximation from hired application timelines within range.
        hired_apps = [a for a in status_updates_in_range if a.status == "hired" and a.applied_at]
        time_to_hire = int(
            sum(max(0, (now - _as_naive_utc(a.applied_at)).days) for a in hired_apps) / len(hired_apps)
        ) if hired_apps else 0
        
        # Keep card KPI aligned with Application Trends line total.
        total_apps_from_trends = sum(int(point.get("apps", 0)) for point in trends)

        return {
            "stats": {
                "totalApplications": total_apps_from_trends,
                "avgMatchScore": avg_match,
                "avgTimeToHire": time_to_hire,
                "interviewRate": int((interviews/total_apps*100)) if total_apps > 0 else 0,
                "offerAcceptRate": int((hired/offers*100)) if offers > 0 else 0,
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
        _, linked_job_ids, _ = await build_recruiter_analytics_scope(current_user.email)
        apps = await Application.find({"job_id": {"$in": list(linked_job_ids)}}).to_list()

        now = datetime.utcnow()
        range_start = now - timedelta(days=days)
        
        if days <= 7:
            num_points = days
            period_days = 1
        else:
            num_points = max(1, math.ceil(days / 7))
            period_days = 7

        result = []
        for i in range(num_points):
            period_start = range_start + timedelta(days=i * period_days)
            period_end = min(period_start + timedelta(days=period_days), now)
            period_applied = [
                a for a in apps
                if a.applied_at and period_start <= _as_naive_utc(a.applied_at) < period_end
            ]

            period_status_updates = [
                a for a in apps
                if (
                    _as_naive_utc(getattr(a, "status_updated_at", None))
                    or _as_naive_utc(a.applied_at)
                )
                and period_start <= (
                    _as_naive_utc(getattr(a, "status_updated_at", None))
                    or _as_naive_utc(a.applied_at)
                ) < period_end
            ]
            
            interviews = sum(1 for a in period_status_updates if a.status in ("interview", "offer", "hired"))
            offers = sum(1 for a in period_status_updates if a.status in ("offer", "hired"))
            hired = sum(1 for a in period_status_updates if a.status == "hired")
            rejected = sum(1 for a in period_status_updates if a.status == "rejected")

            if days <= 7:
                label = period_start.strftime("%b %d")
            else:
                label = f"{period_start.strftime('%b %d')} - {(period_end - timedelta(days=1)).strftime('%b %d')}"

            result.append({
                "label": label,
                "apps": len(period_applied),
                "interviews": interviews,
                "offers": offers,
                "hired": hired,
                "rejected": rejected,
            })
        return result
    except Exception as e:
        print(f"[ERROR trends]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/analytics/sources")
async def get_source_breakdown(current_user: User = Depends(require_recruiter)):
    try:
        _, linked_job_ids, _ = await build_recruiter_analytics_scope(current_user.email)
        apps = await Application.find({"job_id": {"$in": list(linked_job_ids)}}).to_list()

        if not apps:
            return []

        referral = 0
        github = 0
        direct = 0

        for app in apps:
            tags = {t.lower() for t in (app.tags or [])}
            if "referral" in tags:
                referral += 1
                continue

            student = await Student.find_one(Student.email == app.student_email)
            if student and student.github_url:
                github += 1
            else:
                direct += 1

        total = max(len(apps), 1)
        source_rows = [
            {"name": "Direct Platform", "value": round((direct / total) * 100)},
            {"name": "GitHub Portfolio", "value": round((github / total) * 100)},
            {"name": "Referral", "value": round((referral / total) * 100)},
        ]
        return [row for row in source_rows if row["value"] > 0]
    except Exception as e:
        print(f"[ERROR sources]: {e}")
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
        return [{"skill": s, "jobs": c} for s, c in sorted_skills]
    except Exception as e:
        print(f"[ERROR skill demand]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/analytics/funnel")
async def get_funnel(current_user: User = Depends(require_recruiter)):
    try:
        _, linked_job_ids, _ = await build_recruiter_analytics_scope(current_user.email)
        apps = await Application.find({"job_id": {"$in": list(linked_job_ids)}}).to_list()
        total = len(apps)
        screening = sum(1 for a in apps if a.status in ("reviewing","shortlisted","interview","offer","hired"))
        interview = sum(1 for a in apps if a.status in ("interview","offer","hired"))
        offer = sum(1 for a in apps if a.status in ("offer","hired"))
        hired = sum(1 for a in apps if a.status == "hired")
        rejected = sum(1 for a in apps if a.status == "rejected")
        return [
            {"name": "Applied", "value": total, "fill": "#3b82f6"},
            {"name": "Screening", "value": screening, "fill": "#8b5cf6"},
            {"name": "Interview", "value": interview, "fill": "#ec4899"},
            {"name": "Offer", "value": offer, "fill": "#f43f5e"},
            {"name": "Hired", "value": hired, "fill": "#10b981"},
            {"name": "Rejected", "value": rejected, "fill": "#ef4444"},
        ]
    except Exception as e:
        print(f"[ERROR funnel]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/analytics/job-performance")
async def get_job_performance(current_user: User = Depends(require_recruiter)):
    try:
        jobs, linked_job_ids, app_job_to_recruiter_job = await build_recruiter_analytics_scope(current_user.email)
        scoped_apps = await Application.find({"job_id": {"$in": list(linked_job_ids)}}).to_list()
        result = []
        for j in jobs:
            j_apps = [a for a in scoped_apps if app_job_to_recruiter_job.get(str(a.job_id)) == str(j.id)]
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

        # Save old values before changing
        old_title = j.title

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

        # Mirror updates to student Job: try ID first, fallback to old title + company for legacy jobs
        student_job = await Job.find_one(Job.recruiter_job_id == str(j.id))
        if not student_job:
            profile = await get_recruiter_profile(current_user)
            student_job = await Job.find_one(Job.title == old_title, Job.company == profile.company_name, {"source": "Internal"})

        if student_job:
            student_job.recruiter_job_id = str(j.id) # Future-proof it
            student_job.title = j.title
            student_job.description = j.description
            student_job.location = j.location
            student_job.department = j.department
            student_job.deadline = getattr(j, "deadline", "")
            student_job.required_skills = j.requirements
            student_job.work_type = j.work_type
            student_job.salary_min = j.salary_min
            student_job.salary_max = j.salary_max
            student_job.is_active = (j.status != "closed")
            await student_job.save()

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

        # Mirror deletion to student Job
        student_job = await Job.find_one(Job.recruiter_job_id == str(j.id))
        if not student_job:
            profile = await get_recruiter_profile(current_user)
            student_job = await Job.find_one(Job.title == j.title, Job.company == profile.company_name, {"source": "Internal"})
            
        if student_job:
            await student_job.delete()

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
        new_status = map_stage_to_status(stage)
        app.status = new_status
        app.status_updated_at = datetime.utcnow()
        await app.save()

        # Keep duplicate application records in sync for the same student/job pair.
        # Some older data may store student applications with student Job IDs while
        # recruiter views use recruiter Job IDs.
        linked_job_ids = {str(app.job_id)}

        # If this app points to a recruiter job, include all mirrored student jobs.
        mirrored_student_jobs = await Job.find(Job.recruiter_job_id == str(app.job_id)).to_list()
        linked_job_ids.update(str(j.id) for j in mirrored_student_jobs)

        # If this app points to a student job with recruiter link, include recruiter job.
        try:
            student_job = await Job.get(str(app.job_id))
            if student_job and getattr(student_job, "recruiter_job_id", None):
                linked_job_ids.add(str(student_job.recruiter_job_id))
        except Exception:
            pass

        duplicates = await Application.find({
            "student_email": app.student_email,
            "job_id": {"$in": list(linked_job_ids)}
        }).to_list()

        for dup in duplicates:
            if str(dup.id) == str(app.id):
                continue
            dup.status = new_status
            dup.status_updated_at = datetime.utcnow()
            await dup.save()

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
    universities: Optional[str] = None,
    experience: Optional[str] = None,
    availability: Optional[str] = None,
    gradYears: Optional[str] = None,
    githubActive: Optional[bool] = None,
    locations: Optional[str] = None,
    salaryMin: Optional[int] = None,
    salaryMax: Optional[int] = None,
    current_user: User = Depends(require_recruiter)
):
    import re
    try:
        query: dict = {}
        if q:
            query["name"] = {"$regex": q, "$options": "i"}

        if universities:
            uni_list = [u.strip() for u in universities.split(",")]
            has_other = any(u.lower() == "other" for u in uni_list)
            # If 'Other' is selected, we skip strict backend university filtering and let the frontend useMemo handle 
            # the complex logic of matching unlisted/empty universities.
            if not has_other:
                uni_regexes = [re.compile(u, re.I) for u in uni_list]
                if uni_regexes:
                    if "$or" not in query: query["$or"] = []
                    query["$or"].extend([
                        {"course": {"$in": uni_regexes}},
                        {"education_history.institution": {"$in": uni_regexes}}
                    ])
            
        if experience:
            if experience == "Fresh":
                query["work_experience"] = {"$size": 0}
            else:
                query["work_experience.0"] = {"$exists": True}

        if gradYears:
            years = [y.strip() for y in gradYears.split(",")]
            query["education_history"] = {"$elemMatch": {"year": re.compile("|".join(years))}}

        if githubActive:
            query["github_url"] = {"$exists": True, "$ne": None}
            
        if locations:
            loc_list = [l.strip() for l in locations.split(",")]
            loc_regexes = [re.compile(l, re.I) for l in loc_list]
            if loc_regexes:
                if "$or" not in query: query["$or"] = []
                query["$or"].append({"extracted_data.contact_info.location": {"$in": loc_regexes}})

        if salaryMin is not None or salaryMax is not None:
            salary_query = {}
            if salaryMin is not None: salary_query["$gte"] = salaryMin
            if salaryMax is not None: salary_query["$lte"] = salaryMax
            query["extracted_data.personal_info.expected_salary"] = salary_query

        if availability:
            avail_list = [a.strip() for a in availability.split(",")]
            avail_regexes = [re.compile(a, re.I) for a in avail_list]
            query["extracted_data.personal_info.availability"] = {"$in": avail_regexes}

        students = await Student.find(query).to_list()  # Fetching matching documents strictly based on DB query
        
        req_skills = [s.strip().lower() for s in skills.split(",")] if skills else []

        result = []
        for s in students:
            s_skills = set(sk.lower() for sk in getattr(s, "skills", []))
            match_score = 0
            if req_skills:
                matched = [sk for sk in req_skills if sk in s_skills]
                match_score = int((len(matched) / len(req_skills)) * 100)
                # Skip students with zero skill overlap
                if match_score == 0:
                    continue
            else:
                gap = (getattr(s, "extracted_data", {}) or {}).get("gap_report", {})
                match_score = min(100, int(gap.get("score", 0))) if isinstance(gap, dict) else 0

            # Skip incomplete profiles
            if not (s.name or "").strip():
                continue

            ext: dict = getattr(s, "extracted_data", {}) or {}
            github_report: dict = ext.get("github_report", {}) or {}
            personal_info: dict = ext.get("personal_info", {}) or {}
            contact_info: dict = ext.get("contact_info", {}) or {}
            
            # Use actual DB array parsing for experience
            work_history = getattr(s, "work_experience", [])
            total_years = 0
            for job in work_history:
                dur = job.get("duration", "")
                years = re.findall(r'\d{4}', str(dur))
                if len(years) >= 2:
                    total_years += max(1, int(years[1]) - int(years[0]))
                elif len(years) == 1:
                    total_years += max(1, 2026 - int(years[0])) if "present" in str(dur).lower() or "now" in str(dur).lower() else 1

            exp_val = "Fresh"
            if total_years >= 5: exp_val = "5+yr"
            elif total_years >= 2: exp_val = "2-5yr"
            elif total_years > 0: exp_val = "<2yr"

            uni_name = s.course or ""
            grad_year = None
            edu = getattr(s, "education_history", [])
            if edu and len(edu) > 0:
                first_edu = edu[0]
                uni_name = first_edu.get("institution", uni_name)
                year_str = str(first_edu.get("year", ""))
                match = re.search(r'\d{4}', year_str)
                if match: grad_year = int(match.group())

            result.append({
                "id": str(s.id),
                "name": s.name,
                "degree": getattr(s, "course", ""),
                "major": getattr(s, "target_role", None) or s.course or "",
                "university": uni_name,
                "graduatingYear": grad_year,
                "location": str(contact_info.get("location", "")),
                "availableFor": str(personal_info.get("availability", "")),
                "experience": exp_val,
                "skills": [{"name": sk, "score": 80, "source": "CV"} for sk in getattr(s, "skills", [])[:10]],
                "github": {
                    "commits6mo": int(github_report.get("total_commits", 0) if isinstance(github_report, dict) else 0),
                    "active": bool(github_report.get("repo_count", 0) if isinstance(github_report, dict) else False),
                } if s.github_url else None,
                "overallScore": match_score,
                "matchScore": match_score,
                "availabilityStatus": str(personal_info.get("availability", "")),
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
        "candidateId": other_email, # Note: this cannot be easily awaited here since format_conversation is sync. But it's only a fallback.
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
        "candidateId": str(student.id) if student else other_email,
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

@router.patch("/messages/{conv_id}/read")
async def mark_conversation_read(conv_id: str, current_user: User = Depends(require_recruiter)):
    """Mark all candidate messages in a conversation as read for the recruiter."""
    try:
        conv = await Conversation.get(conv_id)
        if not conv or current_user.email not in conv.participants:
            raise HTTPException(404, "Conversation not found")

        changed = False
        for m in conv.messages:
            if m.senderId != current_user.email and not m.read:
                m.read = True
                changed = True

        if changed:
            await conv.save()

        return {"success": True}
    except HTTPException:
        raise
    except Exception:
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

# ─── Settings aliases expected by frontend ────────────────────────────────────

@router.get("/settings/account")
async def get_settings_account(current_user: User = Depends(require_recruiter)):
    """Alias for GET /recruiter/settings — frontend calls /settings/account."""
    return await get_settings(current_user)

@router.put("/settings/account")
async def update_settings_account(data: dict = Body(...), current_user: User = Depends(require_recruiter)):
    """Alias for PUT /recruiter/settings — frontend calls /settings/account."""
    return await update_settings(data, current_user)

@router.delete("/settings/account")
async def delete_account(current_user: User = Depends(require_recruiter)):
    try:
        email = current_user.email
        
        profile = await RecruiterProfile.find_one(RecruiterProfile.recruiter_email == email)
        if profile:
            await profile.delete()

        recruiter_jobs = await RecruiterJob.find(RecruiterJob.recruiter_email == email).to_list()
        for r_job in recruiter_jobs:
            r_job_id = str(r_job.id)
            
            student_job = await Job.find_one(Job.recruiter_job_id == r_job_id)
            if student_job:
                await student_job.delete()
            elif profile:
                student_job = await Job.find_one(Job.title == r_job.title, Job.company == profile.company_name, {"source": "Internal"})
                if student_job:
                    await student_job.delete()
            
            apps = await Application.find(Application.job_id == r_job_id).to_list()
            for app in apps:
                await app.delete()
                
            await r_job.delete()

        conversations = await Conversation.find({"participants": email}).to_list()
        for convo in conversations:
            await convo.delete()

        await current_user.delete()
        
        return {"success": True}
    except Exception as e:
        print(f"[ERROR delete account]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/settings/notifications")
async def get_notification_settings(current_user: User = Depends(require_recruiter)):
    try:
        profile = await get_recruiter_profile(current_user)
        return profile.notification_settings or {
            "newApplications": True,
            "messages": True,
            "weeklyReport": False,
        }
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.put("/settings/notifications")
async def update_notification_settings(data: dict = Body(...), current_user: User = Depends(require_recruiter)):
    try:
        profile = await get_recruiter_profile(current_user)
        profile.notification_settings = data
        await profile.save()
        return {"success": True}
    except Exception as e:
        raise HTTPException(500, "Internal error")

@router.get("/settings/team")
async def get_team(current_user: User = Depends(require_recruiter)):
    """Stub — team management not yet implemented."""
    return {"members": [], "invites": []}

@router.post("/settings/team/invite")
async def invite_team_member(data: dict = Body(...), current_user: User = Depends(require_recruiter)):
    """Stub — team invite not yet implemented."""
    return {"success": True}

@router.delete("/settings/team/{member_id}")
async def remove_team_member(member_id: str, current_user: User = Depends(require_recruiter)):
    """Stub — team member removal not yet implemented."""
    return {"success": True}

@router.delete("/settings/team/invites/{invite_id}")
async def revoke_team_invite(invite_id: str, current_user: User = Depends(require_recruiter)):
    """Stub — invite revocation not yet implemented."""
    return {"success": True}

@router.get("/settings/plans")
async def get_plans(current_user: User = Depends(require_recruiter)):
    """Returns the billing plans available for recruiters."""
    return [
        {"id": "free", "name": "Free", "price": 0, "current": False, "jobs": 1, "users": 1, "ats": False, "analytics": False},
        {"id": "starter", "name": "Starter", "price": 29, "current": False, "jobs": 5, "users": 3, "ats": True, "analytics": False},
        {"id": "growth", "name": "Growth", "price": 49, "current": True, "jobs": 10, "users": 5, "ats": True, "analytics": True},
    ]

@router.post("/settings/change-password")
async def change_password(data: dict = Body(...), current_user: User = Depends(require_recruiter)):
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
async def get_dashboard_stats(current_user: User = Depends(require_recruiter)):
    """Returns only the stats portion of the recruiter dashboard."""
    try:
        profile = await get_recruiter_profile(current_user)
        jobs = await RecruiterJob.find(RecruiterJob.recruiter_email == current_user.email).to_list()
        job_ids = [str(j.id) for j in jobs]
        apps = await Application.find({"job_id": {"$in": job_ids}}).to_list()
        return build_dashboard_stats(current_user, profile, jobs, apps)
    except Exception as e:
        print(f"[ERROR dashboard stats]: {e}")
        raise HTTPException(500, "Internal error")

@router.get("/dashboard/schedule")
async def get_schedule(current_user: User = Depends(require_recruiter)):
    """Returns upcoming interview schedule. Currently returns live interview-stage applications."""
    try:
        jobs = await RecruiterJob.find(RecruiterJob.recruiter_email == current_user.email).to_list()
        job_ids = [str(j.id) for j in jobs]
        job_map = {str(j.id): j for j in jobs}
        apps = await Application.find({"job_id": {"$in": job_ids}, "status": "interview"}).to_list()
        schedule = []
        for app in apps[:10]:
            student = await Student.find_one(Student.email == app.student_email)
            job = job_map.get(app.job_id)
            name = student.name if student else app.student_email
            schedule.append({
                "id": str(app.id),
                "candidateName": name,
                "candidateInitials": initials(name),
                "role": job.title if job else "Unknown Role",
                "type": "Interview",
                "date": None,
                "time": None,
            })
        return schedule
    except Exception as e:
        print(f"[ERROR schedule]: {e}")
        raise HTTPException(500, "Internal error")

# ─── Company logo and banner logic ──────────────────────────────────────────

def process_image(content: bytes, max_size: tuple[int, int]) -> str:
    """Takes image bytes, compresses to JPEG, and returns a Base64 data URL."""
    try:
        from PIL import Image
        img = Image.open(BytesIO(content)).convert("RGB")
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        out = BytesIO()
        img.save(out, format="JPEG", quality=80)
        b64 = base64.b64encode(out.getvalue()).decode("utf-8")
        return f"data:image/jpeg;base64,{b64}"
    except Exception as e:
        print(f"[ERROR process image]: {e}")
        # fallback if pillow fails
        b64 = base64.b64encode(content).decode("utf-8")
        return f"data:image/jpeg;base64,{b64}"

@router.post("/company/logo")
async def upload_company_logo(
    logo: UploadFile = File(...),
    current_user: User = Depends(require_recruiter)
):
    try:
        content = await logo.read()
        data_url = process_image(content, (400, 400))

        profile = await get_recruiter_profile(current_user)
        profile.company_logo = data_url
        await profile.save()

        return {"logoUrl": data_url}
    except Exception as e:
        print(f"[ERROR logo upload]: {e}")
        raise HTTPException(500, "Internal error")

@router.post("/company/banner")
async def upload_company_banner(
    banner: UploadFile = File(...),
    current_user: User = Depends(require_recruiter)
):
    try:
        content = await banner.read()
        data_url = process_image(content, (1200, 400))

        profile = await get_recruiter_profile(current_user)
        profile.company_banner = data_url
        await profile.save()

        return {"bannerUrl": data_url}
    except Exception as e:
        print(f"[ERROR banner upload]: {e}")
        raise HTTPException(500, "Internal error")

# ─── Company Profile ──────────────────────────────────────────────────────────

@router.get("/company")
async def get_company(current_user: User = Depends(require_recruiter)):
    try:
        profile = await get_recruiter_profile(current_user)
        # Legacy auto-created recruiter profiles may contain placeholder defaults.
        # If no company name was ever set, treat those defaults as unset values.
        industry = profile.industry or ""
        company_size = profile.company_size or ""
        company_location = profile.company_location or ""
        if not (profile.company_name or "").strip():
            if industry == "Technology":
                industry = ""
            if company_size == "11-50":
                company_size = ""
            if company_location == "Colombo, Sri Lanka":
                company_location = ""

        return {
            "name": profile.company_name,
            "tagline": profile.company_tagline or "",
            "website": profile.company_website,
            "careersEmail": profile.company_careers_email or current_user.email,
            "location": company_location,
            "size": company_size,
            "industry": industry,
            "founded": profile.company_founded or "",
            "specialties": profile.company_specialties or [],
            "about": profile.company_about or "",
            "logo": profile.company_logo or "",
            "bannerUrl": profile.company_banner or "",
            "benefits": profile.company_benefits or [],
            "contact": {
                "primaryContact": profile.contact_name or current_user.name,
                "role": "Recruiter",
                "email": profile.company_careers_email or current_user.email,
                "phone": profile.company_phone or "",
                "address": profile.company_address or company_location or "",
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
            "careersEmail": "company_careers_email",
            "location": "company_location",
            "size": "company_size",
            "industry": "industry",
            "founded": "company_founded",
            "specialties": "company_specialties",
            "about": "company_about",
            "logo": "company_logo",
            "bannerUrl": "company_banner",
            "benefits": "company_benefits",
        }
        for key, attr in field_map.items():
            if key in data:
                setattr(profile, attr, data[key])
                
        # Handle nested Contact object manually
        if "contact" in data:
            contact = data["contact"]
            if "phone" in contact:
                profile.company_phone = contact["phone"]
            if "address" in contact:
                profile.company_address = contact["address"]
            if "email" in contact:
                profile.company_careers_email = contact["email"]
            if "primaryContact" in contact:
                profile.contact_name = contact["primaryContact"]

        await profile.save()
        return {"success": True}
    except Exception as e:
        raise HTTPException(500, "Internal error")
