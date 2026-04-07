from fastapi import APIRouter
from models.schemas import OTPRequest, OTPVerifyRequest, OTPResponse
from services.otp_service import generate_otp, verify_otp

router = APIRouter()

@router.post("/send", response_model=OTPResponse)
async def send_otp(request: OTPRequest):
    from services.firebase_service import check_email_registered
    if not check_email_registered(request.email):
        return OTPResponse(success=False, message="not registered by the admin")

    try:
        generate_otp(request.email)
        return OTPResponse(success=True, message="OTP sent successfully")
    except Exception as e:
        print(f"[OTP SEND ERROR]: {e}")
        return OTPResponse(success=False, message="Failed to send OTP")

@router.post("/verify", response_model=OTPResponse)
async def verify_otp_route(request: OTPVerifyRequest):
    valid = verify_otp(request.email, request.otp)
    return OTPResponse(success=valid, message="Access granted" if valid else "Invalid OTP")