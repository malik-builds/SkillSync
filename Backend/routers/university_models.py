from beanie import Document
from pydantic import Field
from datetime import datetime
from typing import List, Optional

class UniversityProfile(Document):
    uni_email: str
    institution_name: str = ""
    website: str = ""
    address: str = ""
    personal_name: str = ""
    personal_role: str = ""
    personal_phone: str = ""
    faculty: str = ""
    account_type: str = ""
    interventions: List[dict] = []
    dismissed_alerts: List[str] = []
    notification_settings: dict = {}
    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "university_profiles"
