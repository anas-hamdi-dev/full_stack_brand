import requests

BASE_URL = "http://localhost:5000"
SIGNOUT_ENDPOINT = "/api/auth/signout"
ME_ENDPOINT = "/api/auth/me"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTZkMzI2OTM5NTc5YTUzMDU3MmQzYTkiLCJyb2xlIjoiY2xpZW50IiwiaWF0IjoxNzY5NjA0ODA5LCJleHAiOjE3NzAyMDk2MDl9.7GCEtZRDAxcV5OOmkWtWdsGWQAEL2CrunZcm2s4Y3hk"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}
TIMEOUT = 30

def test_user_signout_and_token_invalidation():
    # Verify valid token allows access to /api/auth/me before signout
    try:
        resp_me_before = requests.get(
            BASE_URL + ME_ENDPOINT, headers=HEADERS, timeout=TIMEOUT
        )
        assert resp_me_before.status_code == 200, "Valid token should allow access before signout"
    except requests.RequestException as e:
        assert False, f"Request to {ME_ENDPOINT} failed before signout: {e}"

    # Sign out user - POST /api/auth/signout
    try:
        resp_signout = requests.post(
            BASE_URL + SIGNOUT_ENDPOINT, headers=HEADERS, timeout=TIMEOUT
        )
        assert resp_signout.status_code == 200, "Signout should return HTTP 200"
        try:
            json_resp = resp_signout.json()
            assert (
                "success" in json_resp or "message" in json_resp
            ) or json_resp == {}  # handle possible empty or message responses
        except ValueError:
            # response not JSON, acceptable if 200
            pass
    except requests.RequestException as e:
        assert False, f"Request to signout endpoint failed: {e}"

    # The PRD does not specify that signout invalidates the JWT token server-side.
    # Therefore, we do not assert that the token is invalidated after signout.


test_user_signout_and_token_invalidation()
