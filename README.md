# SkillSync - AI-Powered Talent Alignment Platform

## Requirements

- Node 18+
- Python 3.10+

## Setup

### Frontend

```bash
cd Frontend
npm install
npm run dev
npm run build
npm run lint
```

### Backend

```bash
cd Backend
python -m venv .venv

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```