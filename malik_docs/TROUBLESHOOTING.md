# SkillSync: Troubleshooting & Configuration Report

This document explains the issues encountered during setup, why they happened, and how the current fixes work.

---

## 1. Gemini API Error: `No API_KEY found`

### **What went wrong?**
You saw the error `No API_KEY or ADC found` and the response returned a "partial" status with an empty gap report.

### **The "Why":**
1.  **Missing Key**: Your `.env` file currently only contains `MONGO_URL`. It does not have the `GOOGLE_API_KEY` required to talk to Gemini.
2.  **Initialization Timing**: In `main.py`, `load_dotenv()` was being called inside the `lifespan` function (startup), but `services.py` was being imported at the top. This meant `services.py` tried to read the API key *before* the environment variables were loaded.

### **The Fix:**
- **Add the Key**: Add `GOOGLE_API_KEY=your_key_here` to your `.env`.
- **Pre-emptive Loading**: I've moved `load_dotenv()` to the top of `main.py` and added a fallback check in `services.py`.

---

## 2. MongoDB SSL Error: `handshake failed`

### **What went wrong?**
Earlier, you saw a `ServerSelectionTimeoutError` with an SSL handshake failure.

### **The "Why":**
- **IP Whitelisting**: MongoDB Atlas blocks all connections unless the IP address is allowed.
- **Certificate Chain**: Python on macOS sometimes needs help finding "Root Certificates" to verify the server.

### **The Fix:**
- **Network Access**: Add your IP to Atlas "Network Access."
- **Certifi**: I've added the `certifi` package to provide reliable root certificates for the SSL process.

---

## 3. GitHub Auditor: "Next Steps"

### **What went wrong?**
The GitHub report currently says "pending_manual_verification."

### **The "Why":**
Scraping a full GitHub repository requires handling authentication and iterating through many files, which we haven't implemented yet.

### **How to fix it:**
For Phase 3, we will implement:
1.  **GitHub API Integration**: Using `PyGithub` to fetch source code content.
2.  **LLM Reasoning**: Passing code samples to Gemini to judge "Code Quality" based on your Prime Directive (Design Patterns, Plagiarism check).

---

## 4. Gemini 404 error: `models/gemini-1.5-flash not found`

### **What went wrong?**
You saw an error: `404 models/gemini-1.5-flash is not found`.

### **The "Why":**
The Google Generative AI SDK sometimes has issues with specific model strings depending on the API version it defaults to. Even though `gemini-1.5-flash` is a standard name, some environments or SDK versions require the "latest" suffix or a slightly different identifier.

### **The Fix:**
I have updated the code to use **`gemini-2.0-flash`** and removed all legacy `genai.configure` calls. The app now strictly uses the `genai.Client` pattern as required by the new official SDK.


---

## 5. Gemini 429 Error: `RESOURCE_EXHAUSTED`

### **What went wrong?**
You saw an error: `429 RESOURCE_EXHAUSTED`.

### **The "Why":**
You have hit the **Rate Limits** of the Gemini API Free Tier. The Free Tier has limits on:
1.  **Requests Per Minute (RPM)**: How many times you can call the API in 60 seconds.
2.  **Requests Per Day (RPD)**: Total calls allowed in 24 hours.
3.  **Tokens Per Minute (TPM)**: Total volume of text you can process.

### **The Fix / How to increase it:**
1.  **Wait and Retry**: The error message usually tells you how long to wait (e.g., "Please retry in 49s").
2.  **Switch to "Pay-as-you-go"**: Head to the [Google AI Studio Settings](https://aistudio.google.com/app/billing) and attach a billing account.
    - **Note**: Gemini 2.0 Flash is extremely cheap, and there is still a generous "free tier within the paid plan" for many use cases.
3.  **Implement Retries**: I have added a basic retry logic to the code to handle these transient blocks automatically.

---

## 6. GitHub Auditor: `Invalid GitHub URL`

### **What went wrong?**
You saw an error: `"error": "Invalid GitHub URL"` in your `github_report` even though you provided `https://github.com/malik-builds`.

### **The "Why":**
1.  **Format Mismatch**: The current auditor expects a specific **repository** link (e.g., `github.com/owner/repo`). It uses a regex that looks for two parts after the domain. When you provide a **profile** link (`github.com/owner`), the regex fails to find the second part (the repo name).
2.  **Missing Fallback**: Even though the resume parser extracted a GitHub link from your resume, the orchestration was only looking at the query parameter you passed in the URL. If the query parameter failed, it didn't "fall back" to the link in the resume.

### **The Fix:**
1.  **Robust Regex**: I'm updating the regex to be more flexible, allowing it to at least identify the owner if the repo is missing.
2.  **Smart Orchestration**: I'm updating `graph.py` to check the `extracted_data` (from the resume) if the initial `github_url` is invalid or missing.
3.  **Profile Handing**: If a profile link is provided, we will eventually fetch the most popular/recent repo, but for now, we will provide a clearer message or fallback to the resume-extracted specific project if available.

---

## Conclusion
...
