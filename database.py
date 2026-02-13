import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import models

async def init_db():
    # Use MONGO_URL from environment
    mongo_url = os.getenv("MONGO_URL")
    if not mongo_url:
        raise ValueError("MONGO_URL environment variable is not set")
    
    client = AsyncIOMotorClient(mongo_url)
    await init_beanie(
        database=client.SkillSync,
        document_models=[models.Student]
    )
    return client