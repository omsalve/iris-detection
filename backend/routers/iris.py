from fastapi import APIRouter
from models.schemas import IrisScanRequest, IrisScanResponse
from services.iris_detector import detect_iris
from services.firebase_service import log_access
from services.eye_overlay import detect_and_crop_eyes, draw_eye_overlay, eye_crop_to_base64
from services.storage_service import upload_eye_snapshot, build_snapshot_placeholder
from utils.image_utils import base64_to_image, image_to_base64

router = APIRouter()


@router.post("/scan", response_model=IrisScanResponse)
async def scan_iris(request: IrisScanRequest):
    # 1. Run face recognition (the real auth logic)
    result = detect_iris(request.image_base64)
    matched     = result["matched"]
    confidence  = result["confidence"]

    # 2. Decode frame for OpenCV processing
    snapshot_url:   str | None = None
    overlay_frame:  str | None = None

    try:
        img = base64_to_image(request.image_base64)

        # 3. Eye detection overlay (purely graphic)
        eye_crop, eye_boxes = detect_and_crop_eyes(img)

        # 4. Draw targeting HUD on the frame
        hud_img = draw_eye_overlay(img, eye_boxes)
        overlay_frame = image_to_base64(hud_img)

        # 5. If we found eye(s), crop and upload to Storage
        if eye_crop is not None:
            crop_b64 = eye_crop_to_base64(eye_crop)
            snapshot_url = upload_eye_snapshot(crop_b64, method="iris")

        # 6. Fallback placeholder so the frontend never gets null
        if not snapshot_url:
            snapshot_url = build_snapshot_placeholder(matched)

    except Exception as exc:
        print(f"[IrisRouter] Overlay/snapshot error: {exc}")
        snapshot_url  = build_snapshot_placeholder(matched)
        overlay_frame = None

    # 7. Log to Firestore (include snapshot URL)
    log_access(
        method="iris",
        status="granted" if matched else "denied",
        details=f"confidence={confidence} snapshot={snapshot_url or 'none'}",
    )

    return IrisScanResponse(
        matched=matched,
        confidence=confidence,
        message="Access granted" if matched else "Iris not recognized",
        overlay_frame=overlay_frame,
        snapshot_url=snapshot_url,
    )