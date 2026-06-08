# SkillSync

**AI-Powered Talent Alignment Platform** that bridges the gap between students, universities, and recruiters.

Students upload their CV and GitHub profile — SkillSync analyzes skills, identifies gaps, and matches them to jobs. Recruiters post roles and search talent. Universities track placement rates and curriculum alignment.

---

## Features

**Students**
- CV/resume analysis (PDF, DOCX, TXT) with AI-extracted skills, education, and experience
- GitHub portfolio audit with code quality scoring
- Skill gap analysis with weighted scoring (technical 60%, GitHub 20%, education 20%)
- Job matching and one-click applications
- Personalized learning paths and career roadmaps

**Recruiters**
- Job posting and pipeline management
- Talent search with skill-based filtering
- Analytics: skill demand, hiring funnel, source tracking
- In-app messaging with candidates

**Universities**
- Placement tracking and statistics
- Curriculum vs. market demand gap visualization
- Student performance monitoring

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, TailwindCSS, Framer Motion |
| Backend | FastAPI (Python 3.11), async MongoDB (Motor + Beanie) |
| AI | DeepSeek V3 via OpenAI-compatible SDK, LangGraph pipeline |
| Auth | JWT (python-jose) + bcrypt |
| GitHub Integration | PyGithub |
| File Processing | pdfplumber, python-docx, tree-sitter |
| Charts | Recharts |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions → GitHub Container Registry |

---

## Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- DeepSeek API key
- GitHub personal access token

---

## Setup

### 1. Clone

```bash
git clone https://github.com/your-org/SkillSync.git
cd SkillSync
```

### 2. Backend

```bash
cd Backend
cp .env.example .env        # fill in your values
python -m venv .venv
source .venv/bin/activate   # Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload   # http://localhost:8000
```

### 3. Frontend

```bash
cd Frontend
cp .env.local.example .env.local   # or create manually
npm install
npm run dev                         # http://localhost:3000
```

### 4. Docker (Backend + MongoDB)

```bash
docker-compose up   # MongoDB on :27017, Backend API on :8000
```

---

## Environment Variables

### Backend — `Backend/.env`

| Variable | Description |
|---|---|
| `SECRET_KEY` | JWT signing secret (change in production) |
| `ALGORITHM` | JWT algorithm — `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime in minutes — `30` |
| `MONGO_URL` | MongoDB connection string |
| `DEEPSEEK_API_KEY` | DeepSeek API key for AI analysis |
| `GITHUB_TOKEN` | GitHub personal access token for portfolio auditing |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins (optional) |

### Frontend — `Frontend/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL — `http://localhost:8000` |

---

## API Overview

| Prefix | Description | Auth |
|---|---|---|
| `POST /auth/signup` | Register (student / recruiter / university) | Public |
| `POST /auth/signin` | Login, returns JWT | Public |
| `POST /analyze` | Upload CV → full AI analysis pipeline | JWT |
| `GET /student/dashboard` | Student dashboard data | JWT |
| `GET /student/jobs` | Available job listings | JWT |
| `POST /student/applications` | Apply to a job | JWT |
| `POST /recruiter/jobs` | Create a job posting | JWT + recruiter role |
| `GET /recruiter/analytics` | Recruiter analytics | JWT + recruiter role |
| `GET /university/placements` | Placement stats | JWT + university role |

Full interactive docs at `http://localhost:8000/docs` (Swagger UI) once the backend is running.

---

## CI/CD

GitHub Actions runs on every push to `main`:

1. **Lint** — `ruff` (Python)
2. **Test** — `pytest`
3. **Build & Push** — Docker image → GitHub Container Registry (`ghcr.io`)

---

## Deployment

**Frontend** — Deploy to [Vercel](https://vercel.com). Set `NEXT_PUBLIC_API_URL` in the Vercel dashboard.

**Backend** — Any Docker-compatible host:

```bash
docker build -t skillsync-backend ./Backend
docker run -p 8000:8000 --env-file Backend/.env skillsync-backend
```

Or use the included `Procfile` for Heroku:

```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## Project Structure

```
SkillSync/
├── Backend/
│   ├── main.py              # App entrypoint + /analyze route
│   ├── services.py          # AI tools (ResumeParser, GitHubAuditor, GapAnalyzer)
│   ├── graph.py             # LangGraph pipeline
│   ├── auth/                # JWT auth (signup, signin, middleware)
│   ├── jobs/                # Job models, CRUD, matching algorithm
│   ├── routers/             # Feature routers (student, recruiter, university, cv)
│   └── scrapers/            # topjobs.lk job scraper
├── Frontend/
│   ├── src/app/             # Next.js App Router pages
│   ├── src/components/      # React components (student, recruiter, ui)
│   ├── src/lib/api/         # Typed API clients
│   └── src/types/           # TypeScript interfaces
├── docker-compose.yml
└── .github/workflows/ci.yml
```
