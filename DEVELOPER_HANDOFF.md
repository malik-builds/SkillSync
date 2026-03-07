# SkillSync: The Ultimate Backend Developer Guide (Student Edition)

Welcome, Developer! This document is not just a handoff; it is a technical map. It explains **exactly** how the SkillSync "Bias-Free Meritocracy Engine" works from the ground up. 

If you understand basic Python, this guide will teach you the professional patterns we used to build this enterprise-grade AI system.

---

## 🚀 1. Setup & Foundations

Before you run a single line of code, your computer needs to understand how to handle "Magic Bytes" and "Private Environments."

### A. The System C-Library (`libmagic`)
The backend doesn't just trust file extensions. It inspects the actual binary "headers" of a file. For this to work, you MUST install the `libmagic` library on your OS:
- **MacOS:** `brew install libmagic`
- **Why?** If a hacker renames a virus `malware.exe` to `resume.pdf`, our code uses `libmagic` to see the truth and block the upload.

### B. The Secret Vault (`.env`)
Create a file named `.env` in the root folder. **Never share this file.** It contains:
- `MONGO_URL`: The "phone number" to our database.
- `SECRET_KEY`: A long random string used to "sign" our identity tokens (JWT).
- `DEEPSEEK_API_KEY`: The key to our AI's brain.

### C. The Bodyguards (`config.py`)
On startup, our code runs `config.validate_env()`.
- **The Logic:** If a developer forgets to add a key to the `.env` file, the app **instantly crashes** with a clear error message.
- **Syntax Tip:** We use `os.getenv("KEY")`. If it returns `None`, we raise a `RuntimeError`.

---

## 🔐 2. Authentication: The Identity Loop

How does the app know who you are? We use **JWT (JSON Web Tokens)**.

### Step 1: Signup (`/auth/signup`)
- **Action:** User sends Email + Password.
- **Logic:** We use `bcrypt` to "hash" the password. We never store raw passwords.
- **Student Link:** We auto-create a `Student` document in MongoDB with the same email. This links your "login account" to your "resume profile."

### Step 2: Login (`/auth/login`)
- **Important:** SwaggerUI sends this as "Form Data," not JSON.
- **Logic:** We compare your input to the hashed password in the DB using `verify_password`. 
- **The Token:** If correct, we return a "JWT." Think of this as a digital wristband that expires in 30 minutes.

### Step 3: Protection (`Dependencies`)
- **Syntax:** `current_user: User = Depends(get_current_user)`
- **How it flows:** Every time you call a protected route, FastAPI looks at your "wristband" (JWT), decodes it to find your email, and checks the database to see if you still exist.

---

## 🧠 3. The Brain: LangGraph Orchestration

We don't just "ask AI a question." We use a **State Machine** in `graph.py`.

### The Concept of "State"
We have a dictionary called `StudentState`. As the data moves through the "Nodes" (functions), it grows.
1. **Node 1 (`parse_resume`):** AI reads the PDF -> Adds `extracted_data` to the State.
2. **Node 2 (`audit_github`):** Code audits the Repo -> Adds `github_report` to the State.
3. **Node 3 (`analyze_gap`):** Code calculates scores -> Adds `gap_report` to the State.

### Why this is smart:
It decouples the logic. If the GitHub Auditor fails, the Resume Parser still works independently. Each node is a "Specialist."

---

## 📊 4. THE SCORING ENGINES (Deep Dive)

This is the heart of SkillSync. We use a **"Deterministic Math"** approach.

### Engine A: The Readiness Score (out of 100)
Located in `services.py`. 
- **Pillar 1: GitHub (40 pts).** We look at `total_repos`. If it's > 20, you get 40 points. Why? Because code commits don't lie.
- **Pillar 2: Technical Depth (40 pts).** We use a **Category Tier Map**.
    - *Tier 3 (AI/DevOps):* 10 pts.
    - *Tier 2 (React/FastAPI):* 8 pts.
- **Pillar 3: Degree (20 pts).** We check for "Computer Science" or "Engineering" keywords.

### Engine B: The Job Matcher (Weighted Sets)
Located in `jobs/matching.py`. 
- **The Logic:** We use Python `Sets` to compare your skills against the job's skills.
- **Weights:** 
    - Required Skill = **1.0 weight**.
    - Nice-to-Have Skill = **0.5 weight**.
- **The Math:** `Match % = (Your Total Weight / Maximum Possible Weight) * 100`.

**⚠️ NO AI BIAS:** Notice that the scoring is pure Python math. We use the AI to **extract** the text, but the **Calculation** is done by code. This prevents the AI from being "biased" against certain names or writing styles.

---

## 📁 5. Data Flow Summary

1. **User Uploads PDF** -> `main.py`
2. **Validator checks size (<5MB)** -> `main.py`
3. **Spatial Parser reads horizontal lines** -> `services.py` 
4. **DeepSeek extracts JSON** -> `services.py`
5. **LangGraph merges GitHub + Skills** -> `graph.py`
6. **MongoDB saves the Final Profile** -> `Student.save()`
7. **Job Matcher compares Profile vs. Jobs Table** -> `matching.py`

---

## 🛠 6. Tips for Students
- **Beanie:** We use `Beanie`. It's an ODM (Object Document Mapper). Instead of writing complex MongoDB queries, you just write `Student.find_one(...)`.
- **Pydantic:** Every time data enters the API, Pydantic checks the "Type." If you send a string where an integer should be, it automatically sends a 422 error. No manual validation needed!

Good luck, Developer! Your commits are the proof of your progress.
