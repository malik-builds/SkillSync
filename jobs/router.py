from fastapi import APIRouter, Depends, HTTPException, status, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
from typing import List
from models import Student
from auth.models import User
from auth.dependencies import get_current_user
from .models import Job
from .schemas import JobCreate, JobResponse, MatchResult
from .matching import calculate_match
from scrapers.topjobs_scraper import scrape_it_jobs

router = APIRouter()

@router.post("/scrape")
@limiter.limit("1/hour")
async def scrape_jobs_endpoint(request: Request, current_user: User = Depends(get_current_user)):
    """
    Called by admin to trigger topjobs.lk scrape. Max 20 jobs.
    Rate limited to 1 per hour per IP to respect the source.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin permissions required to trigger scraping"
        )
        
    scraped_jobs = await scrape_it_jobs(max_jobs=20)
    
    saved = 0
    skipped = 0
    
    for job_data in scraped_jobs:
        if not job_data.get("required_skills"):
            skipped += 1
            continue
            
        existing = await Job.find_one(Job.title == job_data["title"], Job.company == job_data["company"])
        if existing:
            skipped += 1
        else:
            job = Job(**job_data)
            await job.insert()
            saved += 1
            
    return {"scraped": len(scraped_jobs), "saved": saved, "skipped": skipped}


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(job_in: JobCreate, current_user: User = Depends(get_current_user)):
    """
    Creates a new Job posting. Only available to recruiters or admins.
    """
    if current_user.role not in ["recruiter", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to create a job"
        )
        
    job = Job(**job_in.model_dump())
    await job.insert()
    
    return JobResponse(**job.model_dump(exclude={"id"}), id=str(job.id))

@router.get("", response_model=List[JobResponse])
async def list_jobs():
    """
    Public route to list all active jobs. No authentication required.
    """
    jobs = await Job.find(Job.is_active == True).to_list()
    return [JobResponse(**job.model_dump(exclude={"id"}), id=str(job.id)) for job in jobs]

@router.get("/matches/{student_id}", response_model=List[MatchResult])
async def get_student_matches(student_id: str, current_user: User = Depends(get_current_user)):
    """
    Fetch a student by ID, read their skills, and run the matching algorithm
    against all active job postings. Returns sorted matches descending.
    """
    student = await Student.get(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Student.skills is assumed to be a list of strings gathered from parsed data
    # (or updated directly from DB)
    student_skills = student.skills if hasattr(student, "skills") else []
    
    active_jobs = await Job.find(Job.is_active == True).to_list()
    
    matches = []
    for job in active_jobs:
        match_result = calculate_match(student_skills, job)
        matches.append(match_result)
        
    # Sort descending by match_percentage
    matches.sort(key=lambda x: x.match_percentage, reverse=True)
    return matches
