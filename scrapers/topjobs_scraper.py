import httpx
from bs4 import BeautifulSoup
import asyncio
import json
from datetime import datetime

BASE_URL = "https://www.topjobs.lk"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Academic Research Bot - SkillSync IIT Sri Lanka Student Project)",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}

REQUEST_DELAY = 2  # seconds between requests

TECH_KEYWORDS = [
    "Python", "Java", "JavaScript", "TypeScript", "Go", "C#",
    "React", "Angular", "Vue", "Next.js", "Node.js",
    "Spring Boot", "Django", "FastAPI", "Laravel",
    "MySQL", "PostgreSQL", "MongoDB", "Redis",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP",
    "Git", "CI/CD", "REST", "GraphQL", "Microservices",
    "Machine Learning", "TensorFlow", "PyTorch", "SQL"
]

async def check_robots_txt() -> bool:
    """Returns True if scraping is permitted."""
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                "https://www.topjobs.lk/robots.txt",
                headers=HEADERS,
                timeout=10.0
            )
            # If robots.txt blocks all bots or our path, return False
            return "Disallow: /" not in resp.text
        except Exception:
            return False

async def get_job_listings(category_url: str) -> list[dict]:
    """
    Scrape job listing page and return list of job summaries.
    Extract only: job title, company name, job URL
    Return max 20 jobs per category to avoid overloading.
    """
    jobs = []
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(category_url, headers=HEADERS, timeout=10.0)
            soup = BeautifulSoup(resp.text, "lxml")
            
            # A generic approach to find links that look like job posts since exact DOM might change
            links = soup.find_all("a")
            for a in links:
                href = a.get("href", "")
                if href and ("vacancy" in href.lower() or "job" in href.lower() or "applicant" in href.lower()):
                    title = a.text.strip()
                    if len(title) > 5 and len(jobs) < 20:
                        company = "Unknown Company"
                        parent = a.find_parent("tr") or a.find_parent("div")
                        if parent:
                            texts = [t.strip() for t in parent.strings if len(t.strip()) > 2]
                            if len(texts) > 1:
                                company = texts[1]
                        
                        full_url = href if href.startswith("http") else f"{BASE_URL}/{href.lstrip('/')}"
                        jobs.append({
                            "title": title,
                            "company": company,
                            "url": full_url
                        })
            return jobs[:20]
        except Exception as e:
            print(f"Error fetching listings from {category_url}: {e}")
            return jobs

async def get_job_details(job_url: str) -> dict:
    """
    Visit individual job page and extract details.
    Uses basic string matching for tech keywords against description text.
    """
    result = {
        "title": "",
        "company": "",
        "description": "",
        "required_skills": [],
        "location": "Sri Lanka"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(job_url, headers=HEADERS, timeout=10.0)
            soup = BeautifulSoup(resp.text, "lxml")
            
            text_content = soup.get_text(separator=" ", strip=True)
            result["description"] = text_content[:500]
            
            req_skills = []
            text_lower = text_content.lower()
            for kw in TECH_KEYWORDS:
                if kw.lower() in text_lower:
                    req_skills.append(kw)
            
            result["required_skills"] = list(set(req_skills))
            
            title_tag = soup.find("h1") or soup.find("h2")
            if title_tag:
                result["title"] = title_tag.text.strip()
                
            return result
        except Exception as e:
            print(f"Error fetching details from {job_url}: {e}")
            return result

def clean_job_data(raw_job: dict) -> dict:
    """Clean and normalise scraped data"""
    req_skills = list(set([s.strip() for s in raw_job.get("required_skills", []) if s.strip()]))
    if not req_skills:
        req_skills = []
        
    return {
        "title": raw_job.get("title", "").strip(),
        "company": raw_job.get("company", "").strip(),
        "required_skills": req_skills,
        "nice_to_have": [],
        "description": raw_job.get("description", "").strip()[:500],
        "location": "Sri Lanka",
        "is_active": True,
        "scraped_at": datetime.utcnow().isoformat(),
        "source": "topjobs.lk"
    }

async def scrape_it_jobs(max_jobs: int = 30) -> list[dict]:
    """Main scraping function for IT jobs on topjobs.lk"""
    is_allowed = await check_robots_txt()
    if not is_allowed:
        print("robots.txt check failed. Scraping disallowed.")
        return []
        
    categories = [
        "https://www.topjobs.lk/applicant/vacancies-by-function.jsp?FC=IT",
        "https://www.topjobs.lk/applicant/vacancies-by-function.jsp?FC=SE"
    ]
    
    all_jobs = []
    
    for cat in categories:
        listings = await get_job_listings(cat)
        await asyncio.sleep(REQUEST_DELAY)
        
        for list_item in listings:
            if len(all_jobs) >= max_jobs:
                break
                
            details = await get_job_details(list_item["url"])
            await asyncio.sleep(REQUEST_DELAY)
            
            if not details["title"]:
                details["title"] = list_item["title"]
            if not details["company"] or details["company"] == "Unknown Company":
                details["company"] = list_item["company"]
                
            cleaned = clean_job_data(details)
            if cleaned["required_skills"]:
                all_jobs.append(cleaned)
                print(f"Scraped job {len(all_jobs)}/{max_jobs}: {cleaned['title']} at {cleaned['company']}")
                
        if len(all_jobs) >= max_jobs:
            break
            
    return all_jobs
