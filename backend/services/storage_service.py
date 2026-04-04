def upload_eye_snapshot(image_base64: str, method: str = "iris") -> str:
    import base64, os, uuid
    from datetime import datetime

    now = datetime.now()
    folder = os.path.join("snapshots", now.strftime("%Y-%m-%d"))
    os.makedirs(folder, exist_ok=True)

    filename = f"{method}_{uuid.uuid4().hex}.jpg"
    filepath = os.path.join(folder, filename)

    with open(filepath, "wb") as f:
        f.write(base64.b64decode(image_base64))

    print("[Storage] Saved:", filepath)
    return filepath

def build_snapshot_placeholder(matched: bool) -> str:
    """
    Returns a string placeholder path when no real eye crop
    was detected. Used for logging and UI fallback only —
    no file is actually written to disk.
    """
    from datetime import datetime

    status = "granted" if matched else "denied"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    placeholder = f"snapshots/placeholder_{status}_{timestamp}.jpg"

    print(f"[Storage] No eye crop detected — placeholder: {placeholder}")
    return placeholder