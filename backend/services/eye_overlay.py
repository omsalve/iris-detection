print("eye_overlay.py is loading...")


import cv2
import numpy as np
import base64
import os
from typing import Optional, Tuple, List


# Load Haar cascades
_CASCADE_PATHS = [
    cv2.data.haarcascades + "haarcascade_eye.xml",
    cv2.data.haarcascades + "haarcascade_eye_tree_eyeglasses.xml",
]

_eye_cascade = None
_face_cascade = None

def _get_cascades():
    global _eye_cascade, _face_cascade
    if _eye_cascade is None:
        _eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")
    if _face_cascade is None:
        _face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    return _face_cascade, _eye_cascade


def detect_and_crop_eyes(img_bgr: np.ndarray) -> Tuple[Optional[np.ndarray], List[Tuple[int, int, int, int]]]:
    """
    Detect eyes in the image using Haar cascades.
    Returns:
        - cropped eye region (both eyes in one crop) or None
        - list of eye bounding boxes [(x, y, w, h), ...]
    """
    face_cascade, eye_cascade = _get_cascades()
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)

    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
    )

    eye_boxes = []
    eye_crop = None

    if len(faces) == 0:
        # fallback: scan whole image for eyes
        eyes = eye_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3, minSize=(20, 20))
        for (ex, ey, ew, eh) in eyes[:2]:
            eye_boxes.append((ex, ey, ew, eh))
    else:
        fx, fy, fw, fh = faces[0]
        # only look in upper half of face for eyes
        roi_gray = gray[fy : fy + fh // 2, fx : fx + fw]
        eyes = eye_cascade.detectMultiScale(roi_gray, scaleFactor=1.1, minNeighbors=3, minSize=(15, 15))
        for (ex, ey, ew, eh) in eyes[:2]:
            # convert back to full-image coords
            eye_boxes.append((fx + ex, fy + ey, ew, eh))

        # crop the eye region from original colour image
        if len(eye_boxes) >= 1:
            xs = [b[0] for b in eye_boxes]
            ys = [b[1] for b in eye_boxes]
            ws = [b[2] for b in eye_boxes]
            hs = [b[3] for b in eye_boxes]
            pad = 20
            x1 = max(0, min(xs) - pad)
            y1 = max(0, min(ys) - pad)
            x2 = min(img_bgr.shape[1], max(x + w for x, w in zip(xs, ws)) + pad)
            y2 = min(img_bgr.shape[0], max(y + h for y, h in zip(ys, hs)) + pad)
            eye_crop = img_bgr[y1:y2, x1:x2]

    return eye_crop, eye_boxes


def draw_eye_overlay(img_bgr: np.ndarray, eye_boxes: List[Tuple[int, int, int, int]]) -> np.ndarray:
    """
    Draw a cinematic eye-scan overlay on the image.
    Green targeting reticles, scan lines, crosshairs — purely graphic.
    """
    out = img_bgr.copy()
    h, w = out.shape[:2]

    # subtle scanline overlay
    for y in range(0, h, 4):
        cv2.line(out, (0, y), (w, y), (0, 30, 0), 1)

    COLOR_BRIGHT = (0, 220, 130)
    COLOR_DIM    = (0, 100, 60)
    COLOR_RED    = (0, 60, 200)

    for (ex, ey, ew, eh) in eye_boxes:
        cx, cy = ex + ew // 2, ey + eh // 2
        r = max(ew, eh) // 2 + 8

        # outer targeting circle
        cv2.circle(out, (cx, cy), r + 16, COLOR_DIM, 1)
        cv2.circle(out, (cx, cy), r + 8,  COLOR_BRIGHT, 1)
        cv2.circle(out, (cx, cy), r,       COLOR_BRIGHT, 2)

        # inner iris circle
        cv2.circle(out, (cx, cy), r - 8, COLOR_DIM, 1)

        # crosshair lines — gap in the centre
        gap = 6
        arm = r + 20
        cv2.line(out, (cx - arm, cy), (cx - gap, cy), COLOR_BRIGHT, 1)
        cv2.line(out, (cx + gap, cy), (cx + arm, cy), COLOR_BRIGHT, 1)
        cv2.line(out, (cx, cy - arm), (cx, cy - gap), COLOR_BRIGHT, 1)
        cv2.line(out, (cx, cy + gap), (cx, cy + arm), COLOR_BRIGHT, 1)

        # corner brackets around eye bbox
        bx, by, bw, bh = ex - 4, ey - 4, ew + 8, eh + 8
        bl = 10  # bracket length
        pts = [
            # top-left
            ((bx, by + bl), (bx, by), (bx + bl, by)),
            # top-right
            ((bx + bw - bl, by), (bx + bw, by), (bx + bw, by + bl)),
            # bottom-left
            ((bx, by + bh - bl), (bx, by + bh), (bx + bl, by + bh)),
            # bottom-right
            ((bx + bw - bl, by + bh), (bx + bw, by + bh), (bx + bw, by + bh - bl)),
        ]
        for p in pts:
            cv2.polylines(out, [np.array(p)], False, COLOR_BRIGHT, 2)

        # small blinking dot at pupil centre (static — pulse handled in frontend)
        cv2.circle(out, (cx, cy), 3, COLOR_RED, -1)

        # data readout text
        label = f"EYE [{cx},{cy}]"
        cv2.putText(
            out, label,
            (ex, ey - 10),
            cv2.FONT_HERSHEY_PLAIN, 0.8, COLOR_DIM, 1, cv2.LINE_AA
        )

    # corner HUD decoration
    hud_color = (0, 80, 40)
    margin = 12
    arm_len = 24
    for (ox, oy, sx, sy) in [
        (margin, margin, 1, 1),
        (w - margin, margin, -1, 1),
        (margin, h - margin, 1, -1),
        (w - margin, h - margin, -1, -1),
    ]:
        cv2.line(out, (ox, oy), (ox + sx * arm_len, oy), hud_color, 2)
        cv2.line(out, (ox, oy), (ox, oy + sy * arm_len), hud_color, 2)

    return out


def eye_crop_to_base64(eye_crop: np.ndarray) -> str:
    """Encode a numpy eye crop as JPEG base64 string."""
    _, buf = cv2.imencode(".jpg", eye_crop, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return base64.b64encode(buf).decode("utf-8")


print("Functions:", [f for f in dir() if "eye" in f])