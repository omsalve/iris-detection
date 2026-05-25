from fastapi import APIRouter
from models.schemas import IrisScanRequest, IrisScanResponse

from services.iris_detector import detect_iris
from services.firebase_service import log_access
from services.eye_overlay import (
    detect_and_crop_eyes,
    draw_eye_overlay,
    eye_crop_to_base64,
)
from services.storage_service import (
    upload_eye_snapshot,
    build_snapshot_placeholder,
)
from services.telegram_service import send_eye_snapshot

from utils.image_utils import base64_to_image, image_to_base64
from utils.logger import get_logger


log = get_logger("iris")

router = APIRouter()


@router.post("/scan", response_model=IrisScanResponse)
async def scan_iris(request: IrisScanRequest):
    # -------------------------------
    # 1. Core authentication (FACE)
    # -------------------------------
    result = detect_iris(request.image_base64)
    matched = result["matched"]
    confidence = result["confidence"]
    person_name = result["name"]

    snapshot_path: str | None = None
    overlay_frame: str | None = None

    try:
        # -------------------------------
        # 2. Decode incoming frame
        # -------------------------------
        img = base64_to_image(request.image_base64)

        # -------------------------------
        # 3. Detect eyes (for UI only)
        # -------------------------------
        eye_crop, eye_boxes = detect_and_crop_eyes(img)

        # -------------------------------
        # 4. Draw HUD overlay
        # -------------------------------
        hud_img = draw_eye_overlay(img, eye_boxes)
        overlay_frame = image_to_base64(hud_img)

        # -------------------------------
        # 5. Save snapshot (ONLY if valid)
        # -------------------------------
        if eye_crop is not None:
            crop_b64 = eye_crop_to_base64(eye_crop)
            snapshot_path = upload_eye_snapshot(crop_b64, method="iris")

            # -------------------------------
            # 6. Send to Telegram (REAL ACTION)
            # -------------------------------
            if snapshot_path:
                send_eye_snapshot(
                    snapshot_path,
                    matched=matched,
                    confidence=confidence,
                    name=person_name,
                )

    except Exception as exc:
        log.error("Processing error: %s", exc)

    # -------------------------------
    # 7. Fallback snapshot (UI only)
    # -------------------------------
    if not snapshot_path:
        snapshot_path = build_snapshot_placeholder(matched)

    # -------------------------------
    # 8. Logging (non-blocking mindset)
    # -------------------------------
    log_access(
        method="iris",
        status="granted" if matched else "denied",
        details=f"name={person_name or 'unknown'} confidence={confidence} snapshot={snapshot_path}",
    )

    # -------------------------------
    # 9. Response
    # -------------------------------
    return IrisScanResponse(
        matched=matched,
        confidence=confidence,
        message="Access granted" if matched else "Iris not recognized",
        name=person_name,
        overlay_frame=overlay_frame,
        snapshot_url=snapshot_path,
    )