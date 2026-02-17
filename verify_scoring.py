import sys
import os

# Production Import
try:
    from services import GapAnalysisTool, SKILL_ONTOLOGY
except ImportError as e:
    print(f"FAILED TO IMPORT SERVICES: {e}")
    sys.exit(1)

def run_verification():
    print("--- SKILLSYNC SCORING VERIFICATION ---")
    analyzer = GapAnalysisTool()
    
    # Mock Elite Profile (Kaviska Style) - V1.0
    student_skills = ["Python", "React", "PostgreSQL", "Git", "Jira"]
    market_reqs = {
        "must_have": ["Object Oriented Programming", "Frontend Frameworks", "Database Management", "Software Lifecycle"],
        "soft_skills": ["Leadership"]
    }
    
    github_report = {
        "portfolio_analysis": {
            "aggregate_stats": {"total_repos": 46, "languages": {"Python": 60, "JavaScript": 40}},
            "repositories": [
                {"name": "Traffic-Analyzer", "topics": ["machine-learning", "python"]},
                {"name": "E-Commerce", "topics": ["react", "node"]}
            ]
        }
    }
    
    uni_info = {"name": "Some Random University", "degree": "BSc Mathematics", "gpa": "3.85/4.0"}
    
    # Test 1: Bias-Free Elite Scoring
    print("Test 1: Bias-Free Elite Candidate (46 Repos + Math Degree + 5 Categories)")
    report = analyzer.analyze_weighted_gap(student_skills, market_reqs, github_report, uni_info)
    print(f"Resulting Score: {report['score']}%")
    print(f"Status: {report['status']}")
    print(f"Breakdown: {report.get('breakdown')}")
    print(f"Verified Evidence: {report.get('verified_evidence')}")
    
    if report['score'] >= 95:
        print("✅ SUCCESS: Elite candidate received a perfect/near-perfect score.")
    else:
        print("❌ FAILURE: Score too low for an elite candidate.")

    # Test 2: Resume Omission Recovery
    print("\nTest 2: Resume Omission Recovery (Skills found only in GitHub)")
    # Remove 'React' and 'Python' from student skills
    minimal_skills = ["Git"]
    report_recovery = analyzer.analyze_weighted_gap(minimal_skills, market_reqs, github_report, uni_info)
    print(f"Score with Omissions: {report_recovery['score']}%")
    if report_recovery['score'] > 50:
         print("✅ SUCCESS: Recovery logic utilized GitHub evidence.")
    else:
         print("❌ FAILURE: Recovery logic failed to use GitHub evidence.")

if __name__ == "__main__":
    run_verification()
