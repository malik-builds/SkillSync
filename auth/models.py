from beanie import Document
from pydantic import EmailStr
from datetime import datetime
from typing import Optional

class User(Document):
    email: EmailStr
    hashed_password: str
    role: str = "student"  # Options: student, recruiter, admin
    name: str = ""
    target_role: str = ""
    onboarding_complete: bool = False
    notifications: dict = {}
    privacy: dict = {}
    is_active: bool = True
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "users"
