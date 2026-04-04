from fastapi import APIRouter
from services.firebase_service import get_recent_logs

router = APIRouter()

@router.get("/logs")
async def get_logs():
    logs = get_recent_logs(limit=20)
    return {"logs": logs}