import base64
import numpy as np
import cv2

def base64_to_image(base64_str: str) -> np.ndarray:
    # 1. Strip the header if it exists
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]
        
    # 2. Fix spaces (sometimes caused by JSON/URL encoding)
    base64_str = base64_str.replace(" ", "+")
        
    # 3. Fix missing padding (browsers sometimes truncate the trailing '=' signs)
    missing_padding = len(base64_str) % 4
    if missing_padding:
        base64_str += '=' * (4 - missing_padding)
        
    # 4. Decode the bytes
    try:
        img_bytes = base64.b64decode(base64_str)
    except Exception as e:
        raise ValueError(f"Base64 decode failed: {e}")
        
    np_arr = np.frombuffer(img_bytes, np.uint8)
    
    # 5. Read as Color (forces 3 channels, strips RGBA alpha channels)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise ValueError("OpenCV failed to decode image. File might be corrupted, or is an unsupported format like .HEIC")
        
    # 6. Ensure strictly 8-bit contiguous array (Fixes the dlib crash)
    img = np.ascontiguousarray(img, dtype=np.uint8)
    
    return img

def image_to_base64(img: np.ndarray) -> str:
    _, buffer = cv2.imencode(".jpg", img)
    return base64.b64encode(buffer).decode("utf-8")