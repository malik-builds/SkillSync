from beanie import Document
from pydantic import Field
from datetime import datetime
from typing import List, Optional

class UniversityProfile(Document):
    uni_email: str
    institution_name: str = "Informatics Institute of Technology"
    website: str = "https://www.iit.ac.lk"
    address: str = "57 Ramakrishna Road, Colombo 06"
    personal_name: str = ""
    personal_role: str = "Administrator"
    personal_phone: str = ""
    partner_companies: List[dict] = []
    interventions: List[dict] = []
    dismissed_alerts: List[str] = []
    notification_settings: dict = {}
    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "university_profiles"
