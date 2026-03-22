from pydantic import BaseModel
from typing import List, Optional

class JobCreate(BaseModel):
    title: str
    company: str
    required_skills: List[str]
    nice_to_have: List[str] = []
    description: str
    location: str = "Sri Lanka"

class JobResponse(BaseModel):
    id: str
    title: str
    company: str
    required_skills: List[str]
    nice_to_have: List[str]
    description: str
    location: str
    is_active: bool

class MatchResult(BaseModel):
    job: JobResponse
    match_percentage: float
    matched_skills: List[str]
    missing_skills: List[str]
