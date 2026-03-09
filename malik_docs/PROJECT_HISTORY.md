# SkillSync: Phase 1 to Phase 20 Master History

SkillSync started as a simple FastAPI layer to parse resumes and slowly evolved into a **Bias-Free Meritocracy Engine**—a modular, agentic graph specifically designed to evaluate engineering candidates accurately, without succumbing to institutional bias, layout traps, or AI hallucinations.

## Phase 1 -> 5: Foundation & Tools
- **Phase 1 (Foundation Setup)**: We initialized a robust `FastAPI` instance with `Beanie` and `MongoDB` to store `Student` profiles securely, establishing the standard CRUD endpoints.
- **Phase 2 (Agentic Tooling)**: Instead of a monolithic function, we built `services.py` encompassing three specific 'tools' (classes): `ResumeParserTool`, `MarketResearcherTool`, and `GapAnalysisTool`.
- **Phase 3-4 (LangGraph Orchestration)**: We adopted `LangGraph`, turning the pipeline into a directed state graph (`graph.py`). This allowed data to flow logically from Market Research -> Resume Parse -> GitHub Audit -> Gap Analysis.
- **Phase 5 (GitHub Fallback)**: We realized URLs might break or be missing. We implemented smart extraction and graceful fallbacks inside the GitHub Auditor to keep the pipeline alive.

## Phase 6 -> 11: The Sensor Upgrades (Dealing with Reality)
- **Phase 7 (Vision OCR Fallback)**: The realization that candidates submit images disguised as PDFs. We integrated DeepSeek vision capabilities to read what `pdfplumber` couldn't see.
- **Phase 8 (Layout-Aware ATS Auditing)**: Resumes aren't just text; they are design documents. Evaluating a 2-column layout vs a 1-column layout became entirely necessary for rendering feedback.
- **Phase 9-10 (Dynamic Market Auditor & Semantic Maps)**: Instead of assuming all "Fullstack Developers" need the same exact tech stack, we had the AI parse the job title and build a *dynamic* requirement context. To prevent string-matching failures (e.g. "Missing React" when the candidate has "Next.js"), we adopted semantic relationships.
- **Phase 11 (Complex Extraction Fixes)**: Handled edge cases regarding date formats and layout jank, increasing the fidelity of extracted JSON objects.

## Phase 12 -> 17: Stability & Advanced Logic
- **Phase 12 (Rich Profiling Structure)**: Moved from flat arrays to relational structures for experiences and projects (Nested dicts).
- **Phase 14-15 (Evidence-Based Scoring)**: Moved away from generic "Looks good" scores. Introduced "Weighted Heuristics"—the concept that a GitHub profile showing 50 Repos is stronger than a bullet point claiming "Advanced Technical Skills".
- **Phase 16 (Robust Error Handling)**: `ValueError` crashes from corrupted GPAs ("3.8/4.00" vs "3.8") and other data extraction typos were smoothed out.
- **Phase 17 (The NameError Regression)**: Fixed critical pipeline blocks when refactoring variables (e.g., `university_name` scopes).

## Phase 18 -> 20: The Architectural Override (Bias-Free Meritocracy)
- **Phase 18 (Deterministic Scoring & Spatial Parsers)**: AI is an author, not a calculator. We ripped mathematical operations (Scoring) out of the LLM prompt and placed it securely in `graph.py` to prevent "Hallucination Ceilings" (e.g. AI returning a 0 score for a student with 46 repos). We also dropped `layout=True` for a strict **Y-Axis Spatial Word Grouping** algorithm to perfectly preserve multi-column associations.
- **Phase 19 (Meritocracy Initialization)**: "Pedigree Bias" was abolished. Scoring was refactored to ignore university names entirely. Instead, points are explicitly awarded for **Degree Relevance** (e.g. STEM degrees).
- **Phase 20 (Master Architectural Override)**: The culmination of the project.
    - Added missing critical ontology maps (Bootstrap, PHP).
    - Hard-coded a **Truth Override**: If a candidate has >5 repos, the system mathematically flags "Version Control" and "Software Lifecycle" as VERIFIED, preventing illogical deductions.
    - Locked the scoring pipeline to `calculate_bias_free_score(state)` to unconditionally guarantee 100% calculation accuracy for Evidence, Depth, and Education.

## Next Steps
Welcome to Phase 21: **Authentication, Skill-Set Ceilings, and Production Polish.**
