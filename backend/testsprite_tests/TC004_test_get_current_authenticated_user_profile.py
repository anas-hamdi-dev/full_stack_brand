import requests

def test_get_current_authenticated_user_profile():
    base_url = "http://localhost:5000"
    endpoint = "/api/auth/me"
    url = f"{base_url}{endpoint}"
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTZkMzI2OTM5NTc5YTUzMDU3MmQzYTkiLCJyb2xlIjoiY2xpZW50IiwiaWF0IjoxNzY5NjA0ODA5LCJleHAiOjE3NzAyMDk2MDl9.7GCEtZRDAxcV5OOmkWtWdsGWQAEL2CrunZcm2s4Y3hk"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)
        assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"

        user_data = response.json()
        assert isinstance(user_data, dict), "Response body should be a JSON object"
        assert "email" in user_data, "User email not found in response"
        assert "role" in user_data, "User role not found in response"

        # Validate role is 'client'
        assert user_data.get("role") == "client", f"Expected role 'client' but got {user_data.get('role')}"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_current_authenticated_user_profile()