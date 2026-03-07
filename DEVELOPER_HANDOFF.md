# SkillSync Developer Handoff Documentation

Welcome to the **SkillSync Backend Repository**. This document serves as the master guide to the architectural decisions, pipeline mechanics, and AI strategies implemented from Phase 1 to Phase 24.

---

## 1. Quick Start / Setup (Important)

### System Dependencies
- **libmagic:** Essential for the security layer (MIME-type sniffing). 
  - MacOS: `brew install libmagic`
  - Linux: `sudo apt-get install libmagic1`

### Environment Configuration (`.env`)
You must create a `.env` file in the root. The application will crash on boot if these are missing:
- `MONGO_URL`: Your MongoDB Atlas connection string.
- `SECRET_KEY`: Long random string for JWT signing.
- `DEEPSEEK_API_KEY`: API key for our primary AI engine.
- `GITHUB_TOKEN`: Classic Personal Access Token for the GitHub Auditor.

---

## 2. Authentication Flow (JWT Deep Dive)

### Process:
1. **Signup (`/auth/signup`):** Hashes passwords using `bcrypt`. Auto-creates a `Student` document in MongoDB for users with the `student` role.
2. **Login (`/auth/login`):** Uses OAuth2 Password Flow. 
   - **Note:** Must be sent as `x-www-form-urlencoded` (Form Data), NOT JSON.
   - Credentials map `username` -> `email`.
3. **Token:** Returns a JWT containing the user's email in the `sub` claim. 
4. **Protection:** Use `Depends(get_current_user)` from `auth.dependencies` to protect any route. It decodes the JWT and queries MongoDB to return the full `User` object.

---

## 3. HOW THE SCORING WORKS (The Logic Engine)

We use two distinct scoring systems to ensure a "Bias-Free Meritocracy."

### A. Readiness Score (Student Assessment)
Located in `services.py`. This is a deterministic score out of 100 based on the facts extracted from the student's profile.

| Pillar | Max Pts | Logic |
| :--- | :--- | :--- |
| **Pillar 1: GitHub (Proof of Work)** | 40 | Based on raw GitHub stats. >20 repos = **40pts**, >5 repos = **20pts**. |
| **Pillar 2: Technical Depth** | 40 | Uses a category-tiered map. Tier 3 (Cloud/DevOps/AI) = **10pts**, Tier 2 (Frameworks) = **8pts**, Tier 1 (Vanilla) = **5pts**. |
| **Pillar 3: Education** | 20 | Binary check. If degree contains keywords like "CS", "IT", or "Engineering" = **20pts**. |

**Truth Override:** If a student has > 5 GitHub repos, we automatically inject "Git" and "Version Control" into their skill pool, even if they forgot to put it on their resume. We trust the code, not just the words.

### B. Job Match Score (weighted logic)
Located in `jobs/matching.py`. This is a mathematical comparison between a student's profile and a specific job.

- **Required Skills (Weight 1.0):** Skills the company *needs*.
- **Nice-to-Have (Weight 0.5):** Skills that are a *bonus*.

**Formula:** `(Total Achieved Weight / Total Possible Weight) * 100`.

**Why this matters:** We do NOT use AI for the final matching score. AI is only used to *extract* the data (The Sensor). Using AI for calculation creates bias. Our Python engine (The Calculator) ensures every candidate is judged purely on their technical alignment.

---

## 4. The AI Analysis Pipeline (LangGraph)
Analysis happens in `graph.py` via a state-machine:
1. **`parse_resume`:** Uses `pdfplumber` spatial parsing (reading horizontal planes) to avoid scrambling multi-column layouts.
2. **`market_research`:** DeepSeek researches the job title to generate dynamic "Must-Have" requirements for the current year.
3. **`audit_github`:** Low-level audit of repos/languages.
4. **`analyze_gap`:** Final merge node that runs the scoring logic above.

---

## 5. Security & Rate Limiting
- **MIME Checking:** We check "Magic Bytes" to prevent users from renaming a `.exe` to `.pdf`.
- **Rate Limits:** `/auth/login` is limited to 5/min to prevent brute force. `/jobs/scrape` is 1/hour per IP to respect source sites.
- **Lockdown CORS:** Configured to allow only specific origins in production.
