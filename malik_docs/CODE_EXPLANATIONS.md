# Code Explanations Guide for Interviews

This document contains key code snippets from the SkillSync backend along with interview-ready explanations of what they do and why they were built this way. Use this to prepare for technical interviews and technical deep-dives into your code.

---

## 1. JWT Token Creation (`auth/utils.py`)

```python
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

**WHAT THIS DOES:** 
This function generates a JSON Web Token (JWT). It takes a data dictionary (like `{"sub": "user@email.com"}`), adds an expiration timestamp (`exp`), and mathematically signs the payload using a secret key only the server knows. 

**Interview Context:** Because it's cryptographically signed, the server inherently trusts the token when it's sent back by the client on future requests. This makes our API **stateless**—we don't need to look up a session ID in MongoDB every time a user makes a request. We just decrypt and verify the token.

---

## 2. Password Hashing (`auth/utils.py`)

```python
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)
```

**WHAT THIS DOES:** 
This uses `passlib` with the `bcrypt` algorithm to convert a plain text password (like "password123") into an irreversible, randomized string. 

**Interview Context:** We hash passwords because if our MongoDB is ever compromised, attackers only get the hashes, not the real passwords. `Bcrypt` specifically adds a "salt" (random data) to each password before hashing to prevent rainbow table attacks, making it cryptographically secure.

---

## 3. FastAPI Dependency Injection (`auth/dependencies.py`)

```python
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    payload = decode_access_token(token)
    email: str = payload.get("sub")
    user = await User.find_one(User.email == email)
    return user
```

**WHAT THIS DOES:** 
This function acts as a security checkpoint for our API routes. It intercepts the incoming HTTP request, grabs the "Bearer Token" from the headers, verifies it using our `SECRET_KEY`, extracts the user's email, and fetches their actual `User` object from MongoDB.

**Interview Context:** The `Depends()` syntax is FastAPI's Dependency Injection system. It allows us to just write `(current_user: User = Depends(get_current_user))` in any router definition, and FastAPI automatically runs this security check before executing the route's logic. This ensures DRY (Don't Repeat Yourself) code and solid security boundaries.

---

## 4. Pure Python Job Matching Algorithm (`jobs/matching.py`)

```python
def calculate_match(student_skills: List[str], job: Job) -> MatchResult:
    # ... setup and lowercase skills ...
    for req in req_skills_lower:
        if req in student_skills_lower:
            weighted_score += 1.0
            matched_skills.append(req)
            
    for nice in nice_skills_lower:
        if nice in student_skills_lower:
            weighted_score += 0.5
            matched_skills.append(nice)
            
    match_percentage = (weighted_score / total_possible_weight) * 100
    # ... return results ...
```

**WHAT THIS DOES:** 
This is a deterministic, high-speed matching algorithm. It takes the student's skills and the job's skills and converts them to lowercase Python Sets. It iterates through the job's requirements, awarding `1.0` points for core skills and `0.5` points for nice-to-haves. 

**Interview Context:** We chose pure Python Set operations (which are $O(1)$ time complexity for lookups) instead of an AI LLM prompt because matching needs to be mathematically perfect, lightning-fast, and completely independent of AI hallucination limits or API costs.

---

## 5. Beanie ODM Architecture (`jobs/models.py`)

```python
class Job(Document):
    title: str
    company: str
    required_skills: List[str]
    # ...
```

**WHAT THIS DOES:** 
This defines exactly what a "Job" looks like in our database. By inheriting from Beanie's `Document` (which inherently inherits from Pydantic's `BaseModel`), we get two things at once: strict data validation and Async MongoDB database methods. 

**Interview Context:** Unlike a standard Pydantic BaseModel which is just for API data validation, a Beanie Document acts as an Object-Document Mapper (ODM). It gives us methods like `await Job.find()`, directly translating Python Objects to and from MongoDB collections safely.

---

## 6. Tiered Skill Ceilings (`services.py`)

```python
# In calculate_deterministic_score
tier = CATEGORY_TIERS.get(category, 1)
if tier == 1: tech_points += 5
elif tier == 2: tech_points += 8
elif tier == 3: tech_points += 10; has_pristine = True

# In graph.py Soft-Cap
if not has_pristine and repos < 30 and final_score > 95:
    final_score = 95
```

**WHAT THIS DOES:** 
This creates technical depth multipliers. We give 5 points for foundational skills (HTML) and 10 points for pristine architecture skills (Cloud/AI). We enforce a mathematical soft-cap at 95% in `graph.py` unless the candidate possesses a Tier 3 `has_pristine` skill. 

**Interview Context:** We did this to "Raise the Skill Ceiling". Without this, basic Junior developers were hitting 100% scores too easily. This guarantees that only Staff/Principal level developers (or students who demonstrate massive depth) breach the 95% barrier, making the scoring system a true meritocracy.

---

## 7. The Ethical Scraper Core (`scrapers/topjobs_scraper.py`)

```python
async def check_robots_txt() -> bool:
    resp = await client.get("https://www.topjobs.lk/robots.txt", headers=HEADERS)
    return "Disallow: /" not in resp.text

