import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTZkMzI2OTM5NTc5YTUzMDU3MmQzYTkiLCJyb2xlIjoiY2xpZW50IiwiaWF0IjoxNzY5NjA0ODA5LCJleHAiOjE3NzAyMDk2MDl9.7GCEtZRDAxcV5OOmkWtWdsGWQAEL2CrunZcm2s4Y3hk"

def test_user_signin_with_correct_and_incorrect_credentials():
    signin_url = f"{BASE_URL}/api/auth/signin"
    headers_auth = {"Authorization": f"Bearer {AUTH_TOKEN}"}
    timeout = TIMEOUT

    # 1. Correct credentials (assuming email and password known for "client" role)
    correct_payload = {
        "email": "client@example.com",
        "password": "correctpassword"
    }
    try:
        response = requests.post(signin_url, json=correct_payload, timeout=timeout)
        assert response.status_code == 200, f"Expected 200 OK for correct creds, got {response.status_code}"
        json_resp = response.json()
        assert "token" in json_resp and isinstance(json_resp["token"], str) and len(json_resp["token"]) > 0, "JWT token missing or invalid"
    except requests.RequestException as e:
        assert False, f"Request failed for correct credentials: {e}"

    # 2. Incorrect password
    incorrect_password_payload = {
        "email": "client@example.com",
        "password": "wrongpassword"
    }
    try:
        response = requests.post(signin_url, json=incorrect_password_payload, timeout=timeout)
        assert response.status_code == 401, f"Expected 401 Unauthorized for incorrect password, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed for incorrect password: {e}"

    # 3. Non-existent user
    non_existent_user_payload = {
        "email": "nonexistentuser@example.com",
        "password": "anyPassword123"
    }
    try:
        response = requests.post(signin_url, json=non_existent_user_payload, timeout=timeout)
        assert response.status_code == 401, f"Expected 401 Unauthorized for non-existent user, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed for non-existent user: {e}"

    # 4. Admin access denial - attempt signin with an admin user's credentials expecting 403
    admin_payload = {
        "email": "admin@example.com",
        "password": "adminpassword"
    }
    try:
        response = requests.post(signin_url, json=admin_payload, timeout=timeout)
        assert response.status_code == 403, f"Expected 403 Forbidden for admin access denial, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed for admin access denial check: {e}"

test_user_signin_with_correct_and_incorrect_credentials()