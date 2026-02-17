from typing import TypedDict, Optional, List
from langgraph.graph import StateGraph, START, END
import services

class StudentState(TypedDict):
    # Input
    raw_text: str
    github_url: Optional[str]
    target_job_title: str # Added in Phase 9
    
    # Processed Data
    extracted_data: dict
    market_requirements: dict # Added in Phase 9
    github_report: Optional[dict]
    gap_report: dict
    
    # Final Result
    status: str

# Node 0: Research Market Requirements (New Phase 9)
async def research_market_node(state: StudentState):
    print(f"--- NODE: RESEARCH MARKET ({state['target_job_title']}) ---")
    researcher = services.MarketResearcherTool()
    requirements = await researcher.research(state["target_job_title"])
    return {"market_requirements": requirements}

# Node 1: Parse Resume
async def parse_resume_node(state: StudentState):
    print("--- NODE: PARSE RESUME ---")
    parser = services.ResumeParserTool()
    extracted_data = await parser.parse(state["raw_text"])
    return {"extracted_data": extracted_data}

# Node 2: Audit GitHub
async def audit_github_node(state: StudentState):
    print("--- NODE: AUDIT GITHUB ---")
    
    # Priority 1: User-provided URL from Query Param
    # Priority 2: Extracted URL from Resume
    github_url = state.get("github_url")
    if not github_url:
        github_url = state.get("extracted_data", {}).get("contact_info", {}).get("github")
    
    if not github_url:
        return {"github_report": None}
    
    auditor = services.GitHubAuditorTool()
    github_report = await auditor.audit_repo(github_url)
    return {"github_report": github_report}

# Node 3: Analyze Gaps
async def analyze_gap_node(state: StudentState):
    print("--- NODE: ANALYZE GAPS ---")
    skills = state["extracted_data"].get("skills", [])
    
    # Phase 15: Extract University/GPA for Heuristics
    edu = state["extracted_data"].get("education_history", [])
    uni_info = {"name": "", "gpa": 0.0}
    if edu:
        uni_info = {
            "name": edu[0].get("institution", ""),
            "degree": edu[0].get("degree", ""),
            "gpa": edu[0].get("gpa", edu[0].get("year", "0.0")) # Fallback if GPA key is missing but value is in string
        }
    
    # Phase 9/10/15: Weighted Heuristic Scoring
    gap_analyzer = services.GapAnalysisTool()
    gap_report = gap_analyzer.analyze_weighted_gap(
        student_skills=skills, 
        market_requirements=state["market_requirements"],
        github_report=state.get("github_report"),
        university_info=uni_info
    )
    
    # Phase 20: Architectural Override - The Calculator
    # Moving the provided logic into the node flow
    try:
        repos = state.get("github_report", {}).get("aggregate_stats", {}).get("total_repos", 0)
    except (KeyError, AttributeError):
        repos = 0
            
    github_score = 0
    if repos >= 20: github_score = 40
    elif repos >= 5: github_score = 20
        
    edu_score = 0
    try:
        degree = state["extracted_data"]["education_history"][0]["degree"].lower()
        if any(k in degree for k in ["computer science", "it", "information technology", "engineering", "math"]):
            edu_score = 20
    except (KeyError, IndexError):
        edu_score = 0
            
    tech_score = gap_report.get("breakdown", {}).get("technical", 0)

    final_score = github_score + edu_score + tech_score
    if final_score > 100: final_score = 100
    
    # Update the report before returning
    gap_report["score"] = final_score
    gap_report["breakdown"]["github"] = github_score
    gap_report["breakdown"]["education"] = edu_score
    
    # Determine final status
    status = "success" if "error" not in state["extracted_data"] else "partial"
    
    return {"gap_report": gap_report, "status": status}

# Conditional Logic
def should_audit_github(state: StudentState):
    # Flow to audit if either URL is present
    github_url = state.get("github_url")
    extracted_github = state.get("extracted_data", {}).get("contact_info", {}).get("github")
    
    if github_url or extracted_github:
        return "audit_github"
    return "analyze_gap"

# Build Graph
builder = StateGraph(StudentState)

builder.add_node("research_market", research_market_node)
builder.add_node("parse_resume", parse_resume_node)
builder.add_node("audit_github", audit_github_node)
builder.add_node("analyze_gap", analyze_gap_node)

# Flow logic
builder.add_edge(START, "research_market")
builder.add_edge("research_market", "parse_resume")

# Conditional Edge: Resume -> GitHub OR Resume -> Gap Analysis
builder.add_conditional_edges(
    "parse_resume",
    should_audit_github,
    {
        "audit_github": "audit_github",
        "analyze_gap": "analyze_gap"
    }
)

builder.add_edge("audit_github", "analyze_gap")
builder.add_edge("analyze_gap", END)

# Compile
app = builder.compile()
