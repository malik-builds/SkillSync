import os
from dotenv import load_dotenv
load_dotenv() # Load env vars BEFORE other imports

from contextlib import asynccontextmanager;
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from fastapi import FastAPI, UploadFile, File, HTTPException, status, Query
from typing import List
import models
import services
import database


# DB CONNECTION

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Beanie
    client = await database.init_db()
    yield
    client.close()


app = FastAPI(lifespan=lifespan)

# --- 1. STUDENT ANALYSIS ROUTE ---
import graph

# ... other imports ...

@app.post("/analyze", response_model=dict)
async def analyze_student_endpoint(file: UploadFile = File(...), github_url: str = Query(None)):
    # Read the file
    content = await file.read()
    
    if not content:
        raise HTTPException(status_code=400, detail="File is empty")

    # Step 1: Extract Text (Keeping this as a helper for now)
    raw_text = services.extract_text(content, file.filename)
    
    if not raw_text:
        raise HTTPException(status_code=400, detail="Could not extract text.")

    # Step 2: LangGraph Orchestration
    initial_state = {
        "raw_text": raw_text,
        "github_url": github_url,
        "extracted_data": {},
        "github_report": None,
        "gap_report": {},
        "status": "pending"
    }
    
    final_state = await graph.app.ainvoke(initial_state)

    # Save to Database (Optional: Update if needed)
    # We return the items from the final state
    return {
        "extracted_data": final_state.get("extracted_data"),
        "gap_report": final_state.get("gap_report"),
        "github_report": final_state.get("github_report"),
        "status": final_state.get("status")
    }



# --- 2. STUDENT CRUD ROUTES ---

@app.post("/students", response_model=models.Student, status_code=status.HTTP_201_CREATED)
async def create_student(student: models.Student):
    await student.insert()
    return student

@app.get("/students", response_model=List[models.Student])
async def get_students(skill: str = Query(None, description="Filter by skill")):
    if skill:
        return await models.Student.find({"skills": {"$regex": skill, "$options": "i"}}).to_list()
    return await models.Student.find_all().to_list()

@app.patch("/students/{student_id}", response_model=models.Student)
async def update_student(student_id: str, update_data: models.StudentUpdate):
    student = await models.Student.get(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Update only the fields provided
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(student, key, value)
    
    await student.save()
    return student

@app.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_student(student_id: str):
    student = await models.Student.get(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    await student.delete()
    return