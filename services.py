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
        """Fetches repo data and uses AI to audit code quality."""
        repo_path = self._extract_repo_path(github_url)
        if not repo_path:
            return {"error": "Invalid GitHub URL. Please provide github.com/owner/repo or github.com/owner"}

        try:
            # Handle Profile Links (e.g., "malik-builds")
            if "/" not in repo_path:
                user = self.gh.get_user(repo_path)
                repos = user.get_repos(sort="updated", direction="desc")
                if repos.totalCount == 0:
                    return {"error": f"No public repositories found for user {repo_path}"}
                repo = repos[0]
                repo_path = repo.full_name
                print(f"--- INFO: Profile link detected. Auditing most recent repo: {repo_path} ---")
            else:
                repo = self.gh.get_repo(repo_path)
            
            # Fetch Repo Summary
            summary_info = {
                "full_name": repo.full_name,
                "description": repo.description,
                "topics": repo.get_topics(),
                "languages": repo.get_languages(),
                "stars": repo.stargazers_count,
            }

            # Fetch README
            readme_content = ""
            try:
                readme = repo.get_readme()
                readme_content = readme.decoded_content.decode("utf-8")[:3000] # Limit size
            except:
                readme_content = "No README found."

            # Fetch File Structure (Top level)
            contents = repo.get_contents("")
            file_list = [c.name for c in contents][:20]

            # AI Audit Prompt
            system_audit_prompt = """
            You are a Senior Technical Auditor. Analyze the provided GitHub repository metadata and README.
            Evaluate the student's project based on:
            1. Technical Complexity (High/Medium/Low)
            2. Best Practices (Design patterns, documentation)
            3. Project Uniqueness
            4. Potential learning gaps

            Return a structured JSON report.
            """
            
            audit_payload = f"""
            Repo Path: {repo_path}
            Summary: {json.dumps(summary_info)}
            Files: {file_list}
            README Snippet:
            {readme_content}
            """

            # Call AI for qualitative audit
            response = self.ai_client.chat.completions.create(
                model=self.model_id,
                messages=[
                    {"role": "system", "content": system_audit_prompt},
                    {"role": "user", "content": audit_payload}
                ],
                response_format={"type": "json_object"}
            )
            
            ai_report = json.loads(response.choices[0].message.content)
            
            return {
                "repo_info": summary_info,
                "ai_audit": ai_report,
                "status": "completed"
            }

        except Exception as e:
            print(f"Error auditing GitHub repo: {e}")
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