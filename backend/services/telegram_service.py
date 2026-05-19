import os
import requests
from dotenv import load_dotenv
from utils.logger import get_logger

load_dotenv()

log = get_logger("telegram")

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")


def send_eye_snapshot(image_path: str, matched: bool, confidence: float):
    """
    Sends the saved image to Telegram bot with scan details.
    """
    if not BOT_TOKEN or not CHAT_ID:
        log.warning("Missing BOT_TOKEN or CHAT_ID")
        return False

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendPhoto"

    caption = (
        f"Eye Scan Detected\n\n"
        f"Status: {'GRANTED' if matched else 'DENIED'}\n"
        f"Confidence: {confidence:.2f}"
    )

    try:
        with open(image_path, "rb") as img:
            response = requests.post(
                url,
                data={
                    "chat_id": CHAT_ID,
                    "caption": caption
                },
                files={"photo": img}
            )

        if response.status_code == 200:
            log.info("Snapshot delivered")
            return True
        else:
            log.error("Send failed: %s", response.text)
            return False

    except Exception as e:
        log.error("Send error: %s", e)
        return False