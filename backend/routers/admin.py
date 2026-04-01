from fastapi import APIRouter
from services.firebase_service import get_recent_logs, log_access

router = APIRouter()

@router.get("/logs")
async def get_logs():
    logs = get_recent_logs(20)
    return {"logs": logs}

@router.post("/alert")
async def send_alert(data: dict):
    log_access(method="admin_alert", status="triggered", details=data.get("reason", ""))
    # Hook Twilio SMS to admin here if needed
    return {"message": "Alert logged"}