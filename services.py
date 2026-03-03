from openai import OpenAI
from github import Github
import os
import json
import io
import re
import pdfplumber
from docx import Document
from tree_sitter import Language, Parser
import tree_sitter_python as tspython

# Helper to get API Key
def get_api_key(key_name):
    key = os.getenv(key_name)
    if not key:
        from dotenv import load_dotenv
        load_dotenv()
        key = os.getenv(key_name)
    return key

class ResumeParserTool:
    def __init__(self):
        # DeepSeek uses the OpenAI-compatible SDK
        api_key = get_api_key("DEEPSEEK_API_KEY")
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.deepseek.com"
        )
        self.model_id = "deepseek-chat" # This is V3

    async def parse(self, text: str) -> dict:
        system_prompt = """
        You are an expert recruitment assistant. Analyze the resume text and extract information into a structured JSON format.
        Strictly distinguish between "Professional Experience" and "Project Experience".
        Identify specific skills and categorize them.
        
        Return the result in JSON format matching this structure:
        {
            "name": "string",
            "contact_info": {"email": "string", "github": "string", "phone": "string"},
            "professional_history": [
                {
                    "role": "string (Look for bolded text or items near dates)",
                    "company": "string (The organization immediately associated with the role)",
                    "duration": "string (e.g., 2021-Present)",
                    "key_tasks": ["string"]
                }
            ],
            "project_experience": [{"title": "string", "technologies_used": ["string"], "description": "string"}],
            "skills": ["string (Flattened list of all technical keywords)"],
            "education_history": [{"institution": "string", "degree": "string", "year": "string", "gpa": "string (e.g. 3.8/4.0)"}],
            "ats_feedback": {
                "score_estimate": "string (High/Medium/Low)",
                "critical_issues": ["string"],
                "optimization_tips": ["string"]
            }
        }

        Analyze the parsed text for ATS compatibility. If the resume uses multiple columns, complex tables, or non-standard headers, provide 3 specific, actionable tips. 
        ENSURE company names are correctly associated with roles by looking for proximity to dates.
        """
        
        # Limit text size for token efficiency
        text_snippet = text[:8000]
        user_prompt = f"Resume Text:\n{text_snippet}"
        
        try:
            # Using DeepSeek's native JSON mode
            response = self.client.chat.completions.create(
                model=self.model_id,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            print(f"Error calling DeepSeek: {e}")
            return {"error": "Failed to parse resume", "details": str(e)}

class GitHubAuditorTool:
    def __init__(self):
        # Initialize GitHub Client
        token = get_api_key("GITHUB_TOKEN")
        self.gh = Github(token) if token and token != "your_github_token_here" else Github()
        
        # Initialize AI Client for auditing
        ds_key = get_api_key("DEEPSEEK_API_KEY")
        self.ai_client = OpenAI(api_key=ds_key, base_url="https://api.deepseek.com")
        self.model_id = "deepseek-chat"

        # Initialize tree-sitter for local parsing (if needed)
        self.PY_LANGUAGE = Language(tspython.language())
        self.parser = Parser(self.PY_LANGUAGE)

    def _extract_repo_path(self, url: str) -> str:
        """Extracts 'owner/repo' from a GitHub URL. Handles profile links gracefully."""
        if not url: return ""
        # Clean URL
        url = url.rstrip('/')
        match = re.search(r"github\.com/([^/]+)(?:/([^/?#]+))?", url)
        if match:
            owner = match.group(1)
            repo = match.group(2)
            if repo:
                return f"{owner}/{repo}"
            return owner # Return just owner if repo is missing
        return ""

    async def audit_repo(self, github_url: str) -> dict:
        """Fetches all repositories for the user and performs an aggregate portfolio audit."""
        repo_path = self._extract_repo_path(github_url)
        if not repo_path:
            return {"error": "Invalid GitHub URL."}

        try:
            # Step 1: Identify the User
            username = repo_path.split("/")[0]
            user = self.gh.get_user(username)
            repos = list(user.get_repos(sort="updated", direction="desc"))
            
            if not repos:
                return {"error": f"No public repositories found for user {username}"}

            # Step 2: Aggregate Portfolio Stats
            total_stars = 0
            total_forks = 0
            languages_agg = {}
            repo_summaries = []

            for r in repos:
                total_stars += r.stargazers_count
                total_forks += r.forks_count
                
                # Language Distribution
                try:
                    repo_langs = r.get_languages()
                    for lang, bytes_count in repo_langs.items():
                        languages_agg[lang] = languages_agg.get(lang, 0) + bytes_count
                except: pass

                repo_summaries.append({
                    "name": r.name,
                    "stars": r.stargazers_count,
                    "language": r.language,
                    "description": r.description,
                    "updated_at": r.updated_at.isoformat()
                })

            # Calculate Language percentages
            total_bytes = sum(languages_agg.values())
            lang_stats = {l: round((c / total_bytes) * 100, 1) for l, c in languages_agg.items()} if total_bytes > 0 else {}

            # Step 3: Deep Audit the "Top" Repo (or specific repo if provided in URL)
            target_repo = None
            if "/" in repo_path: # Specific repo requested
                target_repo = self.gh.get_repo(repo_path)
            else: # Fallback to most starred
                target_repo = sorted(repos, key=lambda x: x.stargazers_count, reverse=True)[0]

            readme_content = ""
            try:
                readme = target_repo.get_readme()
                readme_content = readme.decoded_content.decode("utf-8")[:2000]
            except:
                readme_content = "No README found."

            # Step 4: Multi-Repo AI Audit
            system_audit_prompt = """
            You are a Senior Technical Portfolio Auditor. Combine the aggregate stats and the deep dive of the featured project.
            Provide a holistic evaluation of the student's engineering profile.
            Focus on:
            1. Breadth of skills (from languages_agg)
            2. Depth in specific frameworks (from README/projects)
            3. Project Uniqueness and consistency
            4. Learning path recommendations

            Return a structured JSON report.
            """
            
            audit_payload = {
                "portfolio_stats": {
                    "total_repos": len(repos),
                    "total_stars": total_stars,
                    "language_distribution": lang_stats
                },
                "featured_project": {
                    "name": target_repo.full_name,
                    "readme_snippet": readme_content,
                    "top_files": [c.name for c in target_repo.get_contents("")][:10]
                },
                "all_projects_overview": repo_summaries[:10] # Top 10 recent
            }

            response = self.ai_client.chat.completions.create(
                model=self.model_id,
                messages=[
                    {"role": "system", "content": system_audit_prompt},
                    {"role": "user", "content": json.dumps(audit_payload)}
                ],
                response_format={"type": "json_object"}
            )
            
            ai_report = json.loads(response.choices[0].message.content)
            
            return {
                "aggregate_stats": {
                    "total_repos": len(repos),
                    "total_stars": total_stars,
                    "languages": lang_stats
                },
                "ai_portfolio_audit": ai_report,
                "featured_repo": target_repo.full_name,
                "status": "completed"
            }

        except Exception as e:
            print(f"Error in multi-repo audit: {e}")
            return {"error": str(e), "status": "failed"}

# Phase 21: Tiered Skill Ceilings (Pristine Depth Cap)
SKILL_ONTOLOGY = {
    "Object Oriented Programming": ["Java", "C++", "C#", "Python", "OOP"],
    "Frontend Frameworks": ["React", "Next.js", "Angular", "Vue", "Tailwind", "Bootstrap"],
    "Backend Systems": ["Node.js", "Express", "Laravel", "Django", "Spring Boot", "PHP", "FastAPI"],
    "Database Management": ["SQL", "MySQL", "PostgreSQL", "MongoDB", "SQLite", "NoSQL", "Redis"],
    "Version Control": ["Git", "GitHub", "Bitbucket", "GitLab"],
    "Software Lifecycle": ["Agile", "Scrum", "Jira", "CI/CD", "Trello", "DevOps"],
    "Cloud & Infrastructure": ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform"],
    "Artificial Intelligence": ["Machine Learning", "TensorFlow", "PyTorch", "NLP", "LLM", "Deep Learning"],
    "Mobile Development": ["React Native", "Flutter", "Swift", "Kotlin", "iOS", "Android"]
}

CATEGORY_TIERS = {
    "Frontend Frameworks": 1,
    "Database Management": 1,
    "Object Oriented Programming": 2,
    "Backend Systems": 2,
    "Version Control": 2,
    "Software Lifecycle": 3,
    "Cloud & Infrastructure": 3,
    "Artificial Intelligence": 3,
    "Mobile Development": 3
}

def extract_text(file_bytes: bytes, filename: str) -> str:
    """Detects file type and extracts text using a spatial line-grouping strategy."""
    filename = filename.lower()
    text = ""
    file_size_kb = len(file_bytes) / 1024
    
    print(f"--- INFO: Starting spatial extraction for {filename} ({file_size_kb:.2f} KB) ---")
    
    try:
        file_stream = io.BytesIO(file_bytes)

        if filename.endswith(".pdf"):
            with pdfplumber.open(file_stream) as pdf:
                for page in pdf.pages:
                    # Task 2: Spatial Line Grouping (Y-Axis Logic)
                    words = page.extract_words(x_tolerance=3, y_tolerance=2)
                    if not words: continue
                    
                    # Sort words primarily by top (Y) and secondarily by x0 (X)
                    words.sort(key=lambda w: (w['top'], w['x0']))
                    
                    lines = []
                    current_line = []
                    last_top = words[0]['top']
                    
                    for w in words:
                        # If word is on a new vertical line (delta > 2px)
                        if abs(w['top'] - last_top) > 2:
                            lines.append(" ".join([word['text'] for word in current_line]))
                            current_line = [w]
                            last_top = w['top']
                        else:
                            current_line.append(w)
                    
                    if current_line:
                        lines.append(" ".join([word['text'] for word in current_line]))
                    
                    text += "\n".join(lines) + "\n\n"
            
        elif filename.endswith(".docx"):
            doc = Document(file_stream)
            for para in doc.paragraphs:
                text += para.text + "\n"
        elif filename.endswith(".txt"):
            text = file_bytes.decode("utf-8")
        else:
            raise ValueError(f"Unsupported file format: {filename}")
            
    except Exception as e:
        print(f"--- EXCEPTION: Extraction failed: {e} ---")
        return ""

    return text.strip()

import market_data

class MarketResearcherTool:
    def __init__(self):
        api_key = get_api_key("DEEPSEEK_API_KEY")
        self.client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")
        self.model_id = "deepseek-chat"

    async def research(self, job_title: str) -> dict:
        """Acts as a Market Analyst to determine required skills for a role."""
        system_prompt = """
        You are a Tech Lead and Market Analyst. For the given job title, identify the most in-demand skills.
        Categorize them into:
        1. must_have: Core technical skills/languages/frameworks.
        2. nice_to_have: Supplementary tools or advanced concepts.
        3. soft_skills: Communication, leadership, etc.

        Return strictly as JSON.
        """
        user_prompt = f"Target Role: {job_title}"

        try:
            response = self.client.chat.completions.create(
                model=self.model_id,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Market Research failed: {e}")
            # Fallback to generic fullstack skills if AI fails
            return {
                "must_have": ["Python", "JavaScript", "SQL"],
                "nice_to_have": ["Docker", "AWS"],
                "soft_skills": ["Communication"]
            }

class GapAnalysisTool:
    def __init__(self):
        api_key = get_api_key("DEEPSEEK_API_KEY")
        self.client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")
        self.model_id = "deepseek-chat"

    async def _semantic_skill_check(self, student_skills: list, market_required: list) -> list:
        return []

    def _calculate_deterministic_score(self, student_skills_set: set, market_requirements: dict, github_report: dict, university_info: dict) -> dict:
        """Phase 20: Architectural Override Scoring (Deterministic State Logic)"""
        
        # 1. PILLAR 1: PROOF OF WORK (40 Pts)
        gh_points = 0
        repo_evidence = []
        total_repos = 0
        if github_report:
            gh_stats = github_report.get("portfolio_analysis", {}).get("aggregate_stats", {})
            total_repos = gh_stats.get("total_repos", 0)
            if total_repos >= 20: 
                gh_points = 40
            elif total_repos >= 5: 
                gh_points = 20
        
        if total_repos > 0:
            repo_evidence.append(f"Verified Version Control via {total_repos} repositories.")

        # 2. PILLAR 2: TECHNICAL DEPTH (40 Pts)
        tech_points = 0
        matched_categories = set()
        has_pristine = False
        
        for category, skills in SKILL_ONTOLOGY.items():
            category_match = False
            for skill in skills:
                skill_lower = skill.lower()
                if any(skill_lower == s or (len(s) > 3 and s in skill_lower) or (len(skill_lower) > 3 and skill_lower in s) for s in student_skills_set):
                    category_match = True
                    break
            
            if category_match:
                matched_categories.add(category)
                tier = CATEGORY_TIERS.get(category, 1)
                
                if tier == 1:
                    tech_points += 5
                elif tier == 2:
                    tech_points += 8
                elif tier == 3:
                    tech_points += 10
                    has_pristine = True

        tech_points = min(tech_points, 40)
        
        # 3. PILLAR 3: DEGREE RELEVANCE (20 Pts)
        edu_points = 0
        degree_title = university_info.get("degree", "").lower() if university_info else ""
        
        if any(k in degree_title for k in ["computer science", "it", "information technology", "engineering", "computing", "software", "math"]):
            edu_points = 20
        
        total_score = gh_points + tech_points + edu_points
        total_score = min(total_score, 100.0)

        return {
            "score": total_score,
            "has_pristine": has_pristine,
            "breakdown": {
                "github": gh_points,
                "technical": tech_points,
                "education": edu_points
            },
            "evidence": repo_evidence + [f"Matched Categories: {', '.join(matched_categories)}"]
        }

    def analyze_weighted_gap(self, student_skills: list, market_requirements: dict, github_report: dict = None, university_info: dict = None) -> dict:
        """Phase 20: Architectural Override Gap Analysis with Truth Check"""
        skill_pool = set([s.lower() for s in student_skills])
        
        total_repos = 0
        if github_report:
            gh_stats = github_report.get("portfolio_analysis", {}).get("aggregate_stats", {})
            total_repos = gh_stats.get("total_repos", 0)
            
            for lang in gh_stats.get("languages", {}):
                skill_pool.add(lang.lower())
            for repo in github_report.get("portfolio_analysis", {}).get("repositories", []):
                name = repo.get("name", "").lower()
                skill_pool.add(name)
                skill_pool.add(name.replace("-", " ").replace("_", " "))
                for topic in repo.get("topics", []):
                    skill_pool.add(topic.lower())

        # Inject specific skills if repos > 5 (Truth Override)
        if total_repos > 5:
            skill_pool.add("version control")
            skill_pool.add("software lifecycle")
            skill_pool.add("git")
            skill_pool.add("agile")
            
        result = self._calculate_deterministic_score(skill_pool, market_requirements, github_report, university_info)
        
        must_haves = market_requirements.get("must_have", [])
        missing_critical_skills = []
        
        for req in must_haves:
            req_lower = req.lower()
            found = False
            req_norm = req_lower.replace("-", " ").replace("_", " ")
            if any(req_norm == s or req_lower == s or (len(s) > 3 and s in req_norm) for s in skill_pool):
                found = True
            
            if not found and req in SKILL_ONTOLOGY:
                if any(child.lower() in skill_pool for child in SKILL_ONTOLOGY[req]):
                    found = True
            
            if not found:
                missing_critical_skills.append(req)

        # Explicit Removal Logic (Truth Check Override)
        if total_repos > 5:
            missing_critical_skills = [s for s in missing_critical_skills if s not in ["Version Control", "Software Lifecycle"]]

        return {
            "score": result["score"],
            "has_pristine": result["has_pristine"],
            "breakdown": result["breakdown"],
            "verified_evidence": result["evidence"],
            "missing_critical": missing_critical_skills,
            "status": "Elite Candidate" if result["score"] >= 80 else "Strong" if result["score"] >= 50 else "Watchlist"
        }

        return {
            "score": result["score"],
            "breakdown": result["breakdown"],
            "verified_evidence": result["evidence"],
            "missing_critical": missing_critical_skills,
            "status": "Elite Candidate" if result["score"] >= 80 else "Strong" if result["score"] >= 50 else "Watchlist"
        }

    def analyze_gap(self, student_skills: list, target_role: str = "Fullstack Developer") -> dict:
        # Legacy method (Phase 2), kept for backward compatibility if needed
        return {"note": "Use analyze_weighted_gap for Phase 9 features"}

async def analyze_student_profile(text: str, github_url: str = None) -> dict:
    """Enhanced high-level orchestration for student analysis."""
    parser = ResumeParserTool()
    extracted_data = await parser.parse(text)
    
    student_skills = extracted_data.get("skills", [])
    
    gap_analyzer = GapAnalysisTool()
    gap_report = gap_analyzer.analyze_gap(student_skills)
    
    # Optional GitHub Audit if URL provided
    github_report = None
    if github_url:
        auditor = GitHubAuditorTool()
        github_report = await auditor.audit_repo(github_url)

    return {
        "extracted_data": extracted_data,
        "gap_report": gap_report,
        "github_report": github_report,
        "status": "success" if "error" not in extracted_data else "partial"
    }