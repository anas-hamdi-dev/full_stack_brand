import requests

BASE_URL = "http://localhost:5000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTZkMzI2OTM5NTc5YTUzMDU3MmQzYTkiLCJyb2xlIjoiY2xpZW50IiwiaWF0IjoxNzY5NjA0ODA5LCJleHAiOjE3NzAyMDk2MDl9.7GCEtZRDAxcV5OOmkWtWdsGWQAEL2CrunZcm2s4Y3hk"

def test_get_featured_brands_list():
    url = f"{BASE_URL}/api/brands/featured"
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # According to PRD, response should be a list of featured brands
    assert isinstance(data, list), "Response JSON should be a list of brands"

    # Ensure every brand in the list is featured
    for brand in data:
        assert isinstance(brand, dict), "Brand item is not a dictionary"
        assert "featured" in brand, "Brand does not contain 'featured' field"
        assert brand["featured"] is True, f"Brand is not featured: {brand}"

        # If 'approved' field present, check it is True
        if "approved" in brand:
            assert brand["approved"] is True, f"Brand is not approved: {brand}"

test_get_featured_brands_list()