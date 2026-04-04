import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

import json

if not firebase_admin._apps:
    creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase_credentials.json")
    
    if creds_json:
        cred = credentials.Certificate(json.loads(creds_json))
    elif os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
    else:
        cred = None
    
    if cred:
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
            "timestamp": datetime.now(timezone.utc).isoformat()
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
    
def get_all_face_encodings():
    db = get_db()
    docs = db.collection("registered_faces").stream()
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]

def save_face_encoding(person_id: str, name: str, encoding: list):
    try:
        db = get_db()
        db.collection("registered_faces").document(person_id).set({
            "name": name,
            "encoding": encoding,
            "enrolled_at": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        print(f"[Firebase] Save encoding failed: {e}")

def delete_face_encoding(person_id: str):
    try:
        db = get_db()
        db.collection("registered_faces").document(person_id).delete()
    except Exception as e:
        print(f"[Firebase] Delete encoding failed: {e}")