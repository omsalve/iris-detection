from fastapi import APIRouter
from models.schemas import OTPRequest, OTPVerifyRequest, OTPResponse
from services.otp_service import generate_otp, verify_otp

# Removed the top-level firebase_service import to fully prevent circular import issues on startup

router = APIRouter()

@router.post("/send", response_model=OTPResponse)
async def send_otp(request: OTPRequest):
    # 1. Check if email is registered by the admin (imported here to avoid startup import errors)
    from services.firebase_service import check_email_registered
    
    is_registered = check_email_registered(request.email)
    
    if not is_registered:
        return OTPResponse(
            success=False, 
            message="not registered by the admin"
        )

    # 2. If registered, proceed to send OTP
    try:
        generate_otp(request.email)
        return OTPResponse(success=True, message="OTP sent successfully")
    except Exception as e:
        return OTPResponse(success=False, message="Failed to send OTP")

@router.post("/verify", response_model=OTPResponse)
async def verify_otp_route(request: OTPVerifyRequest):
    valid = verify_otp(request.email, request.otp)
    
    # Log access (defer import to avoid circular import at startup)
    from services.firebase_service import log_access
    log_access(
        method="otp",
        status="granted" if valid else "denied",
        details=f"email={request.email}"
    )
    
    return OTPResponse(
        success=valid,
        message="Access granted" if valid else "Invalid OTP"
    )