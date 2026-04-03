import cv2
import numpy as np
import face_recognition
from utils.image_utils import base64_to_image

MOCK_MODE = False
KNOWN_ENCODING = None

# 1. Load the "Authorized" face into memory on startup
try:
    from PIL import Image
    pil_image = Image.open("admin.jpg").convert("RGB")
    admin_image = np.array(pil_image)
    encodings = face_recognition.face_encodings(admin_image)
    if len(encodings) == 0:
        print("[WARNING] No face found in admin.jpg. Make sure it contains a clear face.")
    else:
        KNOWN_ENCODING = encodings[0]
        print("[SYSTEM] Authorized admin face loaded and encoded successfully!")
except Exception as e:
    print(f"[WARNING] Could not load admin.jpg. Face recognition will fail. Error: {e}")
def detect_iris(image_base64: str) -> dict:
    if MOCK_MODE:
        return {"matched": True, "confidence": 0.99, "message": "Mock Mode Active"}

    if KNOWN_ENCODING is None:
        return {"matched": False, "confidence": 0.0, "message": "System not initialized with admin face"}

    try:
        # 2. Decode the incoming webcam frame
        img = base64_to_image(image_base64)
        
        # face_recognition works best with RGB, OpenCV uses BGR by default
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # 3. Find all faces and their encodings in the current webcam frame
        face_locations = face_recognition.face_locations(rgb_img)
        face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
        
        if len(face_encodings) == 0:
            return {"matched": False, "confidence": 0.0, "message": "No face found in frame"}

        # 4. Compare the first face found in the webcam to the authorized admin
        unknown_encoding = face_encodings[0]
        
        # Calculate the mathematical distance between the faces (lower distance = closer match)
        face_distances = face_recognition.face_distance([KNOWN_ENCODING], unknown_encoding)
        distance = face_distances[0]
        
        # A distance < 0.6 is typically a strict match. We convert this distance into a confidence %
        confidence = round(float(1.0 - distance), 2)
        is_match = bool(distance < 0.55) # Strict threshold for security

        if is_match:
            return {"matched": True, "confidence": confidence, "message": "Identity Verified: Admin"}
        else:
            return {"matched": False, "confidence": confidence, "message": "Intruder Detected"}

    except Exception as e:
        print(f"Recognition Error: {e}")
        return {"matched": False, "confidence": 0.0, "message": "Image processing failed"}