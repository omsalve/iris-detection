import random
import os
import time
import requests
from typing import Dict
from dotenv import load_dotenv

load_dotenv()

# how long a code stays usable
OTP_TTL_SECONDS = 300
MAX_ATTEMPTS = 5

# In-memory OTP store -> email: {code, issued_at, attempts}
otp_store: Dict[str, dict] = {}

def generate_otp(email: str) -> str:
    otp = str(random.randint(100000, 999999))
    otp_store[email] = {"code": otp, "issued_at": time.time(), "attempts": 0}

    # LOCAL IMPORT to prevent circular dependency
    from services.firebase_service import get_telegram_id_by_email

    user_chat_id = get_telegram_id_by_email(email)
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")

    if not user_chat_id or not bot_token:
        print(f"[OTP Error] Telegram not configured for {email}")
        raise Exception("Telegram ID missing")

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": user_chat_id,
        "text": f"\U0001f510 *IrisGuard Passcode*\n\nYour code: `{otp}`\n\nValid for 5 minutes.",
        "parse_mode": "Markdown"
    }

    try:
        requests.post(url, json=payload, timeout=10)
        print(f"[Telegram OTP] Sent to {email}")
    except Exception as e:
        print(f"[CRITICAL TELEGRAM ERROR]: {e}")
        raise e

    return otp

def verify_otp(email: str, otp: str) -> bool:
    entry = otp_store.get(email)
    if not entry:
        return False

    age = time.time() - entry["issued_at"]

    if age > OTP_TTL_SECONDS:
        del otp_store[email]
        print(f"[OTP] Code expired for {email}")
        return False

    if entry["code"] == otp:
        del otp_store[email]
        return True

    entry["attempts"] += 1
    if entry["attempts"] >= MAX_ATTEMPTS:
        del otp_store[email]
        print(f"[OTP] Too many wrong attempts for {email}, code burned")

    return False
