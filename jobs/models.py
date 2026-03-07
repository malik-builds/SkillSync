from beanie import Document
from datetime import datetime
from typing import List

class Job(Document):
    title: str
    company: str
    required_skills: List[str]
    nice_to_have: List[str] = []
    description: str
    location: str = "Sri Lanka"
    is_active: bool = True
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "jobs"
