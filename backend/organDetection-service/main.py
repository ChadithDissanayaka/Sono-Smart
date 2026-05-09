from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routes import router
from model import load_model

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the YOLO model once when the server starts
    load_model()
    print("✅ Model loaded and ready")
    yield
    print("🛑 Shutting down")

app = FastAPI(
    title="Organ Detection API",
    description="YOLOv8-based ultrasound organ detection service",
    version="1.0.0",
    lifespan=lifespan
)

# Allow requests from your Node.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your Node app URL in production e.g. ["http://localhost:3000"]
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
