from fastapi import APIRouter, Depends, HTTPException, Body
from auth.models import User
from auth.dependencies import get_current_user
from auth.schemas import UserOut
from auth.responses import get_user_response

router = APIRouter()

@router.post("/target-role")
async def set_target_role(role: str = Body(..., embed=True), current_user: User = Depends(get_current_user)):
    current_user.target_role = role
    await current_user.save()
    return {"success": True}

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
