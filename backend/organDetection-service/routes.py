from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from organDetection import detect_organs

router = APIRouter()


class ImagePayload(BaseModel):
    imageData: str  # base64-encoded image string


@router.get("/health")
def health_check():
    """Health check — use this to verify the service is running."""
    return {"status": "ok", "service": "organ-detection"}


@router.post("/detect-organs")
def detect_organs_route(payload: ImagePayload):
    """
    Detect the organ in an ultrasound image.

    Body:
        imageData (str): base64-encoded image (with or without data URI prefix)

    Returns:
        detectedOrgan (str): name of the detected organ
        confidence (float): confidence score between 0 and 1
    """
    try:
        result = detect_organs(payload.imageData)
        return {"success": True, **result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
