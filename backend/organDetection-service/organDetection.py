import base64
import numpy as np
import cv2
from model import get_model


def base64_to_image(base64_string: str) -> np.ndarray:
    """Decode a base64 string into an OpenCV image (numpy array)."""
    # Strip the data URI prefix if present (e.g. "data:image/png;base64,...")
    if "," in base64_string:
        base64_string = base64_string.split(",", 1)[1]

    image_bytes = base64.b64decode(base64_string)
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Could not decode image. Make sure it is a valid base64-encoded image.")

    return image


def detect_organs(base64_string: str) -> dict:
    """
    Run YOLOv8 classification on a base64-encoded ultrasound image.
    Returns the detected organ name and confidence score.
    """
    image = base64_to_image(base64_string)
    model = get_model()

    results = model.predict(source=image, imgsz=256, conf=0.5)

    if results and len(results) > 0:
        predictions = results[0].names   # {index: class_name}
        probs = results[0].probs         # classification probabilities

        predicted_class_idx = probs.top1
        predicted_class_name = predictions[predicted_class_idx]
        predicted_confidence = round(probs.top1conf.item(), 4)
    else:
        predicted_class_name = "No Detection"
        predicted_confidence = 0.0

    return {
        "detectedOrgan": predicted_class_name,
        "confidence": predicted_confidence,
    }
