import requests
import uuid

BASE_URL = "http://localhost:5000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTZkMzI2OTM5NTc5YTUzMDU3MmQzYTkiLCJyb2xlIjoiY2xpZW50IiwiaWF0IjoxNzY5NjA0ODA5LCJleHAiOjE3NzAyMDk2MDl9.7GCEtZRDAxcV5OOmkWtWdsGWQAEL2CrunZcm2s4Y3hk"


def test_create_brand_with_unique_name_and_owner_restriction():
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    brand_endpoint = f"{BASE_URL}/api/brands"

    # Generate a unique brand name to avoid conflicts
    unique_brand_name = f"UniqueBrand-{uuid.uuid4()}"

    created_brand_id = None

    # Step 1: Create a brand with a unique name - should fail with 403 because of role restriction
    payload = {
        "name": unique_brand_name,
        "description": "Test brand description",
        "logo_url": "http://example.com/logo.png",
        "location": "Tunis",
        "website": "http://uniquebrand.example.com",
        "instagram": "uniquebrand_insta",
        "facebook": "uniquebrand_fb",
        "phone": "+21612345678",
        "email": "contact@uniquebrand.example.com"
    }

    try:
        response = requests.post(brand_endpoint, json=payload, headers=headers, timeout=30)
        assert response.status_code == 403, f"Expected 403 Forbidden due to role restriction, got {response.status_code}"

        # Since creation is forbidden, no further attempts are valid, just end here.

    finally:
        # No brand will be created, so no cleanup needed
        pass


test_create_brand_with_unique_name_and_owner_restriction()
