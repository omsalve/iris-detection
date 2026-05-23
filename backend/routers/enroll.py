from fastapi import APIRouter
from services.firebase_service import save_face_encoding, delete_face_encoding
from utils.validators import is_valid_email, is_valid_telegram_id
import face_recognition
import uuid
import base64
from io import BytesIO
from PIL import Image
import numpy as np

router = APIRouter()

@router.post("/")
async def enroll_face(request: dict):
    try:
        name = request.get("name")
        email = request.get("email", "")
        telegram_id = request.get("telegram_id", "")  # <--- Capture Telegram ID
        image_base64 = request.get("image_base64")

        if not name or not image_base64:
            return {"success": False, "message": "Name and image required"}

        if not is_valid_email(email):
            return {"success": False, "message": "That email does not look right"}

        if not is_valid_telegram_id(telegram_id):
            return {"success": False, "message": "Telegram ID should be numbers only"}

        # -------------------------------
        # 1. Decode image via PIL (Strict Dlib Compatibility)
        # -------------------------------
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]
            
        # Fix padding and spaces
        image_base64 = image_base64.replace(" ", "+")
        missing_padding = len(image_base64) % 4
        if missing_padding:
            image_base64 += '=' * (4 - missing_padding)

        # Use PIL to force strict 8-bit RGB layout
        img_bytes = base64.b64decode(image_base64)
        pil_image = Image.open(BytesIO(img_bytes)).convert("RGB")
        rgb_img = np.ascontiguousarray(pil_image, dtype=np.uint8)

        # -------------------------------
        # 2. Detect and Encode
        # -------------------------------
        face_locations = face_recognition.face_locations(rgb_img)

        if len(face_locations) == 0:
            return {"success": False, "message": "No face detected in image"}

        if len(face_locations) > 1:
            return {"success": False, "message": "Multiple faces detected"}

        encodings = face_recognition.face_encodings(rgb_img, face_locations)

        if not encodings:
            return {"success": False, "message": "Face encoding failed"}

        # -------------------------------
        # 3. Save to database including Telegram ID
        # -------------------------------
        person_id = str(uuid.uuid4())
        # Updated to pass telegram_id to firebase_service
        save_face_encoding(person_id, name, encodings[0].tolist(), email, telegram_id)

        return {
            "success": True,
            "message": f"{name} enrolled successfully",
            "person_id": person_id,
        }

    except Exception as e:
        print(f"[Enroll ERROR]: {e}")
        return {"success": False, "message": f"Server error: {str(e)}"}

@router.delete("/{person_id}")
async def delete_face(person_id: str):
    try:
        delete_face_encoding(person_id)
        return {"success": True, "message": "Face removed"}
    except Exception as e:
        print(f"[Delete ERROR]: {e}")
        return {"success": False, "message": "Failed to delete face"}