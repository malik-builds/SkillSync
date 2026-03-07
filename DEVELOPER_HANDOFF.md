# SkillSync Developer Handoff Documentation

Welcome to the **SkillSync Backend Repository**. This document serves as the master guide to the architectural decisions, pipeline mechanics, and AI strategies implemented from Phase 1 to Phase 24. It is designed to get new developers up to speed instantly.

---

## 1. Core Architecture & Tech Stack
- **Framework:** FastAPI (Python 3.13)
- **Database:** MongoDB Atlas via `beanie` (Async ODM) & `motor`.
- **AI Orchestration:** LangGraph (LangChain) for state-machine workflows.
- **LLM Provider:** DeepSeek V3/R1 via the standard `openai` Python SDK (massively cheaper, 100% interoperable with OpenAI formats).
- **Authentication:** OAuth2 using JWT Tokens (with `passlib` bcrypt hashing).

---

## 2. The AI Analysis Pipeline (LangGraph)
We explicitly decoupled our AI logic to avoid building massive, unmaintainable REST endpoints. The core resume analysis happens in `graph.py` and flows as follows:

1. **`parse_resume` node:** Uses `pdfplumber` (with tight X/Y spatial tolerances) to parse complex multi-column PDFs without scrambling the reading order. It then sends the raw text to DeepSeek to extract structured JSON (skills, education, contact info).
2. **`audit_github` node:** Scrapes the user's GitHub (using a Personal Access Token) to calculate their total public repos and follower count.
3. **`market_research` node:** Uses DeepSeek as a web agent to dynamically generate a list of trending technologies and certifications required for the student's target job title.
4. **`analyze_gap` node:** A pure Python heuristic engine that assigns scores (out of 100). It merges the GitHub data, the parsed degree, and the skills into a final "Readiness Score".

**Why this matters:** Because state flows between these nodes linearly, a developer can easily inject a loop, a human-in-the-loop checkpoint, or parallelize nodes without breaking the rest of the application.

---

## 3. The Bias-Free Job Matching Engine
**Location:** `jobs/matching.py`

When we match a student to a scraped job from `topjobs.lk`, **we do not use AI.**

### Why no AI?
LLMs are generative, not logical. If you ask an LLM to evaluate a candidate against a job description, it introduces systemic bias (favoring certain writing styles, hallucinating math, or heavily weighting gendered/cultural context clues hidden in names).

### How the deterministic engine works:
We use a pure Python mathematical matching algorithm utilizing weighted variables:
1. **Required Skills (Weight: 1.0):** If a student possesses this skill, they get 1.0 points. Otherwise, it is added to the `missing_skills` array.
2. **Nice-to-Have Skills (Weight: 0.5):** If a student possesses this, they get 0.5 points.

```python
match_percentage = (achieved_weight / total_possible_weight) * 100
```
This guarantees an objective, reproducible, and mathematically sound `match_percentage`. The AI is used purely as a **Sensor** (to extract the skills from the PDF) but the Python engine acts as the **Calculator**.

---

## 4. Student Integration Flow
1. **Signup (`POST /auth/signup`):** When a user signs up with the role `"student"`, the backend automatically generates an empty `Student` document in MongoDB linked to their email.
2. **Analysis (`POST /analyze`):** When the student uploads their resume, the LangGraph pipeline runs. Before returning the final result, the backend patches the student's MongoDB document, permanently updating their `skills` array, `github_url`, parsed `education`, and `ai_insights`.
3. **Job Match (`GET /jobs/matches/{student_id}`):** The API fetches the student's now-populated `skills` array and compares it against all active jobs in the remote database using the weighted algorithm above.

---

## 5. Security & Rate Limiting
- **Magic Bytes Validation:** We use `python-magic` alongside file extensions to ensure uploaded files are truly PDFs or DOCX files to prevent script injection. File sizes are hard-capped at 5MB.
- **Rate Limiting:** Implemented via `slowapi` (e.g., `1/hour` for web scraping, `10/minute` for heavy AI endpoints) to protect against DDoS and API billing abuse.
- **Fail-Fast Environment Loading:** Handled in `config.py`. If the server starts missing critical environment variables (e.g., `SECRET_KEY`), it immediately crashes with a descriptive error, preventing silent security failures in production.
