from pydantic import BaseModel, EmailStr
from typing import Optional

class SignInRequest(BaseModel):
    email: EmailStr
    password: str
    rememberMe: bool = False

class SignUpRequest(BaseModel):
    name: str = ""
    email: EmailStr
    password: str
    role: str = "student"  # student | recruiter | university

class OnboardingState(BaseModel):
    cvUploaded: bool
    githubConnected: bool
    targetRoleSet: bool
    completed: bool

class UserOut(BaseModel):
    id: str
    email: str
    role: str
    fullName: str = ""
    targetRole: Optional[str] = None
    linkedinId: Optional[str] = None
    onboarding: OnboardingState
    profileCompletion: int = 0
    cvFileName: Optional[str] = None
    cvId: Optional[str] = None
    githubUsername: Optional[str] = None

class AuthResponse(BaseModel):
    token: str
    user: UserOut

class TokenResponse(BaseModel):
    access_token: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: str
