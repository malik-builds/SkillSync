# Interview Prep Guide

## LangGraph State Machine
**What it is (plain English):** A framework for building stateful, multi-actor applications with LLMs. It lets you define a workflow as a graph where each node is a step (like parsing a resume) and edges dictate the flow of execution, passing a shared "state" dictionary between them.
**How it appears in SkillSync:** In `graph.py`, we use it to orchestrate the pipeline. It passes a `StudentState` dictionary from the `market_research` node -> `parse_resume` node -> `audit_github` node -> `analyze_gap` node, managing the flow systematically instead of one messy main function.
**Hostile interviewer question:** "Why bring in a whole graph framework just to run some functions in sequence? Isn't that overkill?"
**My answer (fill when I explain back):** 
**Readiness score:** /100

## Why DeepSeek via OpenAI SDK
**What it is (plain English):** DeepSeek provides an API compatible with OpenAI's format. You can use OpenAI's Python library but swap the `base_url` to DeepSeek's servers.
**How it appears in SkillSync:** In `services.py`, we initialize the OpenAI client but set `base_url="https://api.deepseek.com"`. This lets us use DeepSeek's powerful, cost-effective V3/R1 models without learning a new SDK.
**Hostile interviewer question:** "If you're using OpenAI's library, why not just use GPT-4? What specific benefit did DeepSeek give you here?"
**My answer (fill when I explain back):** 
**Readiness score:** /100

## Deterministic Scoring vs LLM Scoring 
**What it is (plain English):** LLM scoring is asking the AI to "rate this resume out of 100". Deterministic scoring is using hard-coded math rules (e.g., if repos > 20, score = 40) using data extracted by the AI.
**How it appears in SkillSync:** In `services.py`, `_calculate_deterministic_score` breaks down the exact math for GitHub PoW (40pts), Technical Depth (40pts), and Degree (20pts). We stopped letting the LLM guess scores because it hallucinates constraints.
**Hostile interviewer question:** "If you're using Python for all the scoring math, what is the AI actually doing in your pipeline?"
**My answer (fill when I explain back):** 
**Readiness score:** /100

## pdfplumber Spatial Y-Axis Parsing
**What it is (plain English):** Extracting text from PDFs based on where the words physically appear on the page (their X/Y coordinates) rather than the hidden, often randomized text stream inside the PDF file.
**How it appears in SkillSync:** In `services.py`, `extract_text` uses `pdfplumber` to pull `page.extract_words(y_tolerance=2)`. It groups words that share the exact same vertical plane into the same line. This fixes the multi-column resume bug where companies and roles were getting scrambled.
**Hostile interviewer question:** "Why spatial parsing? Doesn't PDF text extraction always just read top-to-bottom automatically?"
**My answer (fill when I explain back):** 
**Readiness score:** /100

## Beanie ODM
**What it is (plain English):** An Object-Document Mapper (ODM) for MongoDB, built on top of Motor (async MongoDB driver) and Pydantic. It lets you write Python classes to define your database schema.
**How it appears in SkillSync:** In `models.py`, `Student` and `Job` inherit from `beanie.Document`. This allows us to use async methods like `await job.insert()` or `await Student.find()`, getting strong typing without wrestling with raw dictionaries.
**Hostile interviewer question:** "Why Beanie and MongoDB? If you're matching students to jobs, wouldn't a relational database like PostgreSQL be better?"
**My answer (fill when I explain back):** 
**Readiness score:** /100

## SKILL_ONTOLOGY and Category Tiers
**What it is (plain English):** A structured dictionary that maps specific tools (React) to broader categories (Frontend Frameworks). Tiered categories score skills based on architectural complexity, preventing foundational skills from artificially maxing out the score.
**How it appears in SkillSync:** In `services.py`, `SKILL_ONTOLOGY` is grouped, and `CATEGORY_TIERS` assigns weights (Tier 1 = 5pts, Tier 3 = 10pts). To hit a 100% score, candidates must possess a Tier 3 "Pristine" skill (like Cloud/AI/DevOps) to prove they are truly senior.
**Hostile interviewer question:** "A developer with 10 years in Java but 0 years in AI is capped at 95% in your system. Is your system unfairly biased towards trendy tech?"
**My answer (fill when I explain back):** 
**Readiness score:** /100

