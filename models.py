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


# Nested Models for Rich Analysis (Phase 12)
class WorkExperience(BaseModel):
    role: str
    company: str
    duration: str
    key_tasks: List[str]

class SkillSet(BaseModel):
    category: str
    skills: List[str]

class ATSFeedback(BaseModel):
    score_estimate: str
    critical_issues: List[str]
    optimization_tips: List[str]

class Student(Document):
    name: str
    email: EmailStr
    course: str
    skills: List[str] = [] # Flattened for quick search
    github_url: Optional[str] = None
    
    # Nested Data Structures
    extracted_data: Optional[dict] = Field(default_factory=dict) 
    # ^ Will follow a structure like:
    # { "work": List[WorkExperience], "skills": List[SkillSet], "ats": ATSFeedback }
    
    ai_insights: Optional[dict] = Field(default_factory=dict) 
    career_roadmap: Optional[dict] = Field(default_factory=dict) 
    created_at: str = Field(default_factory=lambda: "2026-02-14T20:56:00+05:30")

    class Settings:
        name = "students"