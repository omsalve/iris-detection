from fastapi import APIRouter
from models.schemas import IrisScanRequest, IrisScanResponse
from services.iris_detector import detect_iris
from services.firebase_service import log_access

router = APIRouter()

@router.post("/scan", response_model=IrisScanResponse)
async def scan_iris(request: IrisScanRequest):
    result = detect_iris(request.image_base64)
    matched = result["matched"]
    confidence = result["confidence"]

    log_access(
        method="iris",
        status="granted" if matched else "denied",
        details=f"confidence={confidence}"
    )

    return IrisScanResponse(
        matched=matched,
        confidence=confidence,
        message="Access granted" if matched else "Iris not recognized"
    )