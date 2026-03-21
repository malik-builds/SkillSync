from models import Student
from auth.models import User
from auth.schemas import UserOut, OnboardingState
from routers.recruiter_models import RecruiterProfile

async def get_user_response(user: User) -> UserOut:
    student = await Student.find_one(Student.email == user.email)
    recruiter_profile = None
    if user.role == "recruiter":
        recruiter_profile = await RecruiterProfile.find_one(RecruiterProfile.recruiter_email == user.email)
    
    cv_uploaded = False
    github_connected = False
    cv_id = None
    cv_filename = None
    github_username = None
    university = None
    programme = None
    graduation_year = None
    company_name = None
    industry = None
    size = None
    location = None
    website = None

    if student:
        ext_data = student.extracted_data or {}
        cv_uploaded = bool(ext_data)
        github_connected = bool(student.github_url)
        cv_id = str(student.id)
        cv_filename = ext_data.get("cv_filename", "resume.pdf") if ext_data else None
        
        # extract username from github_url
        if student.github_url:
            parts = [p for p in student.github_url.split('/') if p]
            if parts:
                github_username = parts[-1]
        
        university = student.institution
        programme = student.course
        graduation_year = student.graduation_year

    if recruiter_profile:
        company_name = recruiter_profile.company_name or None
        industry = recruiter_profile.industry or None
        size = recruiter_profile.company_size or None
        location = recruiter_profile.company_location or None
        website = recruiter_profile.company_website or None

        # Hide legacy placeholder defaults if recruiter profile was never configured.
        if not (company_name or "").strip():
            if industry == "Technology":
                industry = None
            if size == "11-50":
                size = None
            if location == "Colombo, Sri Lanka":
                location = None

    target_role_set = bool(getattr(user, "target_role", ""))

    onboarding = OnboardingState(
        cvUploaded=cv_uploaded,
        githubConnected=github_connected,
        targetRoleSet=target_role_set,
        completed=user.onboarding_complete
    )

    # Compute profile completion percentage from the three core steps
    completed_steps = sum([cv_uploaded, github_connected, target_role_set])
    profile_completion = round((completed_steps / 3) * 100)

    return UserOut(
        id=str(user.id),
        email=user.email,
        role=user.role,
        fullName=user.name,
        targetRole=getattr(user, "target_role", None) or None,
        linkedinId=None,
        onboarding=onboarding,
        profileCompletion=profile_completion,
        cvFileName=cv_filename,
        cvId=cv_id,
        githubUsername=github_username,
        university=university,
        programme=programme,
        graduationYear=graduation_year,
        companyName=company_name,
        industry=industry,
        size=size,
        location=location,
        website=website,
    )
