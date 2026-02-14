from pydantic import BaseModel, Field
from typing import List, Optional


# ── Voice ──

class CloneVoiceResponse(BaseModel):
    voice_id: str
    name: str


class SpeakRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    voice_id: str
    stability: float = Field(default=0.5, ge=0.0, le=1.0)
    similarity_boost: float = Field(default=0.8, ge=0.0, le=1.0)
    style: float = Field(default=0.3, ge=0.0, le=1.0)


class VoiceInfo(BaseModel):
    voice_id: str
    name: str


# ── Chat ──

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=10000)
    history: List[ChatMessage] = Field(default_factory=list)
    system_prompt: str = Field(
        default="You are a helpful personal assistant. Answer concisely and conversationally."
    )


class AskResponse(BaseModel):
    answer: str


# ── Combined ──

class AskAndSpeakRequest(BaseModel):
    question: str = Field(..., min_length=1)
    history: List[ChatMessage] = Field(default_factory=list)
    system_prompt: str = "You are a helpful personal assistant."
    voice_id: str
    stability: float = 0.5
    similarity_boost: float = 0.8
