import requests
import uuid

base_url = "http://localhost:5000"
signup_endpoint = f"{base_url}/api/auth/signup"
headers = {
    "Content-Type": "application/json"
}
timeout = 30

def test_user_signup_with_valid_and_invalid_data():
    created_user_emails = []
    try:
        # Valid data for client role
        valid_client = {
            "email": f"valid_client_{uuid.uuid4().hex[:8]}@example.com",
            "password": "password123",
            "full_name": "Valid Client",
            "phone": "1234567890",
            "role": "client"
        }
        resp = requests.post(signup_endpoint, json=valid_client, headers=headers, timeout=timeout)
        assert resp.status_code == 201, f"Valid client signup failed: {resp.text}"
        created_user_emails.append(valid_client["email"])

        # Valid data for brand_owner role
        valid_brand_owner = {
            "email": f"valid_brandowner_{uuid.uuid4().hex[:8]}@example.com",
            "password": "StrongPass456",
            "full_name": "Valid BrandOwner",
            "phone": "0987654321",
            "role": "brand_owner"
        }
        resp = requests.post(signup_endpoint, json=valid_brand_owner, headers=headers, timeout=timeout)
        assert resp.status_code == 201, f"Valid brand_owner signup failed: {resp.text}"
        created_user_emails.append(valid_brand_owner["email"])

        # Invalid data: missing fields (no email)
        missing_email = {
            "password": "password123",
            "full_name": "No Email User",
            "phone": "1234567890",
            "role": "client"
        }
        resp = requests.post(signup_endpoint, json=missing_email, headers=headers, timeout=timeout)
        assert resp.status_code == 400, "Signup should fail with missing email"

        # Invalid data: invalid email format
        invalid_email = {
            "email": "invalidemailformat",
            "password": "password123",
            "full_name": "Invalid Email User",
            "phone": "1234567890",
            "role": "client"
        }
        resp = requests.post(signup_endpoint, json=invalid_email, headers=headers, timeout=timeout)
        assert resp.status_code == 400, "Signup should fail with invalid email format"

        # Invalid data: short password (less than 6 characters)
        short_password = {
            "email": f"short_pass_{uuid.uuid4().hex[:8]}@example.com",
            "password": "123",
            "full_name": "Short Password User",
            "phone": "1234567890",
            "role": "client"
        }
        resp = requests.post(signup_endpoint, json=short_password, headers=headers, timeout=timeout)
        assert resp.status_code == 400, "Signup should fail with short password"

        # Duplicate user: reuse valid_client email (make a copy to avoid reference issues)
        duplicate_user = dict(valid_client)
        resp = requests.post(signup_endpoint, json=duplicate_user, headers=headers, timeout=timeout)
        assert resp.status_code == 409, "Signup should fail when user already exists"
    finally:
        # Cleanup is optional as no delete endpoint provided, skipping resource deletion
        pass

test_user_signup_with_valid_and_invalid_data()