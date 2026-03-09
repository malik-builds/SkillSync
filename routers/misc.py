from fastapi import APIRouter
from models import Student
from jobs.models import Job
from auth.models import User
from routers.application_models import Application
from routers.recruiter_models import RecruiterJob

router = APIRouter()

@router.get("/health")
async def health_check():
    try:
        # Pinging the DB implicitly by finding a user count
        count = await User.find_all().count()
        return {"status": "ok", "db_connection": "healthy", "users_count": count}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

@router.get("/demo/summary")
async def get_demo_summary():
    try:
        return {
            "students": await Student.find_all().count(),
            "users": await User.find_all().count(),
            "jobs": await Job.find_all().count(),
            "recruiter_jobs": await RecruiterJob.find_all().count(),
            "applications": await Application.find_all().count()
        }
    except Exception as e:
        return {"error": str(e)}
