from beanie import Document
from pydantic import EmailStr
from datetime import datetime
from typing import Optional

class User(Document):
    email: EmailStr
    hashed_password: str
    role: str = "student"  # Options: student, recruiter, admin
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "users"
