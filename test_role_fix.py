import requests
import sys

BASE_URL = "http://localhost:8000"

def test_role_validation():
    print("Testing Role Validation...")
    
    # 1. Create a Student user
    signup_payload = {
        "fullName": "Student Test",
        "email": "student_test_validation@example.com",
        "password": "password123",
        "role": "student",
        "termsAccepted": True
    }
    print(f"Signing up as student: {signup_payload['email']}")
    requests.post(f"{BASE_URL}/auth/signup", json=signup_payload)
    
    # 2. Try to log in as University (Wrong Role)
    signin_payload_wrong = {
        "email": "student_test_validation@example.com",
        "password": "password123",
        "role": "university"
    }
    print(f"Attempting login with WRONG role: university")
    resp_wrong = requests.post(f"{BASE_URL}/auth/signin", json=signin_payload_wrong)
    
    if resp_wrong.status_code == 403:
        print("✅ SUCCESS: Backend correctly rejected wrong role with 403.")
        print(f"Error Message: {resp_wrong.json().get('detail')}")
    else:
        print(f"❌ FAILED: Backend should have returned 403, but got {resp_wrong.status_code}")
        print(resp_wrong.text)
        sys.exit(1)

    # 3. Try to log in as Student (Correct Role)
    signin_payload_correct = {
        "email": "student_test_validation@example.com",
        "password": "password123",
        "role": "student"
    }
    print(f"Attempting login with CORRECT role: student")
    resp_correct = requests.post(f"{BASE_URL}/auth/signin", json=signin_payload_correct)
    
    if resp_correct.status_code == 200:
        print("✅ SUCCESS: Backend correctly allowed login with correct role.")
    else:
        print(f"❌ FAILED: Backend should have allowed login, but got {resp_correct.status_code}")
        print(resp_correct.text)
        sys.exit(1)

if __name__ == "__main__":
    try:
        test_role_validation()
    except Exception as e:
        print(f"Error connecting to backend: {e}")
