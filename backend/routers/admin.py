from fastapi import APIRouter, Depends
from services.auth_service import verify_firebase_token
from services.firebase_service import get_recent_logs

router = APIRouter()

# The Depends(verify_firebase_token) acts as a bouncer for this route
@router.get("/logs")
async def get_logs(user: dict = Depends(verify_firebase_token)):
    print(f"User {user.get('email')} is fetching logs.")
    logs = get_recent_logs(limit=20)
    return {"logs": logs}