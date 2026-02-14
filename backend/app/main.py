import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routers import voice, chat
from app.config import settings

load_dotenv()

app = FastAPI(
    title="Voice Agent API",
    description="AI Voice Clone Agent",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(voice.router, prefix="/api/voice", tags=["Voice"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

os.makedirs(settings.voice_samples_dir, exist_ok=True)


@app.on_event("startup")
async def startup_event():
    """Preload the Chatterbox TTS model on startup."""
    from app.services.chatterbox_tts import get_model
    try:
        get_model()
        print("Chatterbox TTS model ready.")
    except Exception as e:
        print(f"Warning: Failed to preload TTS model: {e}")


@app.get("/api/health")
async def health_check():
    from app.services.chatterbox_tts import _model
    return {
        "status": "ok",
        "groq_configured": bool(settings.groq_api_key),
        "tts_model_loaded": _model is not None,
    }
