from models import Student
from auth.models import User
from auth.schemas import UserOut, OnboardingState

async def get_user_response(user: User) -> UserOut:
    student = await Student.find_one(Student.email == user.email)
    
    cv_uploaded = False
    github_connected = False
    cv_id = None
    cv_filename = None
    github_username = None

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

    target_role_set = bool(getattr(user, "target_role", ""))

    onboarding = OnboardingState(
        cvUploaded=cv_uploaded,
        githubConnected=github_connected,
        targetRoleSet=target_role_set,
        completed=user.onboarding_complete
    )

    return UserOut(
        id=str(user.id),
        email=user.email,
        role=user.role,
        fullName=user.name,
        targetRole=getattr(user, "target_role", None) or None,
        linkedinId=None,
        onboarding=onboarding,
        cvFileName=cv_filename,
        cvId=cv_id,
        githubUsername=github_username
    )
