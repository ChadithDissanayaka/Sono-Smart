"""
Run the FastAPI organ detection service.
Usage:  python run.py
"""
import os
from dotenv import load_dotenv
import uvicorn

load_dotenv()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "organ-detection:app",
        host="0.0.0.0",
        port=port,
        reload=False,   # Set to True during local development
    )
