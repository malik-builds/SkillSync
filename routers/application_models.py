from beanie import Document
from pydantic import Field
from datetime import datetime
from typing import List, Optional

class Application(Document):
    student_email: str
    student_id: Optional[str] = None
    job_id: str
    status: str = "applied"  # applied, reviewing, shortlisted, interview, offer, hired, rejected
    applied_at: datetime = Field(default_factory=datetime.now)
    tags: List[str] = []
    notes: List[dict] = []  # [{text, timestamp, author}]

    class Settings:
        name = "applications"
