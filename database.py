import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import models

async def init_db():
    # Use MONGO_URL from environment
    mongo_url = os.getenv("MONGO_URL")
    client = AsyncIOMotorClient(mongo_url)
    from auth.models import User
    from jobs.models import Job
    
    await init_beanie(
        database=client.SkillSync,
        document_models=[models.Student, User, Job]
    )
    return client