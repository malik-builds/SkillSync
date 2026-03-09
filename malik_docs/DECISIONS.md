# Architectural Decisions: SkillSync

## 01. Dynamic Skill Discovery vs. Static Database

**Decision**: Use LLM-powered dynamic market research instead of a pre-populated PostgreSQL or MongoDB skills table.

**Context**: 
Initially, we considered using a fixed database of job titles and their required technical skills. However, the tech landscape (especially AI/ML/Fullstack) moves too fast for a manual database to keep up.

**Rationale**:
1. **Scalability**: An LLM can "know" about niche or emerging titles (e.g., "AI Prompt Engineer") immediately, whereas a database requires constant manual updates.
2. **Contextual Awareness**: The LLM can adjust the "Must-Have" list based on the seniority or specific focus mentioned in the title (e.g., "Fullstack Developer (Fintech)" vs "Fullstack Developer (Gaming)").
3. **Reduced Maintenance**: No need for complex CRUD operations or web scrapers to keep the skills database updated.

**Trade-offs**:
- **Latency**: Adding an LLM call for research adds ~1-2 seconds to the request.
- **Cost**: Every new request incurs token costs for the research phase.
- **Consistency**: The same job title might return slightly different "Must-Have" lists on different runs.

---

## 02. Weighted Scoring Engine

**Decision**: Implement a Category-Based Weighted Scoring system.

**Rationale**:
A simple "Found Skills / Required Skills" ratio is misleading. In the real world, not having **Python** for a Data Science role is a deal-breaker, while not having **Public Speaking** is just a minor gap.

**Weights**:
- **Must-Have (Core)**: 1.0 (Critical)
- **Nice-to-Have (Supplementary)**: 0.5 (Value-Add)
- **Soft Skills**: 0.2 (Supporting)

---

## 03. GitHub as a Primary Source of Truth (Evidence-Based)

**Decision**: Prioritize GitHub portfolio analysis over literal resume text during the verification phase.

**Rationale**:
Resumes are promotional and often incomplete. A student's GitHub repositories, however, provide objective proof of their interests and capabilities.
1. **Evidence-Based Scoring**: If a candidate has a repository named `data-structures`, they are automatically credited with and verified for **Computer Science Fundamentals**, regardless of whether "Data Structures" appears on their resume.
2. **Language Dominance**: Significant language usage (>10% across the portfolio) is treated as verified expertise, overriding any resume omissions.
3. **Ontology Mapping**: By mapping specific GitHub evidence to broader market categories, we ensure that elite candidates are correctly identified even if their resume lacks HR-friendly keywords.

---

## 04. Weighted Heuristic Scoring (40/40/10/10)

**Decision**: Transition from a keyword-matching model to a 100-point Heuristic Weighted Schema.

**Rationale**:
A linear "Percentage of Skills" match is too simplistic for Senior-level talent. We need to value **Prestige**, **Evidence**, and **Depth**.

**The Weights**:
1. **GitHub Evidence (40%)**: Projects, languages, and repo names (e.g., `data-structures`) are objective proof of talent.
2. **Core Technical Skills (40%)**: Verified technical matching via the internal Ontology.
3. **Institutional Prestige (10%)**: Extra points for students from top-tier universities (e.g., Moratuwa, IIT) with high academic performance (GPA > 3.5).
4. **Soft Skills (10%)**: Extracted leadership and communication traits.

---

## 05. Deterministic Scoring (The Nuclear Option)

**Decision**: Rip the scoring logic out of the LLM prompt and implement it as a hard-coded Python function.

**Rationale**:
LLMs are creative language models, not calculators. When asked to "calculate 40% for GitHub", an LLM might hallucinate a `0` even if it sees 46 repositories.
1. **Mathematically Forced**: By using `if total_repos >= 10: score += 40`, we make it impossible for the system to ignore evidence.
2. **Set Comparison**: Technical matching is now a mathematical set comparison against an internal ontology, ensuring consistency.

---

---

## 07. Bias-Free Meritocracy (V1.0)

**Decision**: Abolish "University Prestige" scoring. Replace with "Degree Relevance".

**Rationale**:
Judging a candidate by the name of their university ("Moratuwa" vs "Unknown") is biased. 
1. **Degree Relevance (20 pts)**: We now scan for "Computer Science", "Engineering", "IT", or **"Math"** in the degree title. This rewards relevant STEM education regardless of the institution.
2. **Higher Bar for Evidence (40 pts)**: We raised the bar for max GitHub points from 10 to **20 repositories**. True seniority requires sustained "Proof of Work".
3. **Truth Override**: The GitHub report is the ultimate source of truth. If a candidate has >5 repos, the system executes a "Truth Override" to REMOVE "Version Control" and "Software Lifecycle" from missing gaps, assuming practical competence.
