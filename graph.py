from typing import TypedDict, Optional, List
from langgraph.graph import StateGraph, START, END
import services

class StudentState(TypedDict):
    # Input
    raw_text: str
    github_url: Optional[str]
    
    # Processed Data
    extracted_data: dict
    github_report: Optional[dict]
    gap_report: dict
    
    # Final Result
    status: str

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
    gap_analyzer = services.GapAnalysisTool()
    gap_report = gap_analyzer.analyze_gap(skills)
    
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

builder.add_node("parse_resume", parse_resume_node)
builder.add_node("audit_github", audit_github_node)
builder.add_node("analyze_gap", analyze_gap_node)

builder.add_edge(START, "parse_resume")

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
