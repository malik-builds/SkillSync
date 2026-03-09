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
async def signup(request: SignUpRequest):
    """
    Registers a new user by hashing the password and saving it to MongoDB.
    Returns AuthResponse containing the token and user data for auto-login.
    """
    existing_user = await User.find_one(User.email == request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    hashed_pwd = hash_password(request.password)
    # Use provided name or default to email prefix
    default_name = request.name or request.email.split("@")[0]
    user = User(
        email=request.email,
        hashed_password=hashed_pwd,
        role=request.role,
        name=default_name
    )
    await user.insert()
    
    # Auto-create a linked Student profile if the user is a student
    if request.role == "student":
        student = Student(
            name=default_name,
            email=request.email,
            course="Pending Update",
            skills=[],
            created_at=datetime.utcnow().isoformat()
        )
        await student.insert()

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
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
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
    if not user or not verify_password(form_data.password, user.hashed_password):
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
