import asyncio
import os
from dotenv import load_dotenv
from database import init_db
from jobs.models import Job

# Load env variables
load_dotenv()

async def seed_jobs():
    print("Connecting to MongoDB...")
    client = await init_db()
    
    # Check if jobs already exist to prevent duplicate seeding
    existing_count = await Job.count()
    if existing_count > 0:
        print(f"Database already contains {existing_count} jobs. Clearing jobs before seeding...")
        await Job.find_all().delete()
        
    print("Seeding 10 realistic Sri Lankan tech jobs...")

    jobs_data = [
        {
            "title": "Associate Software Engineer",
            "company": "WSO2",
            "required_skills": ["Java", "Spring Boot", "Git", "REST APIs"],
            "nice_to_have": ["Kubernetes", "Docker", "WSO2 API Manager"],
            "description": "Join our integration engineering team to build scalable middleware solutions.",
            "location": "Colombo, Sri Lanka"
        },
        {
            "title": "Software Engineer",
            "company": "IFS",
            "required_skills": ["C#", ".NET", "SQL", "Angular"],
            "nice_to_have": ["Azure", "Agile", "Microservices"],
            "description": "Develop enterprise resource planning (ERP) software for global customers.",
            "location": "Colombo, Sri Lanka"
        },
        {
            "title": "Junior Engineer",
            "company": "Sysco Labs",
            "required_skills": ["Python", "AWS", "SQL", "React"],
            "nice_to_have": ["Terraform", "CI/CD", "PostgreSQL"],
            "description": "Help revolutionize the foodservice industry through cloud-native tech.",
            "location": "Colombo, Sri Lanka"
        },
        {
            "title": "Software Developer",
            "company": "Dialog Axiata",
            "required_skills": ["Node.js", "Express", "MongoDB", "Vue"],
            "nice_to_have": ["Telco APIs", "Redis", "Docker"],
            "description": "Build high-throughput backend services for millions of subscribers.",
            "location": "Colombo, Sri Lanka"
        },
        {
            "title": "Software Engineer",
            "company": "hSenid Mobile",
            "required_skills": ["Java", "MySQL", "Linux", "OOP"],
            "nice_to_have": ["Telecom Domain", "Spring Core", "Jira"],
            "description": "Develop and maintain telco-grade platforms and enterprise software.",
            "location": "Colombo, Sri Lanka"
        },
        {
            "title": "Associate Engineer",
            "company": "Virtusa",
            "required_skills": ["Java", "React", "SQL", "Git"],
            "nice_to_have": ["TypeScript", "AWS", "Junit"],
            "description": "Work on enterprise digital transformation projects for global clients.",
            "location": "Colombo, Sri Lanka"
        },
        {
            "title": "Software Engineer",
            "company": "Zone24x7",
            "required_skills": ["C++", "Python", "Linux", "Machine Learning"],
            "nice_to_have": ["TensorFlow", "OpenCV", "Embedded Systems"],
            "description": "Innovate in retail tech, applying ML models to edge devices and systems.",
            "location": "Colombo, Sri Lanka"
        },
        {
            "title": "Junior Developer",
            "company": "Rootcode Labs",
            "required_skills": ["React Native", "Node.js", "Firebase", "Redux"],
            "nice_to_have": ["GraphQL", "Tailwind", "Figma"],
            "description": "Build beautiful and highly performant mobile applications for startups.",
            "location": "Colombo, Sri Lanka"
        },
        {
            "title": "Associate Engineer",
            "company": "99X Technology",
            "required_skills": ["Angular", ".NET", "Azure", "SQL Server"],
            "nice_to_have": ["Scrum", "TDD", "Product Engineering"],
            "description": "Co-create digital products for Scandinavian markets using agile methodologies.",
            "location": "Colombo, Sri Lanka"
        },
        {
            "title": "Software Engineer",
            "company": "CodeGen International",
            "required_skills": ["Java", "Spring", "Angular", "Hibernate"],
            "nice_to_have": ["Travel Domain Knowledge", "Vue", "AWS"],
            "description": "Build complex reservation systems and AI-driven platforms for the travel industry.",
            "location": "Colombo, Sri Lanka"
        }
    ]

    for data in jobs_data:
        job = Job(**data)
        await job.insert()

    print(f"Successfully seeded 10 jobs into MongoDB!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_jobs())
