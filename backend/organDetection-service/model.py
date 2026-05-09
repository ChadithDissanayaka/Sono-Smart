import os
from ultralytics import YOLO

# Global model instance — loaded once at startup
_model = None


def load_model():
    """Load the YOLO model into memory. Called once at server startup."""
    global _model
    model_path = os.getenv("MODEL_PATH", os.path.join(os.path.dirname(__file__), "models", "Best_Model.pt"))

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at: {model_path}")

    _model = YOLO(model_path)
    return _model


def get_model() -> YOLO:
    """Return the already-loaded model. Raises if not yet loaded."""
    if _model is None:
        raise RuntimeError("Model is not loaded. Call load_model() first.")
    return _model
