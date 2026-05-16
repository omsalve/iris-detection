import random
import os
import time
import requests
from typing import Dict, Tuple
from dotenv import load_dotenv

load_dotenv()

# how long a code stays usable
OTP_TTL_SECONDS = 300

# In-memory OTP store -> email: (code, issued_at)
otp_store: Dict[str, Tuple[str, float]] = {}

def generate_otp(email: str) -> str:
    otp = str(random.randint(100000, 999999))
    otp_store[email] = (otp, time.time())

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

    code, issued_at = entry
    age = time.time() - issued_at

    if age > OTP_TTL_SECONDS:
        del otp_store[email]
        print(f"[OTP] Code expired for {email}")
        return False

    if code == otp:
        del otp_store[email]
        return True

    return False
