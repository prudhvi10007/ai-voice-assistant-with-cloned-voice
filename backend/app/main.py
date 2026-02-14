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


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "elevenlabs_configured": bool(settings.elevenlabs_api_key),
        "anthropic_configured": bool(settings.anthropic_api_key),
    }
