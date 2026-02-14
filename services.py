from openai import OpenAI
from github import Github
import os
import json
import io
import re
from pypdf import PdfReader
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
            "professional_experience": [{"role": "string", "company": "string", "duration": "string", "key_tasks": ["string"]}],
            "project_experience": [{"title": "string", "technologies_used": ["string"], "description": "string"}],
            "skills": ["string"],
            "education": [{"institution": "string", "degree": "string", "year": "string"}]
        }
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

def extract_text(file_bytes: bytes, filename: str) -> str:
    """Detects file type and extracts raw text."""
    filename = filename.lower()
    text = ""
    
    try:
        # Stream the bytes into a file-like object
        file_stream = io.BytesIO(file_bytes)

        if filename.endswith(".pdf"):
            reader = PdfReader(file_stream)
            for page in reader.pages:
                text += (page.extract_text() or "") + "\n"
                
        elif filename.endswith(".docx"):
            doc = Document(file_stream)
            for para in doc.paragraphs:
                text += para.text + "\n"
                
        elif filename.endswith(".txt"):
            text = file_bytes.decode("utf-8")
            
        else:
            raise ValueError("Unsupported file format")
            
    except Exception as e:
        print(f"Error reading file {filename}: {e}")
        return ""

    return text.strip()

import market_data

class GapAnalysisTool:
    def __init__(self):
        self.market_trends = market_data.MARKET_TRENDS

    def analyze_gap(self, student_skills: list, target_role: str = "Fullstack Developer") -> dict:
        requirements = market_data.get_job_requirements(target_role)
        
        found_skills = [s for s in student_skills if any(req.lower() == s.lower() for req in requirements)]
        missing_skills = [req for req in requirements if not any(s.lower() == req.lower() for s in student_skills)]
        
        score = (len(found_skills) / len(requirements)) * 100 if requirements else 0
        
        # Personalized Learning Path (Mock logic for now)
        learning_path = [f"Complete a project using {skill}" for skill in missing_skills]
        
        return {
            "score": round(score, 2),
            "missing_skills": missing_skills,
            "learning_path": learning_path
        }

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