# Inside main scraper
is_allowed = await check_robots_txt()
if not is_allowed: return []
await asyncio.sleep(REQUEST_DELAY) # 2 seconds
```

**WHAT THIS DOES:** 
This module leverages `httpx` (for standard async non-blocking HTTP) to scrape data. Crucially, before it does *anything*, it dynamically fetches the `robots.txt` file of the target to ensure scraping is permitted. It also hard-codes a `REQUEST_DELAY` (2 seconds) using `asyncio.sleep` between calls, and clearly identifies itself in the HTTP `User-Agent` header.

**Interview Context:** Proving that you built safeguards (rate delays, user-agent honesty, robots.txt compliance) before extracting data demonstrates senior-level maturity and legal awareness, distinguishing you from junior devs who just spam web requests irresponsibly.

---

## 8. The Hybrid DB Seeder (`scrapers/seed_from_topjobs.py`)

```python
existing = await Job.find_one(Job.title == title, Job.company == company)
if existing:
    existed_count += 1
else:
    job = Job(**job_data)
    await job.insert()
```

**WHAT THIS DOES:** 
This connects our external scraper data with our static, manually written job data. It deduplicates them in memory, checks the live MongoDB to see if either already exists, and safely `inserts()` only the net-new records.

**Interview Context:** This is a classic ETL (Extract, Transform, Load) pattern. It prevents database bloat on repeated script runs (this concept is called "idempotency") and guarantees a baseline quality of data while still injecting real-world dynamic data.

---

## 9. API Scraper Trigger with Rate Limits (`jobs/router.py`)

```python
@router.post("/scrape")
@limiter.limit("1/hour")
async def scrape_jobs_endpoint(request: Request, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin permissions required")
```

**WHAT THIS DOES:** 
This endpoint exposes the scraper to the frontend but locks it behind two huge walls: 1) JWT Role-Based Access Control requiring `"admin"`. 2) Strict rate-limiting using `slowapi` to allow only 1 request per hour.

**Interview Context:** Internal tools and admin endpoints are a major vector for data breaches and server crashing. Putting a scraper behind an auth-wall and an aggressive rate limit proves you understand defensive, safety-first architecture.

---

## 10. File Upload Validation & Magic Bytes (`main.py`)

```python
# Magic bytes check
mime = magic.from_buffer(content, mime=True)
if ext == ".pdf" and mime != "application/pdf":
    raise HTTPException(status_code=415, detail="File content does not match file extension")
```

**WHAT THIS DOES:** 
This performs deep inspection of uploaded resumes. Aside from checking the file size limit and the text extension (e.g., ".pdf"), it reads the actual binary header (the "magic bytes" at the start of the file) using `python-magic`. 

**Interview Context:** File extensions can easily be faked (e.g., renaming `virus.exe` to `resume.pdf`). Magic bytes are the first few bytes of a file that identify its true type—PDF files always start with `%PDF-`. Validating this ensures our servers aren't tricked into storing or processing malicious payloads.

---

## 11. Security Headers (`main.py`)

```python
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response
```

**WHAT THIS DOES:** 
This middleware intercepts every outgoing HTTP response and injects specialized security headers into them. 

**Interview Context:** These headers instruct the user's browser to activate built-in defenses. `nosniff` prevents MIME-sniffing attacks, `DENY` prevents Clickjacking by disallowing our site to be loaded inside an attacker's iframe, and the `XSS-Protection` header adds a layer of defense against Cross-Site Scripting.

---

## 12. Startup Environment Validation (`config.py` & `main.py`)

```python
def validate_env():
    missing = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]
    if missing:
        raise RuntimeError(f"Missing required environment variables: {missing}")

# Inside lifespan in main.py
@asynccontextmanager
async def lifespan(app: FastAPI):
    config.validate_env()
    client = await database.init_db()
    # ...
```

**WHAT THIS DOES:** 
This runs during the FastAPI `@asynccontextmanager lifespan` block, right as the server spins up. It checks `os.getenv` for all critical variables (`MONGO_URL`, keys, etc.) and intentionally crashes the application if any are missing.

**Interview Context:** Silent failures in production deployments are catastrophic. This pattern enforces the "Crash Early, Crash Fast" methodology. It forces a deployment pipeline to fail immediately if the cloud environment is misconfigured, rather than failing randomly hours later when a user attempts an action that requires that API key.

---

## 13. LangGraph Orchestration Pipeline (`graph.py`)

```python
# Define nodes
workflow.add_node("parse_resume", parse_resume_node)
workflow.add_node("audit_github", audit_github_node)
workflow.add_node("market_research", market_research_node)
workflow.add_node("analyze_gap", analyze_gap_node)

