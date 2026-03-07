import os
from dotenv import load_dotenv
load_dotenv() # Load env vars BEFORE other imports

from contextlib import asynccontextmanager;
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from fastapi import FastAPI, UploadFile, File, HTTPException, status, Query, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import magic
from typing import List
import models
import services
import database
import config

from auth.router import router as auth_router
from auth.dependencies import get_current_user
from auth.models import User
from jobs.router import router as jobs_router


# DB CONNECTION

# Rate Limiting Setup
limiter = Limiter(key_func=get_remote_address)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Validate environment variables on startup
    config.validate_env()
    # Initialize Beanie
    client = await database.init_db()
    yield
    client.close()

app = FastAPI(lifespan=lifespan)

# Add Security Middlewares
app.add_middleware(SecurityHeadersMiddleware)

# TODO: Before production, replace * with your actual 
# frontend domain e.g. ["https://skillsync.vercel.app"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Include Auth Router
app.include_router(auth_router, prefix="/auth", tags=["Auth"])

# Include Jobs Router
app.include_router(jobs_router, prefix="/jobs", tags=["Jobs"])

# --- 1. STUDENT ANALYSIS ROUTE ---
import graph

# ... other imports ...

@app.post("/analyze", response_model=dict)
@limiter.limit("10/minute")
async def analyze_student_endpoint(
    request: Request,
    file: UploadFile = File(...), 
    github_url: str = Query(None),
    target_job_title: str = Query("Fullstack Developer"),
    current_user: User = Depends(get_current_user)
):
    # Read the file
    content = await file.read()
    
    if not content:
        raise HTTPException(status_code=400, detail="File is empty")

    # FIX 1: FILE UPLOAD VALIDATION
    ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

    # Size check
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 5MB")
    
    # Extension check
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Unsupported file type. Allowed: PDF, DOCX, TXT")
    
    # Magic bytes check
    mime = magic.from_buffer(content, mime=True)
    if ext == ".pdf" and mime != "application/pdf":
        raise HTTPException(status_code=415, detail="File content does not match file extension")
    elif ext == ".docx" and not mime.startswith("application/"):
        raise HTTPException(status_code=415, detail="File content does not match file extension")
    elif ext == ".txt" and not mime.startswith("text/"):
        raise HTTPException(status_code=415, detail="File content does not match file extension")

    # Filename sanitisation
    basename = os.path.basename(file.filename)
    sanitised_name = "".join([c if c.isalnum() or c in (".", "-") else "_" for c in basename])
    if len(sanitised_name) > 100:
        sanitised_name = sanitised_name[-100:]

    # Step 1: Extract Text (Standard)
    raw_text = services.extract_text(content, sanitised_name)
    
    if not raw_text:
        raise HTTPException(status_code=400, detail="Could not extract text from the provided file.")

    # Step 2: LangGraph Orchestration
    initial_state = {
        "raw_text": raw_text,
        "github_url": github_url,
        "target_job_title": target_job_title,
        "extracted_data": {},
        "market_requirements": {},
        "github_report": None,
        "gap_report": {},
        "status": "pending"
    }
    
    final_state = await graph.app.ainvoke(initial_state)

    # Save to Database
    if current_user.role == "student":
        student = await models.Student.find_one(models.Student.email == current_user.email)
        if student:
            extracted = final_state.get("extracted_data", {})
            
            # Update core attributes
            student.skills = extracted.get("skills", [])
            student.github_url = github_url or extracted.get("contact_info", {}).get("github", student.github_url)
            
            # Update name if default
            parsed_name = extracted.get("name")
            if parsed_name and student.name == current_user.email.split("@")[0]:
                student.name = parsed_name
                
            # Update course from education history
            edu = extracted.get("education_history", [])
            if edu and len(edu) > 0 and isinstance(edu[0], dict):
                student.course = edu[0].get("degree", student.course)
                
            # Attach rich JSON payloads
            student.extracted_data = extracted
            student.ai_insights = final_state.get("gap_report", {})
            student.career_roadmap = final_state.get("market_requirements", {})
            
            await student.save()

    # We return the items from the final state
    return {
        "extracted_data": final_state.get("extracted_data"),
        "market_requirements": final_state.get("market_requirements"),
        "gap_report": final_state.get("gap_report"),
        "github_report": final_state.get("github_report"),
        "status": final_state.get("status")
    }



# --- 2. STUDENT CRUD ROUTES ---

@app.post("/students", response_model=models.Student, status_code=status.HTTP_201_CREATED)
async def create_student(student: models.Student):
    await student.insert()
    return student

@app.get("/students", response_model=List[models.Student])
async def get_students(skill: str = Query(None, description="Filter by skill")):
    if skill:
        return await models.Student.find({"skills": {"$regex": skill, "$options": "i"}}).to_list()
    return await models.Student.find_all().to_list()

@app.patch("/students/{student_id}", response_model=models.Student)
async def update_student(student_id: str, update_data: models.StudentUpdate):
    student = await models.Student.get(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Update only the fields provided
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(student, key, value)
    
    await student.save()
    return student

@app.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_student(student_id: str):
    student = await models.Student.get(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    await student.delete()
    return