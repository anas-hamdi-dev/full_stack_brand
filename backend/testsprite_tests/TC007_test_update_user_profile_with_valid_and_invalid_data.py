import requests

BASE_URL = "http://localhost:5000"
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTZkMzI2OTM5NTc5YTUzMDU3MmQzYTkiLCJyb2xlIjoiY2xpZW50IiwiaWF0IjoxNzY5NjA0ODA5LCJleHAiOjE3NzAyMDk2MDl9.7GCEtZRDAxcV5OOmkWtWdsGWQAEL2CrunZcm2s4Y3hk"
HEADERS = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}
TIMEOUT = 30

def test_update_user_profile_with_valid_and_invalid_data():
    original_profile = {}
    # Get current user info from /api/auth/me
    profile_get_url = f"{BASE_URL}/api/auth/me"
    profile_patch_url = f"{BASE_URL}/api/users/me"
    try:
        # GET current profile
        resp = requests.get(profile_get_url, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Failed to get current profile: {resp.text}"
        original_profile = resp.json()

        # 1) Valid update: update full_name and phone
        update_data_valid = {
            "full_name": "Updated Test User",
            "phone": "+21629123456"
        }
        resp_valid = requests.patch(profile_patch_url, json=update_data_valid, headers=HEADERS, timeout=TIMEOUT)
        assert resp_valid.status_code == 200, f"Valid update failed: {resp_valid.text}"
        updated_profile = resp_valid.json()
        # Check returned fields contain updated data
        assert updated_profile.get("full_name") == update_data_valid["full_name"], "full_name not updated correctly"
        assert updated_profile.get("phone") == update_data_valid["phone"], "phone not updated correctly"

        # 2) Invalid update: attempt to change role (not allowed)
        update_data_invalid_role = {
            "role": "admin"
        }
        resp_invalid_role = requests.patch(profile_patch_url, json=update_data_invalid_role, headers=HEADERS, timeout=TIMEOUT)
        assert resp_invalid_role.status_code == 403, f"Role change should be forbidden: {resp_invalid_role.text}"

        # 3) Invalid update: attempt to change brand_id (not allowed)
        update_data_invalid_brand = {
            "brand_id": "somebrandid123"
        }
        resp_invalid_brand = requests.patch(profile_patch_url, json=update_data_invalid_brand, headers=HEADERS, timeout=TIMEOUT)
        assert resp_invalid_brand.status_code == 403, f"brand_id change should be forbidden: {resp_invalid_brand.text}"

    finally:
        # Restore original profile full_name and phone if we changed them
        restore_data = {}
        if original_profile.get("full_name") and original_profile.get("full_name") != update_data_valid["full_name"]:
            restore_data["full_name"] = original_profile["full_name"]
        if original_profile.get("phone") and original_profile.get("phone") != update_data_valid["phone"]:
            restore_data["phone"] = original_profile["phone"]
        if restore_data:
            r = requests.patch(profile_patch_url, json=restore_data, headers=HEADERS, timeout=TIMEOUT)
            # No assertion on restore, best effort

test_update_user_profile_with_valid_and_invalid_data()
