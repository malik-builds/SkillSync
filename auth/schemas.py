from pydantic import BaseModel, EmailStr
from typing import Optional

class SignInRequest(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None
    rememberMe: bool = False

class SignUpRequest(BaseModel):
    name: str = ""
    email: EmailStr
    password: str
    role: str = "student"  # student | recruiter | university
    university: Optional[str] = None
    faculty: Optional[str] = None
    jobTitle: Optional[str] = None
    programme: Optional[str] = None
    graduationYear: Optional[int] = None
    message: Optional[str] = None
    termsAccepted: bool = True

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
    university: Optional[str] = None
    programme: Optional[str] = None
    graduationYear: Optional[int] = None

class AuthResponse(BaseModel):
    token: str
    user: UserOut

class TokenResponse(BaseModel):
    access_token: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: str
