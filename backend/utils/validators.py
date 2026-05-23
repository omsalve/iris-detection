import re

# both fields are optional on enroll, we only check them when present
EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


def is_valid_email(email: str) -> bool:
    email = (email or "").strip()
    if not email:
        return True
    return bool(EMAIL_RE.match(email))


def is_valid_telegram_id(telegram_id: str) -> bool:
    telegram_id = (telegram_id or "").strip()
    if not telegram_id:
        return True
    return telegram_id.isdigit() and 5 <= len(telegram_id) <= 15
