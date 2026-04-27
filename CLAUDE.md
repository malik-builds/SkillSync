# SkillSync Backend — Claude Code Instructions

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Language | Python 3.11 |
| Framework | FastAPI + Uvicorn |
| Database | MongoDB (Motor async driver + Beanie ODM) |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| AI/LLM | DeepSeek V3 via OpenAI-compatible SDK |
| Orchestration | LangGraph (resume analysis pipeline) |
| GitHub | PyGithub |
| Rate limiting | slowapi |
| File parsing | pdfplumber, python-docx, tree-sitter |

## Required Environment Variables
```
MONGO_URL          # MongoDB connection string
DEEPSEEK_API_KEY   # DeepSeek AI API key
SECRET_KEY         # JWT signing secret
GITHUB_TOKEN       # GitHub API token
```

## Run & Build
```bash
cd Backend
pip install -r requirements.txt
uvicorn main:app --reload        # dev
# OR: see Procfile for production
```

## Project Structure
```
Backend/
├── main.py              → App entrypoint; /analyze, /students routes; CORS config
├── config.py            → Startup env var validation
├── database.py          → MongoDB + Beanie init
├── models.py            → Student document + Pydantic models
├── services.py          → AI tools: ResumeParserTool, GitHubAuditorTool, GapAnalysisTool, MarketResearcherTool
├── graph.py             → LangGraph pipeline: research_market → parse_resume → audit_github → analyze_gap
├── market_data.py       → Static skill/market data
├── auth/                → Auth module (JWT signup/signin, get_current_user dependency)
├── jobs/                → Job listing module (Job document, scraper endpoint, matching algorithm)
├── routers/
│   ├── student.py       → /student/* (dashboard, profile, analysis, jobs, applications, learning-paths, messages)
│   ├── recruiter.py     → /recruiter/* (dashboard, jobs CRUD, applications, talent, messaging, analytics, settings)
│   ├── cv.py            → /cv/* (CV upload)
│   ├── user.py          → /user/* endpoints
│   ├── university.py    → /university/* endpoints
│   ├── misc.py          → Health/misc
│   ├── application_models.py  → Application document
│   ├── message_models.py      → Conversation + Message documents
│   ├── recruiter_models.py    → RecruiterProfile, RecruiterJob, ScheduleEvent documents
│   └── university_models.py   → UniversityProfile document
└── scrapers/            → topjobs.lk scraper
```

## Key Data Model Relationships
- **User** ←→ **Student** linked by `email` (both created on signup for student role)
- **RecruiterJob** → **Job** mirrored with `recruiter_job_id` link (student-facing job board)
- **Application**: `student_email` + `job_id` (stored as recruiter job ID)
- **Student.extracted_data**: large JSON blob — CV analysis results, gap_report, github_report, market_requirements

## API Routes Summary
| Prefix | Module | Auth |
|--------|--------|------|
| /auth | auth/router.py | public + JWT |
| /analyze | main.py | JWT (student) |
| /jobs | jobs/router.py | public GET, JWT POST |
| /student | routers/student.py | JWT |
| /recruiter | routers/recruiter.py | JWT + recruiter role |
| /university | routers/university.py | JWT + university role |
| /cv | routers/cv.py | JWT |
| /user | routers/user.py | JWT |

## Conventions
- All protected routes depend on `get_current_user` from `auth/dependencies.py`
- Recruiter routes additionally use `require_recruiter` guard
- Errors: catch-all `except Exception → HTTPException(500, "Internal error")` with `print([ERROR])` logging
- Null-safety helpers in student.py: `sl()` (safe list), `ss()` (safe string), `sn()` (safe number)
- Job mirroring: when a recruiter creates/updates/deletes a RecruiterJob, the corresponding student-facing Job is also created/updated/deleted

## LangGraph Pipeline (/analyze)
```
START
  → research_market  (DeepSeek: market requirements for target role)
  → parse_resume     (DeepSeek: extract structured data from CV text)
  → [conditional] audit_github (if GitHub URL present)
  → analyze_gap      (weighted scoring: technical skills + github + education)
END
```

## Testing
No test suite exists yet. Test with `pytest` if adding tests.
