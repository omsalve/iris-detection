import firebase_admin
from firebase_admin import credentials, firestore
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase only once
if not firebase_admin._apps:
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase_credentials.json")
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)

def get_db():
    return firestore.client()

def log_access(method: str, status: str, details: str = ""):
    try:
        db = get_db()
        db.collection("access_logs").add({
            "method": method,
            "status": status,
            "details": details,
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        print(f"[Firebase] Logging failed: {e}")

def get_recent_logs(limit: int = 20):
    try:
        db = get_db()
        docs = db.collection("access_logs")\
                 .order_by("timestamp", direction=firestore.Query.DESCENDING)\
                 .limit(limit).stream()
        return [{"id": doc.id, **doc.to_dict()} for doc in docs]
    except Exception as e:
        print(f"[Firebase] Fetch failed: {e}")
        return []