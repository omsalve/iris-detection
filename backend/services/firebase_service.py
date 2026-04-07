import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

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

def save_face_encoding(person_id: str, name: str, encoding: list, email: str = "", telegram_id: str = ""):
    try:
        db = get_db()
        now_time = datetime.now(timezone.utc).isoformat()
        clean_email = email.strip().lower()
        
        db.collection("registered_faces").document(person_id).set({
            "name": name,
            "email": clean_email,
            "telegram_id": telegram_id.strip(),
            "encoding": encoding,
            "enrolled_at": now_time
        })
        
        if clean_email:
            db.collection("registered_emails").document(clean_email).set({
                "person_id": person_id,
                "telegram_id": telegram_id.strip(),
                "enrolled_at": now_time
            })
    except Exception as e:
        print(f"[Firebase] Save encoding failed: {e}")

def get_telegram_id_by_email(email: str) -> str:
    try:
        db = get_db()
        doc = db.collection("registered_emails").document(email.strip().lower()).get()
        if doc.exists:
            return doc.to_dict().get("telegram_id", "")
        return ""
    except Exception as e:
        print(f"[Firebase] Get Telegram ID failed: {e}")
        return ""
    
    
def delete_face_encoding(person_id: str):
    try:
        db = get_db()
        
        # 1. Find the user first to get their email
        doc_ref = db.collection("registered_faces").document(person_id)
        doc = doc_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            email = data.get("email")
            
            # 2. Delete from registered_emails bucket if they had an email
            if email:
                clean_email = email.strip().lower()
                db.collection("registered_emails").document(clean_email).delete()
                
        # 3. Delete from registered_faces bucket
        doc_ref.delete()
        
    except Exception as e:
        print(f"[Firebase] Delete encoding failed: {e}")

def check_email_registered(email: str) -> bool:
    try:
        if not email:
            return False
            
        db = get_db()
        clean_email = email.strip().lower()
        
        # Directly check the dedicated emails bucket
        doc = db.collection("registered_emails").document(clean_email).get()
        return doc.exists
        
    except Exception as e:
        print(f"[Firebase] Email check failed: {e}")
        return False