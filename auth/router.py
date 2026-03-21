from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
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
    elif body.role == "recruiter":
        from routers.recruiter_models import RecruiterProfile

        recruiter_profile = await RecruiterProfile.find_one(RecruiterProfile.recruiter_email == body.email)
        company_name = body.companyName or ""

        if recruiter_profile:
            if company_name:
                recruiter_profile.company_name = company_name
            if body.website is not None:
                recruiter_profile.company_website = body.website
            if body.location is not None:
                recruiter_profile.company_location = body.location
            if body.size is not None:
                recruiter_profile.company_size = body.size
            if body.industry is not None:
                recruiter_profile.industry = body.industry
            recruiter_profile.contact_name = default_name
            recruiter_profile.company_careers_email = body.email
            await recruiter_profile.save()
        else:
            recruiter_profile = RecruiterProfile(
                recruiter_email=body.email,
                company_name=company_name,
                company_website=body.website or "",
                company_location=body.location or "",
                company_size=body.size or "",
                industry=body.industry or "",
                contact_name=default_name,
                company_careers_email=body.email,
            )
            await recruiter_profile.insert()

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
async def github_connect(body: dict = Body(...), current_user: User = Depends(get_current_user)):
    github_url = body.get("githubUrl")
    if not github_url:
        raise HTTPException(400, "githubUrl is required")

    github_url = github_url.strip()
    
    if current_user.role == "student":
        student = await Student.find_one(Student.email == current_user.email)
        if not student:
            raise HTTPException(404, "Student profile not found")

        # 1. Save URL
        student.github_url = github_url
        
        # 2. Perform Audit
        from services import GitHubAuditorTool, GapAnalysisTool, MarketResearcherTool
        
        auditor = GitHubAuditorTool()
        github_report = await auditor.audit_repo(github_url)
        
        # 3. Recompute Gap Report
        extracted = student.extracted_data or {}
        
        # Determine target role (from User or fallback)
        target_role = current_user.target_role or "Fullstack Developer"
        market_requirements = extracted.get("market_requirements")
        if not market_requirements:
            market_requirements = await MarketResearcherTool().research(target_role)
            extracted["market_requirements"] = market_requirements
            
        # Get University Info from profile or resume
        edu = extracted.get("education_history", [])
        uni_info = {"name": "", "degree": "", "gpa": 0.0}
        if edu and isinstance(edu[0], dict):
            first = edu[0]
            uni_info = {
                "name": first.get("institution", ""),
                "degree": first.get("degree", ""),
                "gpa": first.get("gpa", first.get("year", "0.0"))
            }

        gap_analyzer = GapAnalysisTool()
        gap_report = gap_analyzer.analyze_weighted_gap(
            student_skills=student.skills,
            market_requirements=market_requirements,
            github_report=github_report,
            university_info=uni_info
        )
        
        # 4. Save everything
        extracted["github_report"] = github_report
        extracted["gap_report"] = gap_report
        student.extracted_data = extracted
        student.ai_insights = gap_report
        
        await student.save()
        
        return {"success": True, "githubUrl": github_url, "score": gap_report.get("score")}
    
    return {"success": True, "githubUrl": github_url}

@router.post("/linkedin/connect")
async def linkedin_connect(current_user: User = Depends(get_current_user)):
    return {"success": True}
