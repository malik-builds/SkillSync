# Knowledge Gaps Tracker

## Gap: LangGraph State Passing Deep Dive
**Why it matters for interviews:** LangGraph is the backbone of the entire backend. If asked, "How exactly does the `StudentState` dict move between nodes asynchronously?", you must be able to explain the `graph.app.ainvoke()` and node execution order.
**20-minute fix:** Review `graph.py`, specifically how the state dictionary is defined and updated. 
**Status:** Open

## Gap: JWT Token Mechanics 
**Why it matters for interviews:** JWT is a staple. If asked, "What is technically inside the token string when you decode it?", "How do you revoke a JWT?", you need exact answers.
**20-minute fix:** Review `auth/utils.py` and print out the payload dict before it gets encoded. 
**Status:** Open

## Gap: Beanie (MongoDB) Event Loops
**Why it matters for interviews:** Asynchronous DB calls are crucial for FastAPI scales. "Why did you use `await Student.find().to_list()` instead of `.find()`?" 
**20-minute fix:** Read Beanie ODM async operations documentation and review `jobs/router.py`.
**Status:** Open

## Gap: PyPDF Spatial Layout vs Fallbacks
**Why it matters for interviews:** Resume parsing relies entirely on `extract_words(y_tolerance=2)`. Interviewers will ask: "What happens if a student uploads an image inside a PDF instead of text?"
**20-minute fix:** Walk through the fallback mechanism involving DeepSeek Vision OCR in our previous design planning.
**Status:** Open

## Gap: The Mathematical Constraint in Matching
**Why it matters for interviews:** Python Set operations (`req in student_skills`) are O(1) time complexity. Why did we weight nice_to_have at 0.5?
**20-minute fix:** Review `jobs/matching.py` and calculate a dummy test case by hand.
**Status:** Open
