# SkillSync: Engineering Issue Log 🛠️

This document tracks every major technical hurdle, bug, and architectural pivot encountered during the development of the SkillSync Student Backend (Phase 1 to Phase 12).

---

## Phase 1 & 2: The Infrastructure Foundation

### **Issue 01: MongoDB Connectivity (SSL/IP Whitelist)**
*   **Symptom**: `ServerSelectionTimeoutError` when calling `database.init_db()`.
*   **Root Cause**: MongoDB Atlas default security blocks all IPs by default. Additionally, some Python environments require `certifi` for SSL verification.
*   **The Fix**: 
    1.  Added `0.0.0.0/0` to Atlas IP Whitelist (for development).
    2.  Installed `certifi` and updated the connection string to include `tlsCAFile`.
    3.  Created a `lifespan` event in `main.py` to handle the async connection properly.

---

## Phase 3 & 4: LangGraph & LLM Pivots

### **Issue 02: Gemini API Unreliability**
*   **Symptom**: `InternalServerError (500)` and rate-limit issues when parsing resumes.
*   **Root Cause**: Gemini's structured output (JSON mode) was inconsistent at the time of development.
*   **The Fix**: **Architectural Pivot** to **DeepSeek-V3** via the OpenAI SDK. DeepSeek provided faster, native JSON mode support and better technical reasoning for resume parsing.

### **Issue 03: Profile URLs vs Repo URLs**
*   **Symptom**: GitHub Auditor would crash when given `https://github.com/username` instead of `https://github.com/user/repo`.
*   **Root Cause**: `PyGithub` expects a full repository path for most "Deep Audit" tools.
*   **The Fix**: Implemented **Multi-Repo Analytics**. If a profile URL is detected, the auditor now fetches *all* public repositories, aggregates stats (languages/stars), and picks the top repo for a deep-dive.

---

## Phase 5 to 7: The "Invisible Text" Challenge

### **Issue 04: Scanned PDF Failure**
*   **Symptom**: `pypdf` returns an empty string or `Could not extract text` error.
*   **Root Cause**: Scanned resumes (images saved as PDFs) have no text layer.
*   **The Fix**: Implemented an **AI Vision Fallback** using Gemini 2.0 Flash's multimodal capabilities to "see" and transcribe the image when traditional extraction failed. (Note: Later removed to focus on DeepSeek/PDFPlumber).

---

## Phase 8 & 9: Layout Integrity

### **Issue 05: Scrambled Columns (The "Layout" Bug)**
*   **Symptom**: Education headers appearing inside the Experience section; sidebar text mixed into the main column.
*   **Root Cause**: `pypdf` reads text blocks in the order they appear in the file's binary stream, which is often not the visual reading order.
*   **The Fix**: Migrated from `pypdf` to **`pdfplumber`** with `layout=True`. This tool respects horizontal/vertical coordinates, preserving the visual structure of multi-column resumes.

---

## Phase 10 to 12: Semantic Accuracy & Persistence

### **Issue 06: The "Score 0" Bug (String Matching Failure)**
*   **Symptom**: A candidate with "React" experience gets a score of 0 for a "Frontend Developer" role.
*   **Root Cause**: The scoring engine was using exact string matching (`s.lower() == req.lower()`).
*   **The Fix**: Implemented **Semantic Mapping**. A secondary AI check (DeepSeek) now confirms if a student's skill is a "subset" or "synonym" of a market requirement.

### Issue 15: NameError in Graph Node (`status` undefined)
*   **Symptom**: `500 Internal Server Error` during `/analyze` request.
*   **Root Cause**: During the Phase 20 Architectural Override, the line calculating the `status` variable was accidentally overwritten by the new scoring logic, while the variable was still referenced in the return statement.
*   **The Fix**: Restored the `status` variable calculation in `graph.py`. 
### Issue 09: Elite Candidate Score Failure (The "HR Gap")
*   **Symptom**: Candidates with significant GitHub activity and niche role histories (e.g., 'Founding Member') were receiving failing scores.
*   **Root Cause**: 
    1.  Scoring relied on literal string keyword matching.
    2.  Resume extraction was losing company names in complex layouts.
    3.  The system ignored rich evidence in the `github_report` (repo names, topics).
*   **The Fix**: 
    1.  Implemented **Evidence-Based Scoring** (Verification Loop) to scan GitHub for missing resume skills.
    2.  Added a **Skill Ontology** for category mapping (e.g., 'React' satisfies 'Web Development').
### Issue 12: Regression NameError (University Name)
*   **Symptom**: System crashed with a 500 error and a `NameError: name 'university_name' is not defined`.
*   **Root Cause**: During the Phase 16 refactor for GPA parsing, the line defining `university_name` was accidentally deleted while the variable was still referenced in the heuristic logic.
*   **The Fix**: Restored the variable definition. Created `verify_scoring.py` as a standalone unit test to validate the scoring engine offline. This prevents logic regressions by allowing developers to "run their own tests" before deployment.

### **Issue 07: Resume Omission (The "Broken Trust" Problem)**
*   **Symptom**: High-quality candidates (with many GitHub projects) were getting low scores because they forgot to list skills on their resume.
*   **Root Cause**: The system relied 100% on the resume as the source of truth.
*   **The Fix**: Integrated **GitHub as a Source of Truth**. The scoring engine now automatically verifies and "injects" missing skills into the profile if they are found in the student's top GitHub languages or repository history.

### **Issue 08: MongoDB Duplicate Key Error**
*   **Symptom**: `pymongo.errors.DuplicateKeyError: E11000` noticed in terminal logs during repeated analysis.
*   **Root Cause**: Attempting to `.insert()` a student that already exists with the same `_id` or unique field during a re-run.
*   **The Fix**: Switched to `.save()` (upsert) logic or added checks to delete existing records before re-analyzing, ensuring a clean state for every run.

---

## Summary of Architectural Evolution

| Phase | Core Focus | Biggest Technical Win |
| :--- | :--- | :--- |
| **1-2** | CRUD | Async Database Initialization (Beanie). |
| **3-4** | Intelligence | DeepSeek Integration & Multi-Repo Analytics. |
| **5-7** | Extraction | Layout-Aware Parsing (`pdfplumber`). |
| **10-12** | Fairness | Semantic Matching & GitHub-Verified Skills. |
| **12+** | Structure | Nested Pydantic Models for Type Safety. |

---
*End of Issue Log*
