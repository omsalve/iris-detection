from fastapi import APIRouter
from services.firebase_service import get_recent_logs, get_all_face_encodings

router = APIRouter()

@router.get("/logs")
async def get_logs():
    logs = get_recent_logs(limit=50)
    return {"logs": logs}

@router.get("/enrolled-users")
async def get_enrolled_users():
    """Get all enrolled users from Firebase"""
    faces = get_all_face_encodings()
    return {"users": faces}