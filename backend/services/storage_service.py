import base64
import os
import shutil
import uuid
from datetime import datetime, timedelta

from utils.logger import get_logger

log = get_logger("storage")

SNAPSHOT_ROOT = "snapshots"
RETENTION_DAYS = int(os.getenv("SNAPSHOT_RETENTION_DAYS", "14"))


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


def cleanup_old_snapshots(retention_days: int = RETENTION_DAYS) -> int:
    """Drop day folders that are older than the retention window."""
    if not os.path.isdir(SNAPSHOT_ROOT):
        return 0

    cutoff = datetime.now() - timedelta(days=retention_days)
    removed = 0

    for entry in sorted(os.listdir(SNAPSHOT_ROOT)):
        path = os.path.join(SNAPSHOT_ROOT, entry)
        if not os.path.isdir(path):
            continue

        folder_date = datetime.strptime(entry, "%Y-%m-%d")
        if folder_date < cutoff:
            shutil.rmtree(path)
            removed += 1
            log.info("Purged %s", path)

    log.info("Snapshot cleanup done, %s folders removed", removed)
    return removed
