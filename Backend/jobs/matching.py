from typing import List, Tuple
from .models import Job
from .schemas import MatchResult, JobResponse

def calculate_match(student_skills: List[str], job: Job) -> MatchResult:
    """
    Pure Python matching algorithm using set operations and weighted logic.
    - required_skills = 1.0 weight
    - nice_to_have = 0.5 weight
    """
    # Lowercase everything for case-insensitive matching
    student_skills_lower = {s.lower() for s in student_skills}
    
    req_skills_lower = [s.lower() for s in job.required_skills]
    nice_skills_lower = [s.lower() for s in job.nice_to_have]
    
    matched_skills = []
    missing_skills = []
    
    weighted_score = 0.0
    total_possible_weight = (len(req_skills_lower) * 1.0) + (len(nice_skills_lower) * 0.5)
    
    if total_possible_weight == 0:
        return MatchResult(
            job=JobResponse(**job.model_dump(), id=str(job.id)),
            match_percentage=100.0,
            matched_skills=[],
            missing_skills=[]
        )

    # Process required skills (Weight: 1.0)
    for req in req_skills_lower:
        if req in student_skills_lower:
            weighted_score += 1.0
            matched_skills.append(req)
        else:
            missing_skills.append(req)
            
    # Process nice-to-have skills (Weight: 0.5)
    for nice in nice_skills_lower:
        if nice in student_skills_lower:
            weighted_score += 0.5
            matched_skills.append(nice)
            
    match_percentage = (weighted_score / total_possible_weight) * 100
    match_percentage = round(match_percentage, 1)
    
    job_resp = JobResponse(
        id=str(job.id),
        title=job.title,
        company=job.company,
        required_skills=job.required_skills,
        nice_to_have=job.nice_to_have,
        description=job.description,
        location=job.location,
        is_active=job.is_active
    )
    
    return MatchResult(
        job=job_resp,
        match_percentage=match_percentage,
        matched_skills=matched_skills,
        missing_skills=missing_skills
    )