# Define edges (Flow of execution)
workflow.add_edge("parse_resume", "audit_github")
workflow.add_edge("audit_github", "market_research")
workflow.add_edge("market_research", "analyze_gap")
workflow.set_finish_point("analyze_gap")
```

**WHAT THIS DOES:** 
This uses LangGraph (`StateGraph`) to orchestrate our AI pipeline. A single `StudentState` dictionary is passed sequentially from parsing the PDF -> auditing GitHub -> researching the job market -> calculating the final gap score.

**Interview Context:** Hardcoding 4 complex async AI functions into one massive REST endpoint is an anti-pattern (creates unmaintainable, monolithic code). LangChain's graph architecture decouples the tools. It gives us a state-machine where we can inject loops, checkpoints, or parallel execution easily in the future without rewriting the core logic.

---

## 14. DeepSeek API / AI Market Auditor (`services.py`)

```python
class MarketResearcherTool:
    def __init__(self):
        api_key = get_api_key("DEEPSEEK_API_KEY")
        self.client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")
        self.model_id = "deepseek-chat"
```

**WHAT THIS DOES:** 
It initializes our AI driver. Notice we are using the official `OpenAI` Python SDK, but we swap out the `base_url` to point at DeepSeek's servers.

**Interview Context:** DeepSeek exposes an API that is 100% compliant with OpenAI's strict JSON schema. This allowed us to build our entire agent using standardized OpenAI tooling, but leverage DeepSeek V3/R1 models which are massively cheaper and faster. If DeepSeek goes down, we can revert to `gpt-4o` simply by deleting the `base_url` line.

---

## 15. pdfplumber Spatial Y-Axis Parsing (`services.py`)

```python
with pdfplumber.open(file_stream) as pdf:
    for page in pdf.pages:
        words = page.extract_words(x_tolerance=3, y_tolerance=2)
        # Groups words based on exact horizontal and vertical pixel planes
```

**WHAT THIS DOES:** 
Extracts text from PDFs based on where the words visually appear on the page (their X/Y pixel coordinates) rather than relying on the invisible, often corrupted text stream encoded inside the PDF document structure.

**Interview Context:** Resumes are notorious for complex two-column layouts. Standard parsers read left-to-right, scrambling columns together (e.g., reading half a job description, jumping across to the right column's skills list, then jumping back). By grouping words with a tight `y_tolerance=2`, we force the parser to read horizontally line-by-line exactly as a human sees it, completely eliminating the column-scrambling bug.

---

## 16. Deterministic vs Generative Scoring Math (`services.py`)

```python
# 1. PILLAR 1: PROOF OF WORK (40 Pts)
if total_repos >= 20: gh_points = 40
elif total_repos >= 5: gh_points = 20

# 3. PILLAR 3: DEGREE RELEVANCE (20 Pts)
if any(k in degree_title for k in ["computer science", "it", "engineering", "math"]):
    edu_points = 20
```

**WHAT THIS DOES:** 
Instead of prompting an LLM to "score this resume out of 100", we extract the raw text (the degree name, the number of GitHub repos) and use pure hard-coded Python math to assign points.

**Interview Context:** LLMs hallucinate math. They are generative, not logical. If you ask an LLM to distribute 100 points, it will often give 105 points, or penalize candidates for arbitrary reasons. By migrating to a "Deterministic Scoring Engine," we decoupled extraction from calculation. The AI *extracts* the facts, but our Python code *calculates* the bias-free meritocracy score.

---

## Testing the Application

### Testing the TopJobs Scraper
1. Start your local server: `./venv/bin/uvicorn main:app --reload`
2. Open **Postman** (or curl).
3. First, log in as an admin to get a token:
   - `POST http://127.0.0.1:8000/auth/login`
   - Use Form Data: `username = admin@example.com`, `password = yourpassword` (You must create this specific user via `/auth/signup` first, specifying `role: admin`).
   - Copy the `"access_token"` from the response.
4. Trigger the scraper endpoint:
   - `POST http://127.0.0.1:8000/jobs/scrape`
   - Go to Authorization -> Bearer Token -> Paste your token.
   - Send the request. Check your terminal output. You should see `Scraped job 1/20: [Title] at [Company]`. The JSON response will confirm how many were fetched and saved.
   - Note: This is rate-limited to 1 request per hour. To test multiple times, you must temporarily remove the `@limiter.limit` decorator.

### Testing the Job Matching Logic
1. Ensure the server is running and jobs are in the DB (Run the `/jobs/scrape` endpoint or simply type `./venv/bin/python3 seed_jobs.py` in your terminal to instantly populate the DB with 10 Sri Lankan tech jobs).
2. Fetch an existing student ID from your database. (If you don't have one, `POST` a dummy student to `/students` with an array of `"skills": ["Java", "Docker", "Git"]` and copy its `"id"` string).
3. Get a token (You can be any role for this, even `"student"`):
   - `POST http://127.0.0.1:8000/auth/login` (Standard login)
4. Trigger the matching engine:
   - `GET http://127.0.0.1:8000/jobs/matches/<your_student_id>`
   - Use Authorization -> Bearer Token.
   - View the JSON response. You will see a list of jobs sorted strictly from highest `match_percentage` to lowest, along with a list of `matched_skills` (what the student proved they had) and `missing_skills` (what they need to learn).
