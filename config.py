import os

REQUIRED_ENV_VARS = [
    "MONGO_URL",
    "DEEPSEEK_API_KEY", 
    "SECRET_KEY",
    "GITHUB_TOKEN"
]

def validate_env():
    missing = []
    for var in REQUIRED_ENV_VARS:
        if not os.getenv(var):
            missing.append(var)
    if missing:
        raise RuntimeError(
            f"Missing required environment variables: {missing}"
            f"\nCheck your .env file against .env.example"
        )
