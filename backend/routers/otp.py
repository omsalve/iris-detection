from fastapi import APIRouter
from models.schemas import OTPRequest, OTPVerifyRequest, OTPResponse
from services.otp_service import generate_otp, verify_otp
from services.firebase_service import log_access

router = APIRouter()

@router.post("/send", response_model=OTPResponse)
async def send_otp(request: OTPRequest):
    generate_otp(request.email)
    return OTPResponse(success=True, message="OTP sent")

@router.post("/verify", response_model=OTPResponse)
async def verify_otp_route(request: OTPVerifyRequest):
    valid = verify_otp(request.email, request.otp)
    log_access(
        method="otp",
        status="granted" if valid else "denied",
        details=f"email={request.email}"
    )
    return OTPResponse(
        success=valid,
        message="Access granted" if valid else "Invalid OTP"
    )