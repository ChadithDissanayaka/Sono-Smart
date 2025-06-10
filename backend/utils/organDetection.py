import base64
import os
import sys
import json
import numpy as np
import cv2
from ultralytics import YOLO

# Class names for organ detection
CLASS_NAMES = ['bladder', 'bowel', 'gallbladder', 'kidney', 'liver', 'spleen']

def base64_to_image(base64_string):
    """Convert base64 string to image"""
    try:
        # Convert base64 string to numpy array
        image_data = np.frombuffer(base64.b64decode(base64_string), np.uint8)

        # Decode the image
        image = cv2.imdecode(image_data, cv2.IMREAD_COLOR)

        return image

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def detect_organs(image_data):
    """Detect organs in the provided image using YOLOv8 model"""
    try:
        # Get the absolute path to the model
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, 'Best_Model.pt')

        # Load the model
        model = YOLO(model_path)

        # Save the image temporarily
        temp_img_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'temp', 'temp_image.png')
        cv2.imwrite(temp_img_path, image_data)

        # Run inference
        results = model.predict(source=image_data, imgsz=256, conf=0.5)

        # Extract the predicted class label
        if results and len(results) > 0:
            predictions = results[0].names  # Class names of the model
            probs = results[0].probs  # Probabilities of predictions

            # Get the class with the highest probability (top 1)
            predicted_class_idx = probs.top1  # Index of the class with the highest probability
            predicted_class_name = predictions[predicted_class_idx]  # Class name corresponding to top 1
            predicted_confidence = probs.top1conf.item()  # Convert Tensor to scalar for JSON serialization
        else:
            predicted_class_name = "No Detection"
            predicted_confidence = 0.0

        # Remove the temporary image
        if os.path.exists(temp_img_path):
            os.remove(temp_img_path)

        return {
                'success': True,
                'detectedOrgan': predicted_class_name,
                'confidence': predicted_confidence  # Optionally return the confidence
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

# If script is run directly, process input from command line
if __name__ == '__main__':
    # Read input from stdin (base64 encoded image)
    input_data = sys.stdin.read().strip()
    
    # Convert base64 string to image
    image = base64_to_image(input_data)

    # Process the image
    result = detect_organs(image)

    # Output JSON result
    print(json.dumps(result))
