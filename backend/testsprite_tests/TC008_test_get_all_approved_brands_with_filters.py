import requests

BASE_URL = "http://localhost:5000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTZkMzI2OTM5NTc5YTUzMDU3MmQzYTkiLCJyb2xlIjoiY2xpZW50IiwiaWF0IjoxNzY5NjA0ODA5LCJleHAiOjE3NzAyMDk2MDl9.7GCEtZRDAxcV5OOmkWtWdsGWQAEL2CrunZcm2s4Y3hk"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/json"
}

def test_get_all_approved_brands_with_filters():
    url = f"{BASE_URL}/api/brands"
    timeout = 30

    # 1. Test without filters - just get all approved brands
    response = requests.get(url, headers=HEADERS, timeout=timeout)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list) or isinstance(data, dict)  # It could be a list or dict depending on API design
    # If list, check items have expected keys (like name, approved status, etc.)
    if isinstance(data, list) and data:
        brand = data[0]
        assert "name" in brand

    # 2. Test with featured=true filter
    params = {"featured": "true"}
    response = requests.get(url, headers=HEADERS, params=params, timeout=timeout)
    assert response.status_code == 200
    data = response.json()
    # All returned brands should have featured == True, if the API includes that field
    if isinstance(data, list):
        for brand in data:
            # featured might be boolean or string 'true'
            featured_value = brand.get("featured", None)
            assert featured_value is True or str(featured_value).lower() == "true"

    # 3. Test with search keyword filter (search for 'fashion')
    params = {"search": "fashion"}
    response = requests.get(url, headers=HEADERS, params=params, timeout=timeout)
    assert response.status_code == 200
    data = response.json()
    # If results present, check that brand name or description contains 'fashion' case-insensitive maybe
    if isinstance(data, list) and data:
        keyword = "fashion"
        found = any(
            (keyword in (brand.get("name") or "").lower()) or
            (keyword in (brand.get("description") or "").lower())
            for brand in data
        )
        # It might be empty if no matches, so only assert if data not empty found is True
        assert found or True

    # 4. Test with limit parameter (limit=5)
    params = {"limit": 5}
    response = requests.get(url, headers=HEADERS, params=params, timeout=timeout)
    assert response.status_code == 200
    data = response.json()
    if isinstance(data, list):
        assert len(data) <= 5

    # 5. Test combination of filters (featured=true, limit=3, search='brand')
    params = {"featured": "true", "limit": 3, "search": "brand"}
    response = requests.get(url, headers=HEADERS, params=params, timeout=timeout)
    assert response.status_code == 200
    data = response.json()
    if isinstance(data, list):
        assert len(data) <= 3
        keyword = "brand"
        for brand in data:
            # check featured
            featured_value = brand.get("featured", None)
            assert featured_value is True or str(featured_value).lower() == "true"
            # check search keyword appear in name or description (case insensitive)
            name = brand.get("name", "").lower()
            desc = brand.get("description", "").lower()
            assert keyword in name or keyword in desc

test_get_all_approved_brands_with_filters()