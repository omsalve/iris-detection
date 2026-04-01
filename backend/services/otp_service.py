import random
import os
from dotenv import load_dotenv

load_dotenv()

# In-memory OTP store (use Redis in prod)
otp_store: dict[str, str] = {}

USE_TWILIO = False  # Set True when you have Twilio creds

def generate_otp(phone: str) -> str:
    otp = str(random.randint(100000, 999999))
    otp_store[phone] = otp

    if USE_TWILIO:
        from twilio.rest import Client
        client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
        client.messages.create(
            body=f"Your IrisGuard OTP is: {otp}",
            from_=os.getenv("TWILIO_PHONE_NUMBER"),
            to=phone
        )
    else:
        print(f"[DEV OTP] Phone: {phone} → OTP: {otp}")  # Console fallback

    return otp

def verify_otp(phone: str, otp: str) -> bool:
    stored = otp_store.get(phone)
    if stored and stored == otp:
        del otp_store[phone]
        return True
    return False