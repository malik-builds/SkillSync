from pydantic import BaseModel, Field, EmailStr
from beanie import Document
from typing import List, Optional

# 1. Student Model (Input)
class StudentCreate(BaseModel):
    name: str = Field(..., min_length=2, description="Full Name")
    email: EmailStr
    course: str
    age: int = Field(..., gt=16, lt=100)
    skills: List[str] = []

# 2. Student Model (Output - adds an ID)
class StudentResponse(StudentCreate):
    student_id: int

# 3. Student Update Model
class StudentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2)
    email: Optional[EmailStr] = None
    course: Optional[str] = None
    skills: Optional[List[str]] = None
    github_url: Optional[str] = None


# 3. Resume Analysis Model
class ResumeAnalysis(BaseModel):
    filename: str
    detected_skills: List[str]
    market_match_score: float
    missing_skills: List[str]


class Student(Document):
    name: str
    email: EmailStr
    course: str
    skills: List[str] = []
    github_url: Optional[str] = None
    extracted_data: Optional[dict] = Field(default_factory=dict) # Structured JSON from ResumeParser
    ai_insights: Optional[dict] = Field(default_factory=dict) # Analysis notes, code quality, etc.
    career_roadmap: Optional[dict] = Field(default_factory=dict) # Gap analysis and learning path
    created_at: str = Field(default_factory=lambda: "2026-02-12T15:13:50+05:30") # Placeholder for actual timestamp logic

    class Settings:
        name = "students"