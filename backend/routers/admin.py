from fastapi import APIRouter
from services.firebase_service import get_recent_logs, get_all_face_encodings

router = APIRouter()

@router.get("/logs", tags=["Admin"])
@router.get("/logs/", tags=["Admin"])
async def get_logs():
    logs = get_recent_logs(limit=50)
    return {"logs": logs}

@router.get("/enrolled-users", tags=["Admin"])
@router.get("/enrolled-users/", tags=["Admin"])
async def get_enrolled_users():
    """Get all enrolled users from Firebase"""
    faces = get_all_face_encodings()
    
    # Transform to Person format for frontend
    users = []
    for face in faces:
        name = face.get("name", "Unknown")
        email = face.get("email", "")
        enrolled_at = face.get("enrolled_at", "")
        initials = "".join([w[0] for w in name.split()]).upper()[:2]
        
        users.append({
            "id": face.get("id", ""),
            "firestoreId": face.get("id", ""),
            "name": name,
            "email": email,
            "irisDate": enrolled_at.split("T")[0] if enrolled_at else "",
            "lastSeen": enrolled_at,
            "location": "Front Door",
            "initials": initials,
            "status": "active"
        })
    
    return {"users": users}