from fastapi import APIRouter, Depends, HTTPException, Body
from auth.models import User
from auth.dependencies import get_current_user
from auth.schemas import UserOut
from auth.responses import get_user_response
from models import Student
import services

router = APIRouter()

@router.post("/target-role")
async def set_target_role(role: str = Body(..., embed=True), current_user: User = Depends(get_current_user)):
    role = (role or "").strip()
    if not role:
        raise HTTPException(400, "role is required")

    current_user.target_role = role
    await current_user.save()

    # Re-run analysis for student accounts when prior analysis data exists.
    recomputed = False
    if current_user.role == "student":
        student = await Student.find_one(Student.email == current_user.email)
        if student and isinstance(student.extracted_data, dict) and student.extracted_data:
            extracted = student.extracted_data or {}

            market_requirements = await services.MarketResearcherTool().research(role)
            extracted["market_requirements"] = market_requirements

            education_history = extracted.get("education_history", []) or []
            uni_info = {"name": "", "degree": "", "gpa": 0.0}
            if education_history and isinstance(education_history[0], dict):
                first_edu = education_history[0]
                uni_info = {
                    "name": first_edu.get("institution", ""),
                    "degree": first_edu.get("degree", ""),
                    "gpa": first_edu.get("gpa", first_edu.get("year", "0.0")),
                }

            student_skills = extracted.get("skills") or student.skills or []
            github_report = extracted.get("github_report")

            gap_report = services.GapAnalysisTool().analyze_weighted_gap(
                student_skills=student_skills,
                market_requirements=market_requirements,
                github_report=github_report,
                university_info=uni_info,
            )

            extracted["gap_report"] = gap_report
            student.extracted_data = extracted
            student.ai_insights = gap_report
            student.career_roadmap = market_requirements
            await student.save()
            recomputed = True

    return {"success": True, "recomputed": recomputed}

@router.post("/complete-onboarding")
async def complete_onboarding(current_user: User = Depends(get_current_user)):
    current_user.onboarding_complete = True
    await current_user.save()
    return {"success": True}

@router.patch("/profile", response_model=UserOut)
async def update_user_profile(updates: dict = Body(...), current_user: User = Depends(get_current_user)):
    if "name" in updates:
        current_user.name = updates["name"]
    await current_user.save()
    
    return await get_user_response(current_user)
