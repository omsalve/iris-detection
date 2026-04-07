from fastapi import APIRouter
from utils.image_utils import base64_to_image
from services.firebase_service import save_face_encoding, delete_face_encoding
import face_recognition
import cv2
import uuid
import numpy as np # <--- ADD THIS IMPORT

router = APIRouter()


@router.post("/")
async def enroll_face(request: dict):
    try:
        name = request.get("name")
        email = request.get("email", "")
        image_base64 = request.get("image_base64")

        if not name or not image_base64:
            return {"success": False, "message": "Name and image required"}

        # -------------------------------
        # 1. Decode image
        # -------------------------------
        img = base64_to_image(image_base64)

        # Strip alpha channel (PNG uploads are often RGBA)
        if len(img.shape) == 3 and img.shape[2] == 4:
            img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


        rgb_img = np.ascontiguousarray(rgb_img, dtype=np.uint8)

        # -------------------------------
        # 2. Detect face(s)
        # -------------------------------
        face_locations = face_recognition.face_locations(rgb_img)

        if len(face_locations) == 0:
            return {"success": False, "message": "No face detected in image"}

        if len(face_locations) > 1:
            return {
                "success": False,
                "message": "Multiple faces detected — use a single face photo",
            }

        # -------------------------------
        # 3. Encode face
        # -------------------------------
        encodings = face_recognition.face_encodings(rgb_img, face_locations)

        if not encodings:
            return {"success": False, "message": "Face encoding failed"}

        # -------------------------------
        # 4. Save to database
        # -------------------------------
        person_id = str(uuid.uuid4())
        save_face_encoding(person_id, name, encodings[0].tolist(), email)

        return {
            "success": True,
            "message": f"{name} enrolled successfully",
            "person_id": person_id,
        }

    except Exception as e:
        print(f"[Enroll ERROR]: {e}")
        return {"success": False, "message": "Server error"}


# -------------------------------
# DELETE FACE
# -------------------------------
@router.delete("/{person_id}")
async def delete_face(person_id: str):
    try:
        delete_face_encoding(person_id)
        return {"success": True, "message": "Face removed"}
    except Exception as e:
        print(f"[Delete ERROR]: {e}")
        return {"success": False, "message": "Failed to delete face"}