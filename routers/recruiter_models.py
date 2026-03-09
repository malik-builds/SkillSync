from beanie import Document
from pydantic import Field
from datetime import datetime
from typing import List, Optional

class RecruiterProfile(Document):
    recruiter_email: str
    company_name: str = ""
    company_website: str = ""
    company_tagline: str = ""
    company_location: str = "Colombo, Sri Lanka"
    company_size: str = "11-50"
    company_founded: str = ""
    company_about: str = ""
    company_specialties: List[str] = []
    company_benefits: List[dict] = []
    industry: str = "Technology"
    saved_candidates: List[str] = []  # list of student emails
    notification_settings: dict = {}

    class Settings:
        name = "recruiter_profiles"

class RecruiterJob(Document):
    recruiter_email: str
    title: str
    description: str = ""
    requirements: List[str] = []
    location: str = "Colombo, Sri Lanka"
    work_type: str = "Office"   # Office, Remote, Hybrid
    type: str = "Full-time"
    department: str = "Engineering"
    status: str = "active"      # active, closed, draft
    salary_min: int = 0
    salary_max: int = 0
    deadline: str = ""
    created_at: datetime = Field(default_factory=datetime.now)
    views: int = 0

    class Settings:
        name = "recruiter_jobs"
