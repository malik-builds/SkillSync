from fastapi import APIRouter, Depends, HTTPException, status, Request
from datetime import datetime
from models import Student
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
from .models import User
from .schemas import SignUpRequest, SignInRequest, AuthResponse, UserOut, TokenResponse, UserResponse
from .utils import hash_password, verify_password, create_access_token
from .dependencies import get_current_user
from .responses import get_user_response

router = APIRouter()

@router.post("/signup", response_model=AuthResponse)
async def signup(request: Request, body: SignUpRequest):
    """
    Registers a new user by hashing the password and saving it to MongoDB.
    Returns AuthResponse containing the token and user data for auto-login.
    """
    existing_user = await User.find_one(User.email == body.email)

    hashed_pwd = hash_password(body.password)
    # Use provided name or default to email prefix
    default_name = body.name or body.email.split("@")[0]

    if existing_user and existing_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    if existing_user and not existing_user.is_active:
        # Reuse deleted account email as a fresh account.
        existing_user.hashed_password = hashed_pwd
        existing_user.role = body.role
        existing_user.name = default_name
        existing_user.is_active = True
        existing_user.onboarding_complete = False
        existing_user.target_role = ""
        existing_user.notifications = {}
        existing_user.privacy = {}
        await existing_user.save()
        user = existing_user
    else:
        user = User(
            email=body.email,
            hashed_password=hashed_pwd,
            role=body.role,
            name=default_name
        )
        await user.insert()

    # Ensure a linked Student profile exists when registering as student.
    if body.role == "student":
        student = await Student.find_one(Student.email == body.email)
        if student:
            student.name = default_name
            student.course = body.programme or student.course or "Pending Update"
            student.institution = body.university or student.institution
            student.graduation_year = body.graduationYear or student.graduation_year
            await student.save()
        else:
            student = Student(
                name=default_name,
                email=body.email,
                course=body.programme or "Pending Update",
                institution=body.university or "Informatics Institute of Technology",
                graduation_year=body.graduationYear,
                skills=[],
                created_at=datetime.utcnow().isoformat()
            )
            await student.insert()
    elif body.role == "university":
        from routers.university_models import UniversityProfile
        profile = await UniversityProfile.find_one(UniversityProfile.uni_email == body.email)
        if profile:
            profile.personal_name = default_name
            if body.university:
                profile.institution_name = body.university
            if body.jobTitle:
                profile.personal_role = body.jobTitle
            await profile.save()
        else:
            profile = UniversityProfile(
                uni_email=body.email,
                personal_name=default_name,
                institution_name=body.university or "Informatics Institute of Technology",
                personal_role=body.jobTitle or "Administrator"
            )
            if body.faculty:
                profile.notification_settings["faculty"] = body.faculty
            if body.message:
                profile.notification_settings["signup_message"] = body.message
            await profile.insert()

    # Generate token immediately for auto-login
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    
    user_out = await get_user_response(user)
    return AuthResponse(token=access_token, user=user_out)

@router.post("/signin", response_model=AuthResponse)
@limiter.limit("5/minute")
async def signin(request: Request, body: SignInRequest):
    """
    Authenticates a user via JSON body (for Next.js frontend).
    Returns AuthResponse with token and user object.
    """
    user = await User.find_one(User.email == body.email)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Role validation: ensure the user is logging in through the correct tab
    if body.role and user.role != body.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This account is registered as a {user.role}. Please use the correct login tab.",
        )
        
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    
    user_out = await get_user_response(user)
    return AuthResponse(token=access_token, user=user_out)

@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticates a user via OAuth2 form data (Legacy/Swagger).
    """
    user = await User.find_one(User.email == form_data.username)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return TokenResponse(access_token=access_token)

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Protected route that returns the currently authenticated user's profile.
    """
    return await get_user_response(current_user)

# --- FRONTEND STUBS FOR ONBOARDING / AUTH API ---

@router.post("/logout")
async def logout():
    return {"success": True}

@router.post("/forgot-password")
async def forgot_password(request: Request):
    return {"success": True, "message": "Email sent"}

@router.post("/reset-password")
async def reset_password(request: Request):
    return {"success": True}

@router.post("/github/connect")
async def github_connect(current_user: User = Depends(get_current_user)):
    return {"success": True, "githubUrl": "https://github.com/connected"}

@router.post("/linkedin/connect")
async def linkedin_connect(current_user: User = Depends(get_current_user)):
    return {"success": True}
