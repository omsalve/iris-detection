import random
import os
from typing import Dict
from dotenv import load_dotenv

load_dotenv()

# In-memory OTP store (use Redis in prod)
otp_store: Dict[str, str] = {}

USE_BREVO = True  # Brevo email OTP enabled


def generate_otp(email: str) -> str:
    otp = str(random.randint(100000, 999999))
    otp_store[email] = otp

    if USE_BREVO:
        import brevo_python
        from brevo_python.rest import ApiException

        configuration = brevo_python.Configuration()
        configuration.api_key['api-key'] = os.getenv("BREVO_API_KEY")

        api_instance = brevo_python.TransactionalEmailsApi(
            brevo_python.ApiClient(configuration)
        )

        send_smtp_email = brevo_python.SendSmtpEmail(
            to=[{"email": email}],
            sender={
                "email": os.getenv("BREVO_SENDER_EMAIL"),
                "name": "IrisGuard",
            },
            subject="Your IrisGuard OTP",
            html_content=f"<p>Your IrisGuard OTP is: <strong>{otp}</strong></p>",
        )

        try:
            api_instance.send_transac_email(send_smtp_email)
        except ApiException as e:
            print(f"[BREVO ERROR] {e}")
    else:
        print(f"[DEV OTP] Email: {email} → OTP: {otp}")

    return otp


def verify_otp(email: str, otp: str) -> bool:
    stored = otp_store.get(email)

    if stored and stored == otp:
        del otp_store[email]
        return True

    return False