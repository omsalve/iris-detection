import base64
import os
import uuid
from datetime import datetime

from utils.logger import get_logger

log = get_logger("storage")

SNAPSHOT_ROOT = "snapshots"


def upload_eye_snapshot(image_base64: str, method: str = "iris") -> str:
    now = datetime.now()
    folder = os.path.join(SNAPSHOT_ROOT, now.strftime("%Y-%m-%d"))
    os.makedirs(folder, exist_ok=True)

    filename = f"{method}_{uuid.uuid4().hex}.jpg"
    filepath = os.path.join(folder, filename)

    with open(filepath, "wb") as f:
        f.write(base64.b64decode(image_base64))

    log.info("Saved %s", filepath)
    return filepath


def build_snapshot_placeholder(matched: bool) -> str:
    """
    Returns a string placeholder path when no real eye crop
    was detected. Used for logging and UI fallback only —
    no file is actually written to disk.
    """
    status = "granted" if matched else "denied"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    placeholder = f"snapshots/placeholder_{status}_{timestamp}.jpg"

    log.info("No eye crop detected, using placeholder %s", placeholder)
    return placeholder
