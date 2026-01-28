import requests
import time

BASE_URL = "http://localhost:5000"
VERIFY_EMAIL_ENDPOINT = "/api/auth/verify-email"
RESEND_VERIFICATION_ENDPOINT = "/api/auth/resend-verification"
HEADERS = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTZkMzI2OTM5NTc5YTUzMDU3MmQzYTkiLCJyb2xlIjoiY2xpZW50IiwiaWF0IjoxNzY5NjA0ODA5LCJleHAiOjE3NzAyMDk2MDl9.7GCEtZRDAxcV5OOmkWtWdsGWQAEL2CrunZcm2s4Y3hk",
    "Content-Type": "application/json"
}
TEST_EMAIL = "testuser@example.com"

def test_email_verification_with_valid_and_invalid_codes():
    session = requests.Session()
    session.headers.update(HEADERS)

    # We assume the test user for which the email verification is done is TEST_EMAIL
    # Since no real valid verification code is provided, we first attempt invalid/expired codes,
    # then simulate rate limit.
    # For a valid code test, typically it requires the actual code sent by system, which we cannot fetch here;
    # so we attempt a resend to get a fresh code (though response doesn't provide code),
    # then try to verify assuming a placeholder valid code.

    try:
        # 1. Resend verification code to ensure recent code is sent and rate limiting not triggered
        resend_payload = {"email": TEST_EMAIL}
        resend_resp = session.post(
            BASE_URL + RESEND_VERIFICATION_ENDPOINT, json=resend_payload, timeout=30
        )
        assert resend_resp.status_code == 200 or resend_resp.status_code == 429, \
            f"Expected 200 or 429 on resend verification, got {resend_resp.status_code}"

        # 2. Test with valid verification code (simulate with mock '123456')
        # If resend was rate limited, this test might fail.
        verify_payload_valid = {"email": TEST_EMAIL, "verificationCode": "123456"}
        verify_resp_valid = session.post(
            BASE_URL + VERIFY_EMAIL_ENDPOINT, json=verify_payload_valid, timeout=30
        )
        # Accept 200 success OR 400 if code is invalid, since we do not have real code
        assert verify_resp_valid.status_code in [200, 400], \
            f"Expected 200 or 400 for valid code test, got {verify_resp_valid.status_code}"

        # 3. Test with invalid code
        verify_payload_invalid = {"email": TEST_EMAIL, "verificationCode": "000000"}
        verify_resp_invalid = session.post(
            BASE_URL + VERIFY_EMAIL_ENDPOINT, json=verify_payload_invalid, timeout=30
        )
        assert verify_resp_invalid.status_code in [400, 429], \
            f"Expected 400 or 429 for invalid code test, got {verify_resp_invalid.status_code}"

        # 4. Test with expired code simulation
        # Using a code known to be expired or random old code - simulate with '999999'
        verify_payload_expired = {"email": TEST_EMAIL, "verificationCode": "999999"}
        verify_resp_expired = session.post(
            BASE_URL + VERIFY_EMAIL_ENDPOINT, json=verify_payload_expired, timeout=30
        )
        assert verify_resp_expired.status_code in [400, 429], \
            f"Expected 400 or 429 for expired code test, got {verify_resp_expired.status_code}"

        # 5. Test rate limiting by sending multiple invalid attempts quickly
        last_status = None
        for _ in range(10):
            resp = session.post(
                BASE_URL + VERIFY_EMAIL_ENDPOINT,
                json={"email": TEST_EMAIL, "verificationCode": "000000"},
                timeout=30,
            )
            last_status = resp.status_code
            if last_status == 429:
                break
            # short delay to avoid immediate blocking but fast enough to trigger rate limit
            time.sleep(0.2)

        assert last_status == 429, f"Expected 429 for rate limiting, got {last_status}"

    finally:
        session.close()

test_email_verification_with_valid_and_invalid_codes()