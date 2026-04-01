import cv2
import numpy as np
from utils.image_utils import base64_to_image

# Mock mode — swap this out with real OpenCV logic on Day 2
MOCK_MODE = True

def detect_iris(image_base64: str) -> dict:
    if MOCK_MODE:
        import random
        matched = random.random() > 0.3  # 70% match rate for demo
        confidence = round(random.uniform(0.75, 0.99) if matched else random.uniform(0.1, 0.4), 2)
        return {"matched": matched, "confidence": confidence}

    # Real OpenCV iris detection (Day 2)
    img = base64_to_image(image_base64)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")
    eyes = eye_cascade.detectMultiScale(gray, 1.1, 4)
    
    if len(eyes) == 0:
        return {"matched": False, "confidence": 0.0}

    # Placeholder: in real use, compare iris features against stored embeddings
    return {"matched": True, "confidence": 0.85}