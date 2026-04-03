from pydantic import BaseModel
from typing import Optional


class IrisScanRequest(BaseModel):
    image_base64: str


class IrisScanResponse(BaseModel):
    matched: bool
    confidence: float
    message: str
    overlay_frame: Optional[str] = None   # base64 JPEG with HUD drawn on it
    snapshot_url:  Optional[str] = None   # Firebase Storage URL of eye crop


class OTPRequest(BaseModel):
    phone: str


class OTPVerifyRequest(BaseModel):
    phone: str
    otp: str


class OTPResponse(BaseModel):
    success: bool
    message: str


class AccessLogEntry(BaseModel):
    method: str          # "iris" | "otp" | "admin_override"
    status: str          # "granted" | "denied"
    timestamp: str
    details: Optional[str] = None
    snapshot_url: Optional[str] = None