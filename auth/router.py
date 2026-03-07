from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from .models import User
from .schemas import SignupRequest, TokenResponse, UserResponse
from .utils import hash_password, verify_password, create_access_token
from .dependencies import get_current_user

router = APIRouter()

@router.post("/signup", response_model=UserResponse)
async def signup(request: SignupRequest):
    """
    Registers a new user by hashing the password and saving it to MongoDB.
    Checks if the email already exists to prevent duplicates.
    """
    existing_user = await User.find_one(User.email == request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    hashed_pwd = hash_password(request.password)
    user = User(
        email=request.email,
        hashed_password=hashed_pwd,
        role=request.role
    )
    await user.insert()
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        role=user.role
    )

@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticates a user via OAuth2 form data (username, password).
    Returns a stateless JWT access token upon successful verification.
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

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Protected route that returns the currently authenticated user's profile.
    Requires a valid JWT Bearer token.
    """
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        role=current_user.role
    )
