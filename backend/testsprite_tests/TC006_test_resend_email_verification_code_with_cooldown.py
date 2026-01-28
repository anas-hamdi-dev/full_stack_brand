import requests
import time

BASE_URL = "http://localhost:5000"
EMAIL = "testresend@example.com"


def test_resend_email_verification_code_with_cooldown():
    url = f"{BASE_URL}/api/auth/resend-verification"
    payload = {"email": EMAIL}

    # First attempt should succeed
    try:
        response1 = requests.post(url, json=payload, timeout=30)
        assert response1.status_code == 200, f"Expected 200 but got {response1.status_code}"
        json_resp1 = response1.json()
        assert isinstance(json_resp1, dict), "Response is not a JSON object"
    except Exception as e:
        raise AssertionError(f"First resend attempt failed: {str(e)}")

    # Second attempt immediately should trigger cooldown (429)
    try:
        response2 = requests.post(url, json=payload, timeout=30)
        assert response2.status_code == 429, f"Expected 429 cooldown but got {response2.status_code}"
        json_resp2 = response2.json()
        assert isinstance(json_resp2, dict), "Response is not a JSON object"
    except Exception as e:
        raise AssertionError(f"Cooldown enforcement failed: {str(e)}")

    # Wait for cooldown period (~ assumed 60 seconds or based on implementation)
    # Since exact cooldown duration is not given, use a wait longer than typical cooldown to test allowing after cooldown.
    # Here we wait 65 seconds to be safe.
    time.sleep(65)

    # Third attempt after cooldown should succeed again
    try:
        response3 = requests.post(url, json=payload, timeout=30)
        assert response3.status_code == 200, f"Expected 200 after cooldown but got {response3.status_code}"
        json_resp3 = response3.json()
        assert isinstance(json_resp3, dict), "Response is not a JSON object"
    except Exception as e:
        raise AssertionError(f"Resend attempt after cooldown failed: {str(e)}")


test_resend_email_verification_code_with_cooldown()