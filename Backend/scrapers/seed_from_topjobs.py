import sys
import os
import asyncio
from dotenv import load_dotenv

# Add parent directory to path to allow importing app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import init_db
from jobs.models import Job
from scrapers.topjobs_scraper import scrape_it_jobs

load_dotenv()

MANUAL_JOBS = [
    {
        "title": "Associate Software Engineer",
        "company": "WSO2",
        "required_skills": ["Java", "Go", "REST", "Microservices", "Git", "Docker"],
        "nice_to_have": ["Kubernetes", "AWS", "CI/CD"],
        "description": "Join WSO2 to build enterprise integration products used by Fortune 500 companies globally.",
        "location": "Colombo, Sri Lanka"
    },
    {
        "title": "Software Engineer",
        "company": "IFS",
        "required_skills": ["Java", "C#", "SQL", "REST", "Git"],
        "nice_to_have": ["Azure", "Docker", "Agile"],
        "description": "Build enterprise resource planning software for asset-intensive industries worldwide.",
        "location": "Colombo, Sri Lanka"
    },
    {
        "title": "Junior Software Engineer", 
        "company": "Sysco LABS",
        "required_skills": ["Python", "JavaScript", "React", "Node.js", "MongoDB", "Git"],
        "nice_to_have": ["Docker", "AWS", "CI/CD"],
        "description": "Build technology solutions for the world's largest foodservice distribution company.",
        "location": "Colombo, Sri Lanka"
    },
    {
        "title": "Software Engineer - AI/ML",
        "company": "Surge Global",
        "required_skills": ["Python", "Machine Learning", "TensorFlow", "SQL", "Git"],
        "nice_to_have": ["PyTorch", "AWS", "Docker"],
        "description": "Build AI-powered products for international clients across multiple industries.",
        "location": "Colombo, Sri Lanka"
    },
    {
        "title": "Associate Software Engineer",
        "company": "Virtusa",
        "required_skills": ["Java", "JavaScript", "SQL", "REST", "Git", "Agile"],
        "nice_to_have": ["React", "Spring Boot", "AWS"],
        "description": "Join a global technology company delivering digital transformation for Fortune 500 clients.",
        "location": "Colombo, Sri Lanka"
    },
    {
        "title": "Junior Full Stack Developer",
        "company": "99X Technology",
        "required_skills": ["JavaScript", "React", "Node.js", "PostgreSQL", "Git"],
        "nice_to_have": ["TypeScript", "Docker", "Azure"],
        "description": "Build Scandinavian-quality software products at one of Sri Lanka's top product companies.",
        "location": "Colombo, Sri Lanka"
    },
    {
        "title": "Software Engineer",
        "company": "hSenid Mobile",
        "required_skills": ["Java", "Spring Boot", "MySQL", "REST", "Git"],
        "nice_to_have": ["React", "Docker", "AWS"],
        "description": "Build mobile and enterprise software solutions deployed across Asia and Africa.",
        "location": "Colombo, Sri Lanka"
    },
    {
        "title": "Junior Data Engineer",
        "company": "Rootcode Labs",
        "required_skills": ["Python", "SQL", "MongoDB", "Git", "REST"],
        "nice_to_have": ["Machine Learning", "Docker", "AWS"],
        "description": "Build data pipelines and AI solutions for fast-growing startups.",
        "location": "Colombo, Sri Lanka"
    },
    {
        "title": "Associate Engineer - Platform",
        "company": "Zone24x7",
        "required_skills": ["Python", "JavaScript", "Docker", "Git", "CI/CD"],
        "nice_to_have": ["Kubernetes", "AWS", "React"],
        "description": "Work on IoT and retail technology platforms used in global retail chains.",
        "location": "Colombo, Sri Lanka"
    },
    {
        "title": "Software Engineer",
        "company": "CodeGen International",
        "required_skills": ["Java", "JavaScript", "React", "MySQL", "Git", "REST"],
        "nice_to_have": ["Spring Boot", "Docker", "Agile"],
        "description": "Build travel technology software used by airlines and tour operators globally.",
        "location": "Colombo, Sri Lanka"
    }
]

async def seed_jobs():
    print("Connecting to MongoDB...")
    client = await init_db()
    
    print("Scraping topjobs.lk for up to 30 IT jobs...")
    scraped_jobs = await scrape_it_jobs(30)
    
    combined_jobs = []
    
    # Process scraped jobs
    for scrap in scraped_jobs:
        combined_jobs.append(scrap)
        
    # Process manual jobs
    for manual in MANUAL_JOBS:
        # Avoid duplicate title + company
        found = False
        for cj in combined_jobs:
            if cj["title"].lower() == manual["title"].lower() and cj["company"].lower() == manual["company"].lower():
                found = True
                break
        if not found:
            combined_jobs.append(manual)
            
    print(f"Total deduplicated jobs ready for insertion: {len(combined_jobs)}")
    
    seeded_count = 0
    existed_count = 0
    skipped_count = 0
    
    for job_data in combined_jobs:
        # Don't seed jobs with no required skills
        if not job_data.get("required_skills"):
            skipped_count += 1
            continue
            
        title = job_data["title"]
        company = job_data["company"]
        
        # Check if exists in DB (case insusceptible matching via standard query if possible, or EXACT match)
        existing = await Job.find_one(Job.title == title, Job.company == company)
        if existing:
            existed_count += 1
        else:
            job = Job(**job_data)
            await job.insert()
            seeded_count += 1
            
    total_db = await Job.count()
    print(f"Seeded {seeded_count} new jobs. {existed_count} already existed. Total in database: {total_db}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_jobs())
