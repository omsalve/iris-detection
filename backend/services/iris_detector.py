import os

import cv2
import numpy as np
import face_recognition
from utils.image_utils import base64_to_image
from utils.logger import get_logger
from services.firebase_service import get_all_face_encodings

log = get_logger("detector")

# lower = stricter. 0.55 was letting siblings through on the demo
MATCH_THRESHOLD = float(os.getenv("FACE_MATCH_THRESHOLD", "0.5"))

def load_known_faces():
    docs = get_all_face_encodings()
    known_encodings = []
    known_names = []
    known_ids = []
    for doc in docs:
        known_encodings.append(np.array(doc["encoding"]))
        known_names.append(doc["name"])
        known_ids.append(doc["id"])
    return known_encodings, known_names, known_ids

def detect_iris(image_base64: str) -> dict:
    known_encodings, known_names, known_ids = load_known_faces()

    if not known_encodings:
        return {"matched": False, "confidence": 0.0, "message": "No faces enrolled in system"}

    try:
        img = base64_to_image(image_base64)

        if img.ndim == 3 and img.shape[2] == 4:
            img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        face_locations = face_recognition.face_locations(rgb_img)
        face_encodings = face_recognition.face_encodings(rgb_img, face_locations)

        if not face_encodings:
            return {"matched": False, "confidence": 0.0, "message": "No face found in frame"}

        unknown_encoding = face_encodings[0]
        distances = face_recognition.face_distance(known_encodings, unknown_encoding)
        best_match_idx = np.argmin(distances)
        best_distance = distances[best_match_idx]

        confidence = round(max(0.0, min(1.0, float(1.0 - best_distance))), 2)
        is_match = bool(best_distance < MATCH_THRESHOLD)

        log.info(
            "distance=%.3f threshold=%.2f confidence=%s%%",
            best_distance, MATCH_THRESHOLD, confidence,
        )

        if is_match:
            matched_name = known_names[best_match_idx]
            return {
                "matched": True,
                "confidence": confidence,
                "name": matched_name,
                "message": f"Identity Verified: {matched_name}"
            }
        else:
            return {"matched": False, "confidence": confidence, "message": "Intruder Detected"}

    except Exception as e:
        log.error("Recognition error: %s", e)
        return {"matched": False, "confidence": 0.0, "message": "Image processing failed"}