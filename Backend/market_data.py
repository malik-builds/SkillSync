# market_data.py

# Golden Standard Job Descriptions (Mock)
MARKET_TRENDS = {
    "Fullstack Developer": ["Python", "FastAPI", "React", "Docker", "PostgreSQL"],
    "Data Scientist": ["Python", "TensorFlow", "Pandas", "SQL", "Scikit-Learn"],
    "DevOps Engineer": ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD"],
    "Frontend Developer": ["React", "JavaScript", "CSS", "TailwindCSS", "Next.js"],
}

def get_market_trends():
    """Returns aggregated market trends."""
    # In a real app, this would query the MarketTrend collection in MongoDB
    all_skills = []
    for skills in MARKET_TRENDS.values():
        all_skills.extend(skills)
    
    # Simple aggregation: return frequency of top skills
    from collections import Counter
    return Counter(all_skills).most_common(10)

def get_job_requirements(job_title: str):
    """Returns requirements for a specific job title."""
    return MARKET_TRENDS.get(job_title, MARKET_TRENDS["Fullstack Developer"])