## JWT Authentication
**What it is (plain English):** JSON Web Tokens are stateless authentication tokens. Instead of a database keeping track of "sessions", the server signs a payload containing user claims (like user ID + role) using a secret key. 
**How it appears in SkillSync:** In `auth/router.py`, upon login, we generate a JWT using `python-jose`. In `main.py`, the `Depends(get_current_user)` intercepts requests, cryptographically verifies the token, and extracts the user without a database round-trip for session lookup.
**Hostile interviewer question:** "JWTs are stateless, meaning you can't instantly invalidate them if a user logs out. How do you handle a compromised token in this architecture?"
**My answer (fill when I explain back):** 
**Readiness score:** /100

## Job Matching Algorithm
**What it is (plain English):** A pure Python script that mathematically compares a student's extracted skills against a job's requirements to generate a fit percentage.
**How it appears in SkillSync:** In `jobs/matching.py`, we use Python set operations (`req in student_skills`). Required skills are worth 1.0 points, nice-to-haves 0.5 points. The formula: `(weighted_score / total_possible_weight) * 100`. No AI is used here, ensuring 100% predictable outcomes.
**Hostile interviewer question:** "Why use pure Python sets instead of a vector database and cosine similarity for job matching? Isn't AI matching superior?"
**My answer (fill when I explain back):** 
**Readiness score:** /100

## Is your API secure?
**What it is (plain English):** A multi-layered defense strategy to protect endpoints from abuse, unauthorized access, and misconfiguration.
**How it appears in SkillSync:** I implemented five layers of security. JWT auth with bcrypt hashing protects all sensitive endpoints. File upload validation uses both extension checking and magic byte verification to prevent disguised malicious files. Rate limiting prevents API abuse and brute force attacks. Environment variable validation prevents silent misconfiguration failures. Error message sanitisation ensures internal implementation details are never exposed to clients. For production I would also add HTTPS enforcement and tighten CORS to specific domains.
**Hostile interviewer question:** "If JWT is stateless, how do you revoke a compromised token before it expires?"
**My answer (fill when I explain back):** 
**Readiness score:** /100

## What is a magic bytes check?
**What it is (plain English):** File extensions can be faked — anyone can rename malware.exe to document.pdf. Magic bytes are the first few bytes of a file that identify its true type — PDF files always start with %PDF, regardless of their extension.
**How it appears in SkillSync:** We use the `python-magic` library to read these bytes and verify the actual file type matches the claimed extension before passing it to our parsers.
**Hostile interviewer question:** "Why not just rely on the Content-Type header sent by the client browser during upload?"
**My answer (fill when I explain back):** 
**Readiness score:** /100

## What is rate limiting and why does it matter here?
**What it is (plain English):** Restricting how many requests a user or IP address can make in a given timeframe to prevent abuse, scraping, or brute-forcing.
**How it appears in SkillSync:** Each `/analyze` call costs real money — it makes DeepSeek API calls and GitHub API calls. Without rate limiting, a single malicious user could make thousands of requests and bankrupt the API budget in minutes. `slowapi` limits each IP to 10 requests per minute on `/analyze` and 5 per minute on `/login` to prevent both financial abuse and brute force attacks.
**Hostile interviewer question:** "IP-based rate limiting is easily bypassed with a VPN or rotating proxies. How would you handle a distributed attack?"
**My answer (fill when I explain back):** 
**Readiness score:** /100

## How did you get job data for SkillSync?
**What it is (plain English):** Data acquisition for the job matching algorithm.
**How it appears in SkillSync:** We scrape `topjobs.lk` with explicit academic permission. We only extract publicly visible job attributes — title, company, and skill requirements. We never store salary data, contact information, or anything personally identifiable. We check `robots.txt` programmatically before each scrape, identify our bot honestly in the `User-Agent` header, throttle requests to one per two seconds to avoid server load, and mark data as stale after 30 days. This approach respects both the legal permission we received and the ethical responsibility of responsible web scraping.
**Hostile interviewer question:** "Scraping is often a legal gray area. How do you guarantee your system stays compliant if TopJobs changes their terms tomorrow?"
**My answer (fill when I explain back):** 
**Readiness score:** /100

## Did you scrape without permission?
**What it is (plain English):** Legal/ethical compliance in data engineering.
**How it appears in SkillSync:** No. We reviewed topjobs.lk's terms and confirmed academic use of visible job attributes is permitted. We also implemented technical safeguards — `robots.txt` checking, honest bot identification, and request throttling — regardless of the permission, because responsible scraping is a professional standard.
**Hostile interviewer question:** "If you had permission, why not just ask them for an API instead of building a scraper?"
**My answer (fill when I explain back):** 
**Readiness score:** /100
