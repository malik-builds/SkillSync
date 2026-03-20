import os
import magic
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Form
from auth.models import User
from auth.dependencies import get_current_user
from models import Student
import services
import graph

router = APIRouter()

@router.post("/upload")
async def upload_cv(
    cv: UploadFile = File(...),
    userId: str = Form(None),
    github_url: str = Query(None),
    target_job_title: str = Query("Fullstack Developer"),
    current_user: User = Depends(get_current_user)
):
    content = await cv.read()
    
    if not content:
        raise HTTPException(status_code=400, detail="File is empty")

    ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 5MB")
    
    ext = os.path.splitext(cv.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Unsupported file type. Allowed: PDF, DOCX, TXT")
    
    mime = magic.from_buffer(content, mime=True)
    if ext == ".pdf" and mime != "application/pdf":
        raise HTTPException(status_code=415, detail="File content does not match file extension")
    elif ext == ".docx" and not mime.startswith("application/"):
        raise HTTPException(status_code=415, detail="File content does not match file extension")
    elif ext == ".txt" and not mime.startswith("text/"):
        raise HTTPException(status_code=415, detail="File content does not match file extension")

    basename = os.path.basename(cv.filename)
    sanitised_name = "".join([c if c.isalnum() or c in (".", "-") else "_" for c in basename])
    if len(sanitised_name) > 100:
        sanitised_name = sanitised_name[-100:]

    raw_text = services.extract_text(content, sanitised_name)
    
    if not raw_text:
        raise HTTPException(status_code=400, detail="Could not extract text from the provided file.")

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
    
    try:
        final_state = await graph.app.ainvoke(initial_state)
    except Exception as e:
        print(f"[ERROR] LangGraph execution failed: {e}")
        raise HTTPException(500, "Internal error during analysis")

    extracted = final_state.get("extracted_data", {})
    gap_report = final_state.get("gap_report", {})
    market_reqs = final_state.get("market_requirements", {})

    student = await Student.find_one(Student.email == current_user.email)
    if not student:
        student = Student(email=current_user.email)

    merged_skills = services.merge_skills_preserving_existing(student.skills, extracted.get("skills", []))
    student.skills = merged_skills
    existing_extracted = student.extracted_data or {}
    merged_extracted = dict(existing_extracted)
    merged_extracted.update(extracted)
    merged_extracted["skills"] = merged_skills
    merged_extracted["gap_report"] = gap_report
    merged_extracted["market_requirements"] = market_reqs
    merged_extracted["cv_filename"] = cv.filename
    student.extracted_data = merged_extracted
    
    if github_url:
        student.github_url = github_url
    
    student.name = extracted.get("name") or current_user.name or current_user.email.split("@")[0]
    
    # Also update AI insights and career roadmap if they exist on model level
    student.ai_insights = gap_report
    student.career_roadmap = market_reqs

    await student.save()

    return {
        "success": True,
        "analysisId": str(student.id),
        "score": gap_report.get("score", 0),
        "status": gap_report.get("status", "pending"),
        "cvFileName": cv.filename
    }
