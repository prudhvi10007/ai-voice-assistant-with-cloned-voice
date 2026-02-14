# Voice Agent — Project Specification

> AI-powered voice clone agent: record your voice, clone it, and let an AI answer questions sounding like you.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Environment Variables](#5-environment-variables)
6. [Backend Implementation](#6-backend-implementation)
7. [Frontend Implementation](#7-frontend-implementation)
8. [API Contract](#8-api-contract)
9. [External API Reference](#9-external-api-reference)
10. [Implementation Order](#10-implementation-order)
11. [Error Handling](#11-error-handling)
12. [Deployment](#12-deployment)

---

## 1. Project Overview

### What It Does

A full-stack web application with 4 user-facing steps:

1. **Setup** — User enters their ElevenLabs API key (Anthropic key is stored server-side)
2. **Record** — User records 1–5 minutes of voice samples in the browser
3. **Clone** — App sends audio samples to ElevenLabs to create a voice clone
4. **Agent** — User asks questions via text or mic. Claude generates an answer, ElevenLabs speaks it back in the cloned voice

### Core User Flow

```
User records voice → Backend sends to ElevenLabs → Voice cloned
User asks question → Backend sends to Claude → Gets answer text
Answer text → Backend sends to ElevenLabs TTS → Audio response
Audio plays in browser in cloned voice
```

---

## 2. Architecture

```
┌─────────────────────────────┐
│     FRONTEND (React+Vite)   │
│  Record · Chat · Playback   │
└──────────────┬──────────────┘
               │ REST API + Streaming
┌──────────────┴──────────────┐
│     BACKEND (FastAPI)       │
│  Routes · Auth · Services   │
└──────┬──────────────┬───────┘
       │              │
┌──────┴───────┐ ┌────┴──────────┐
│  Anthropic   │ │  ElevenLabs   │
│  Claude API  │ │  Voice API    │
│  (LLM Brain) │ │  (Clone+TTS)  │
└──────────────┘ └───────────────┘
```

### Data Flow Detail

**Voice Cloning Flow:**
1. Browser MediaRecorder captures audio as `audio/webm` blobs
2. Frontend sends blobs as `multipart/form-data` to `POST /api/voice/clone`
3. Backend validates files, forwards to ElevenLabs `POST /v1/voices/add`
4. ElevenLabs returns a `voice_id`, backend stores it and returns to frontend

**Q&A Flow:**
1. User types or speaks a question
2. Frontend sends question + conversation history to `POST /api/chat/ask`
3. Backend sends messages to Anthropic Claude API, gets text answer
4. Backend sends answer text to ElevenLabs `POST /v1/text-to-speech/{voice_id}`
5. Backend streams audio bytes back to frontend
6. Frontend plays audio through `<audio>` element or Web Audio API

**Voice Input Flow (optional):**
1. Browser Web Speech API (`webkitSpeechRecognition`) captures speech
2. Transcribed text is sent as a regular question through the Q&A flow

---

## 3. Tech Stack

### Backend
- **Python 3.11+**
- **FastAPI** — async web framework
- **uvicorn** — ASGI server
- **httpx** — async HTTP client for external API calls
- **anthropic** — official Anthropic Python SDK
- **python-multipart** — file upload handling
- **python-dotenv** — environment variable loading
- **pydantic-settings** — typed configuration
- **slowapi** — rate limiting (production)

### Frontend
- **React 18** with TypeScript
- **Vite** — build tool and dev server
- **Tailwind CSS** — utility-first styling
- **lucide-react** — icons
- **axios** — HTTP client

### External Services
- **ElevenLabs API** — voice cloning + text-to-speech
- **Anthropic Claude API** — LLM for question answering
- **Web Speech API** — browser-native speech-to-text (no API key needed)

---

## 4. Project Structure

```
voice-agent/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI app, middleware, router mounts
│   │   ├── config.py                # Settings from env vars (pydantic-settings)
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── voice.py             # /api/voice/* endpoints
│   │   │   └── chat.py              # /api/chat/* endpoints
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── elevenlabs.py        # ElevenLabs API wrapper
│   │   │   └── anthropic_llm.py     # Claude API wrapper
│   │   └── models/
│   │       ├── __init__.py
│   │       └── schemas.py           # Pydantic request/response models
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ApiKeySetup.tsx       # Step 1: API key entry
│   │   │   ├── VoiceRecorder.tsx     # Step 2: Record voice samples
│   │   │   ├── CloningStatus.tsx     # Step 3: Cloning progress
│   │   │   ├── ChatInterface.tsx     # Step 4: Q&A chat
│   │   │   ├── AudioVisualizer.tsx   # Waveform/bar visualizer
│   │   │   ├── MessageBubble.tsx     # Chat message component
│   │   │   └── AgentStatus.tsx       # Voice status indicator
│   │   ├── hooks/
│   │   │   ├── useAudioRecorder.ts   # MediaRecorder logic
│   │   │   ├── useSpeechRecognition.ts # Web Speech API
│   │   │   └── useVoiceAgent.ts      # Main agent state machine
│   │   ├── services/
│   │   │   └── api.ts                # Axios client + API functions
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript interfaces
│   │   ├── App.tsx                    # Main app with step routing
│   │   ├── main.tsx                   # Entry point
│   │   └── index.css                  # Tailwind imports + custom styles
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 5. Environment Variables

### `.env.example`

```env
# Required
ELEVENLABS_API_KEY=xi-xxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxx

# Optional
DEEPGRAM_API_KEY=                     # Only if using Deepgram for STT
ALLOWED_ORIGINS=http://localhost:5173  # Comma-separated for CORS
PORT=8000
ENV=development
```

### Backend `config.py`

```python
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    elevenlabs_api_key: str = ""
    anthropic_api_key: str = ""
    deepgram_api_key: str = ""
    allowed_origins: List[str] = ["http://localhost:5173"]
    port: int = 8000
    env: str = "development"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
```

---

## 6. Backend Implementation

### 6.1 `main.py` — App Entry Point

```python
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
```

Run with: `uvicorn app.main:app --reload --port 8000`

---

### 6.2 `models/schemas.py` — Request/Response Models

```python
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
```

---

### 6.3 `services/elevenlabs.py` — ElevenLabs API Wrapper

```python
import httpx
from typing import List, Tuple
from app.config import settings

BASE_URL = "https://api.elevenlabs.io/v1"


def _headers(api_key: str | None = None) -> dict:
    key = api_key or settings.elevenlabs_api_key
    return {"xi-api-key": key}


async def clone_voice(
    name: str,
    files: List[Tuple[str, bytes, str]],  # [(filename, content, content_type)]
    description: str = "Voice clone for AI agent",
    api_key: str | None = None,
) -> dict:
    """
    Clone a voice from audio samples.
    Returns: {"voice_id": "...", "name": "..."}
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        form_data = {"name": name, "description": description}
        file_tuples = [("files", (f[0], f[1], f[2])) for f in files]

        response = await client.post(
            f"{BASE_URL}/voices/add",
            headers=_headers(api_key),
            data=form_data,
            files=file_tuples,
        )
        response.raise_for_status()
        data = response.json()
        return {"voice_id": data["voice_id"], "name": name}


async def text_to_speech(
    text: str,
    voice_id: str,
    stability: float = 0.5,
    similarity_boost: float = 0.8,
    style: float = 0.3,
    api_key: str | None = None,
) -> bytes:
    """
    Convert text to speech using a cloned voice.
    Returns: raw audio bytes (mpeg format)
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{BASE_URL}/text-to-speech/{voice_id}",
            headers={**_headers(api_key), "Content-Type": "application/json"},
            json={
                "text": text,
                "model_id": "eleven_turbo_v2_5",
                "voice_settings": {
                    "stability": stability,
                    "similarity_boost": similarity_boost,
                    "style": style,
                },
            },
        )
        response.raise_for_status()
        return response.content


async def text_to_speech_stream(
    text: str,
    voice_id: str,
    stability: float = 0.5,
    similarity_boost: float = 0.8,
    api_key: str | None = None,
):
    """
    Stream TTS audio chunks. Yields bytes chunks.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        async with client.stream(
            "POST",
            f"{BASE_URL}/text-to-speech/{voice_id}/stream",
            headers={**_headers(api_key), "Content-Type": "application/json"},
            json={
                "text": text,
                "model_id": "eleven_turbo_v2_5",
                "voice_settings": {
                    "stability": stability,
                    "similarity_boost": similarity_boost,
                },
            },
        ) as response:
            response.raise_for_status()
            async for chunk in response.aiter_bytes(1024):
                yield chunk


async def list_voices(api_key: str | None = None) -> list:
    """List all available voices."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"{BASE_URL}/voices",
            headers=_headers(api_key),
        )
        response.raise_for_status()
        return response.json().get("voices", [])


async def delete_voice(voice_id: str, api_key: str | None = None) -> bool:
    """Delete a cloned voice."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.delete(
            f"{BASE_URL}/voices/{voice_id}",
            headers=_headers(api_key),
        )
        return response.status_code == 200
```

---

### 6.4 `services/anthropic_llm.py` — Claude API Wrapper

```python
import anthropic
from typing import List, AsyncIterator
from app.config import settings


def _get_client(api_key: str | None = None) -> anthropic.Anthropic:
    key = api_key or settings.anthropic_api_key
    return anthropic.Anthropic(api_key=key)


async def ask(
    messages: List[dict],
    system_prompt: str,
    api_key: str | None = None,
) -> str:
    """
    Send messages to Claude and get a response.
    messages format: [{"role": "user", "content": "..."}, ...]
    """
    client = _get_client(api_key)
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=system_prompt,
        messages=messages,
    )
    return response.content[0].text


async def ask_stream(
    messages: List[dict],
    system_prompt: str,
    api_key: str | None = None,
) -> AsyncIterator[str]:
    """
    Stream Claude's response token by token.
    Yields text delta strings.
    """
    client = _get_client(api_key)

    with client.messages.stream(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=system_prompt,
        messages=messages,
    ) as stream:
        for text in stream.text_stream:
            yield text
```

---

### 6.5 `routers/voice.py` — Voice Endpoints

```python
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Header
from fastapi.responses import Response, StreamingResponse
from typing import List, Optional

from app.services import elevenlabs
from app.models.schemas import SpeakRequest, CloneVoiceResponse

router = APIRouter()


@router.post("/clone", response_model=CloneVoiceResponse)
async def clone_voice(
    name: str = Form(...),
    files: List[UploadFile] = File(...),
    x_elevenlabs_key: Optional[str] = Header(None),
):
    """Clone a voice from uploaded audio samples."""

    if len(files) == 0:
        raise HTTPException(400, "At least one audio file is required")

    # Read all files into memory
    file_data = []
    for f in files:
        content = await f.read()
        if len(content) == 0:
            raise HTTPException(400, f"Empty file: {f.filename}")
        file_data.append((f.filename or "sample.webm", content, f.content_type or "audio/webm"))

    try:
        result = await elevenlabs.clone_voice(
            name=name,
            files=file_data,
            api_key=x_elevenlabs_key,
        )
        return CloneVoiceResponse(voice_id=result["voice_id"], name=result["name"])
    except Exception as e:
        raise HTTPException(502, f"Voice cloning failed: {str(e)}")


@router.post("/speak")
async def text_to_speech(req: SpeakRequest, x_elevenlabs_key: Optional[str] = Header(None)):
    """Convert text to speech using a cloned voice. Returns audio/mpeg bytes."""

    try:
        audio_bytes = await elevenlabs.text_to_speech(
            text=req.text,
            voice_id=req.voice_id,
            stability=req.stability,
            similarity_boost=req.similarity_boost,
            style=req.style,
            api_key=x_elevenlabs_key,
        )
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(502, f"Text-to-speech failed: {str(e)}")


@router.post("/speak-stream")
async def text_to_speech_stream(
    req: SpeakRequest,
    x_elevenlabs_key: Optional[str] = Header(None),
):
    """Stream TTS audio. Returns chunked audio/mpeg."""

    async def generate():
        async for chunk in elevenlabs.text_to_speech_stream(
            text=req.text,
            voice_id=req.voice_id,
            stability=req.stability,
            similarity_boost=req.similarity_boost,
            api_key=x_elevenlabs_key,
        ):
            yield chunk

    return StreamingResponse(generate(), media_type="audio/mpeg")


@router.get("/list")
async def list_voices(x_elevenlabs_key: Optional[str] = Header(None)):
    """List all available voices."""
    try:
        voices = await elevenlabs.list_voices(api_key=x_elevenlabs_key)
        return {
            "voices": [
                {"voice_id": v["voice_id"], "name": v["name"]}
                for v in voices
                if v.get("category") == "cloned"
            ]
        }
    except Exception as e:
        raise HTTPException(502, f"Failed to list voices: {str(e)}")


@router.delete("/{voice_id}")
async def delete_voice(voice_id: str, x_elevenlabs_key: Optional[str] = Header(None)):
    """Delete a cloned voice."""
    success = await elevenlabs.delete_voice(voice_id, api_key=x_elevenlabs_key)
    if not success:
        raise HTTPException(404, "Voice not found or already deleted")
    return {"deleted": True, "voice_id": voice_id}
```

---

### 6.6 `routers/chat.py` — Chat Endpoints

```python
from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import StreamingResponse
from typing import Optional
import json

from app.services import anthropic_llm, elevenlabs
from app.models.schemas import AskRequest, AskResponse, AskAndSpeakRequest

router = APIRouter()


@router.post("/ask", response_model=AskResponse)
async def ask_question(req: AskRequest, x_anthropic_key: Optional[str] = Header(None)):
    """Send a question to Claude and get a text response."""

    messages = [{"role": m.role, "content": m.content} for m in req.history]
    messages.append({"role": "user", "content": req.question})

    try:
        answer = await anthropic_llm.ask(
            messages=messages,
            system_prompt=req.system_prompt,
            api_key=x_anthropic_key,
        )
        return AskResponse(answer=answer)
    except Exception as e:
        raise HTTPException(502, f"Claude API error: {str(e)}")


@router.post("/ask-stream")
async def ask_question_stream(
    req: AskRequest,
    x_anthropic_key: Optional[str] = Header(None),
):
    """Stream Claude's response as Server-Sent Events."""

    messages = [{"role": m.role, "content": m.content} for m in req.history]
    messages.append({"role": "user", "content": req.question})

    async def generate():
        try:
            full_response = ""
            async for token in anthropic_llm.ask_stream(
                messages=messages,
                system_prompt=req.system_prompt,
                api_key=x_anthropic_key,
            ):
                full_response += token
                yield f"data: {json.dumps({'type': 'token', 'text': token})}\n\n"

            yield f"data: {json.dumps({'type': 'done', 'full_text': full_response})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post("/ask-and-speak")
async def ask_and_speak(
    req: AskAndSpeakRequest,
    x_anthropic_key: Optional[str] = Header(None),
    x_elevenlabs_key: Optional[str] = Header(None),
):
    """
    Combined endpoint: Ask Claude a question, then return the answer
    as spoken audio in the cloned voice. Returns audio/mpeg.
    """

    messages = [{"role": m.role, "content": m.content} for m in req.history]
    messages.append({"role": "user", "content": req.question})

    try:
        # Step 1: Get text answer from Claude
        answer = await anthropic_llm.ask(
            messages=messages,
            system_prompt=req.system_prompt,
            api_key=x_anthropic_key,
        )

        # Step 2: Convert answer to speech
        audio_bytes = await elevenlabs.text_to_speech(
            text=answer,
            voice_id=req.voice_id,
            stability=req.stability,
            similarity_boost=req.similarity_boost,
            api_key=x_elevenlabs_key,
        )

        from fastapi.responses import Response
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"X-Agent-Answer": answer[:500]},  # Include text in header
        )
    except Exception as e:
        raise HTTPException(502, f"Ask-and-speak failed: {str(e)}")
```

---

### 6.7 `requirements.txt`

```
fastapi==0.115.6
uvicorn[standard]==0.34.0
httpx==0.28.1
anthropic==0.43.0
python-multipart==0.0.20
python-dotenv==1.0.1
pydantic-settings==2.7.1
slowapi==0.1.9
```

---

### 6.8 Backend `Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ app/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 7. Frontend Implementation

### 7.1 TypeScript Interfaces — `types/index.ts`

```typescript
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Recording {
  id: number;
  blob: Blob;
  duration: number;
  url: string;
}

export interface VoiceInfo {
  voice_id: string;
  name: string;
}

export interface AgentConfig {
  voiceId: string;
  voiceName: string;
  systemPrompt: string;
  elevenLabsKey: string;
}

export type AppStep = "setup" | "record" | "cloning" | "agent";
```

---

### 7.2 API Client — `services/api.ts`

```typescript
import axios from "axios";
import { ChatMessage } from "../types";

const api = axios.create({
  baseURL: "/api",   // Proxied by Vite in dev
  timeout: 60000,
});

// ── Voice ──

export async function cloneVoice(
  name: string,
  files: Blob[],
  elevenLabsKey?: string
): Promise<{ voice_id: string; name: string }> {
  const formData = new FormData();
  formData.append("name", name);
  files.forEach((file, i) => formData.append("files", file, `sample_${i}.webm`));

  const { data } = await api.post("/voice/clone", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      ...(elevenLabsKey && { "x-elevenlabs-key": elevenLabsKey }),
    },
  });
  return data;
}

export async function speak(
  text: string,
  voiceId: string,
  elevenLabsKey?: string
): Promise<Blob> {
  const { data } = await api.post(
    "/voice/speak",
    { text, voice_id: voiceId, stability: 0.5, similarity_boost: 0.8 },
    {
      responseType: "blob",
      headers: elevenLabsKey ? { "x-elevenlabs-key": elevenLabsKey } : {},
    }
  );
  return data;
}

export async function listVoices(
  elevenLabsKey?: string
): Promise<{ voice_id: string; name: string }[]> {
  const { data } = await api.get("/voice/list", {
    headers: elevenLabsKey ? { "x-elevenlabs-key": elevenLabsKey } : {},
  });
  return data.voices;
}

export async function deleteVoice(
  voiceId: string,
  elevenLabsKey?: string
): Promise<void> {
  await api.delete(`/voice/${voiceId}`, {
    headers: elevenLabsKey ? { "x-elevenlabs-key": elevenLabsKey } : {},
  });
}

// ── Chat ──

export async function askQuestion(
  question: string,
  history: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  const { data } = await api.post("/chat/ask", {
    question,
    history,
    system_prompt: systemPrompt,
  });
  return data.answer;
}

export async function askAndSpeak(
  question: string,
  history: ChatMessage[],
  systemPrompt: string,
  voiceId: string,
  elevenLabsKey?: string
): Promise<{ answer: string; audio: Blob }> {
  const response = await api.post(
    "/chat/ask-and-speak",
    {
      question,
      history,
      system_prompt: systemPrompt,
      voice_id: voiceId,
    },
    {
      responseType: "blob",
      headers: elevenLabsKey ? { "x-elevenlabs-key": elevenLabsKey } : {},
    }
  );

  const answer = response.headers["x-agent-answer"] || "";
  return { answer, audio: response.data };
}

// ── Streaming Chat (SSE) ──

export function askQuestionStream(
  question: string,
  history: ChatMessage[],
  systemPrompt: string,
  onToken: (token: string) => void,
  onDone: (fullText: string) => void,
  onError: (error: string) => void
): AbortController {
  const controller = new AbortController();

  fetch("/api/chat/ask-stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, history, system_prompt: systemPrompt }),
    signal: controller.signal,
  })
    .then(async (response) => {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.type === "token") onToken(parsed.text);
              else if (parsed.type === "done") onDone(parsed.full_text);
              else if (parsed.type === "error") onError(parsed.message);
            } catch {
              // skip malformed lines
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== "AbortError") onError(err.message);
    });

  return controller;
}
```

---

### 7.3 Custom Hook — `hooks/useAudioRecorder.ts`

```typescript
import { useState, useRef, useCallback } from "react";
import { Recording } from "../types";

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeRef = useRef(0);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      chunksRef.current = [];
      timeRef.current = 0;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordings((prev) => [
          ...prev,
          { id: Date.now(), blob, duration: timeRef.current, url },
        ]);
        stream.getTracks().forEach((t) => t.stop());
        setRecordingTime(0);
      };

      recorder.start(250); // collect data every 250ms
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        timeRef.current += 1;
        setRecordingTime(timeRef.current);
      }, 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone access.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  }, []);

  const removeRecording = useCallback((id: number) => {
    setRecordings((prev) => {
      const rec = prev.find((r) => r.id === id);
      if (rec) URL.revokeObjectURL(rec.url);
      return prev.filter((r) => r.id !== id);
    });
  }, []);

  const totalDuration = recordings.reduce((sum, r) => sum + r.duration, 0);

  return {
    isRecording,
    recordings,
    recordingTime,
    totalDuration,
    error,
    startRecording,
    stopRecording,
    removeRecording,
  };
}
```

---

### 7.4 Custom Hook — `hooks/useSpeechRecognition.ts`

```typescript
import { useState, useRef, useCallback } from "react";

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(
    (onResult: (transcript: string) => void) => {
      const SpeechRecognition =
        window.SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setError("Speech recognition not supported in this browser. Use Chrome or Edge.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        onResult(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    },
    []
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, error, startListening, stopListening };
}
```

---

### 7.5 Main Hook — `hooks/useVoiceAgent.ts`

```typescript
import { useState, useRef, useCallback } from "react";
import { AppStep, ChatMessage, AgentConfig } from "../types";
import * as api from "../services/api";

export function useVoiceAgent() {
  const [step, setStep] = useState<AppStep>("setup");
  const [config, setConfig] = useState<AgentConfig>({
    voiceId: "",
    voiceName: "My Voice Clone",
    systemPrompt:
      "You are a helpful personal assistant. Answer concisely and conversationally, as if you were the person whose voice you have.",
    elevenLabsKey: "",
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clone voice from recordings
  const cloneVoice = useCallback(
    async (name: string, blobs: Blob[]) => {
      setStep("cloning");
      setError(null);
      try {
        const result = await api.cloneVoice(name, blobs, config.elevenLabsKey);
        setConfig((prev) => ({
          ...prev,
          voiceId: result.voice_id,
          voiceName: result.name,
        }));
        setStep("agent");
      } catch (err: any) {
        setError(err?.response?.data?.detail || err.message || "Cloning failed");
        setStep("record");
      }
    },
    [config.elevenLabsKey]
  );

  // Ask question and play audio response
  const askQuestion = useCallback(
    async (question: string) => {
      if (!question.trim() || isProcessing) return;
      setError(null);
      setIsProcessing(true);

      const updatedMessages: ChatMessage[] = [
        ...messages,
        { role: "user", content: question },
      ];
      setMessages(updatedMessages);

      try {
        // Get text answer from Claude
        const answer = await api.askQuestion(
          question,
          messages,
          config.systemPrompt
        );

        setMessages((prev) => [...prev, { role: "assistant", content: answer }]);

        // Speak the answer if voice is configured
        if (config.voiceId) {
          setIsSpeaking(true);
          try {
            const audioBlob = await api.speak(
              answer,
              config.voiceId,
              config.elevenLabsKey
            );
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.onended = () => {
              setIsSpeaking(false);
              URL.revokeObjectURL(audioUrl);
            };
            audio.onerror = () => setIsSpeaking(false);
            audio.play();
            audioRef.current = audio;
          } catch {
            setIsSpeaking(false);
            // TTS failed but text answer still shows — non-fatal
          }
        }
      } catch (err: any) {
        setError(err?.response?.data?.detail || err.message);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, something went wrong." },
        ]);
      } finally {
        setIsProcessing(false);
      }
    },
    [messages, config, isProcessing]
  );

  const stopSpeaking = useCallback(() => {
    audioRef.current?.pause();
    setIsSpeaking(false);
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return {
    step, setStep,
    config, setConfig,
    messages, isProcessing, isSpeaking, error,
    cloneVoice, askQuestion, stopSpeaking, clearMessages,
    setError,
  };
}
```

---

### 7.6 Vite Config — `vite.config.ts`

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
```

---

### 7.7 Frontend `package.json` (key dependencies)

```json
{
  "name": "voice-agent-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "axios": "^1.7.9",
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.6.3",
    "vite": "^6.0.5"
  }
}
```

---

### 7.8 Component Behavior Specs

#### `ApiKeySetup.tsx` (Step 1)
- Single input for ElevenLabs API key (password field)
- Link to elevenlabs.io to get key
- Info box explaining the flow
- "Continue" button → validates key is not empty → moves to step `record`
- Anthropic key is configured server-side, not entered by user

#### `VoiceRecorder.tsx` (Step 2)
- Voice name text input (default: "My Voice Clone")
- Large circular record button (red when recording)
- Real-time AudioVisualizer showing microphone levels
- Timer showing recording duration
- List of recorded samples with: play button, waveform, duration, delete button
- Total duration counter (minimum 30s required to enable clone button)
- "Clone My Voice" button → sends all blobs to parent's `cloneVoice()` handler
- Tips section about recording quality

#### `CloningStatus.tsx` (Step 3)
- Animated pulsing icon
- Status text (e.g., "Uploading samples...", "Cloning voice...")
- AudioVisualizer animation for visual feedback
- Auto-transitions to step `agent` on success
- Shows error and back button on failure

#### `ChatInterface.tsx` (Step 4)
- Collapsible system prompt editor
- Status bar showing: green dot, voice name, speaking indicator
- Scrollable message area with user/assistant bubbles
- Empty state with instructions
- Input bar with: mic button (Web Speech API), text input, send button
- Typing indicator while waiting for Claude
- Speaking animation while audio plays
- Audio auto-plays when response arrives

#### `AudioVisualizer.tsx`
- Canvas-based bar visualizer
- Props: `isActive: boolean`, `color: string`, `barCount: number`
- Smooth animation using `requestAnimationFrame`
- Bars rise/fall randomly when active, settle when inactive

---

## 8. API Contract

### Voice Endpoints

| Method | Path | Request | Response |
|--------|------|---------|----------|
| `POST` | `/api/voice/clone` | `multipart: name (string), files[] (audio blobs)` | `{ voice_id, name }` |
| `POST` | `/api/voice/speak` | `{ text, voice_id, stability?, similarity_boost?, style? }` | `audio/mpeg` binary |
| `POST` | `/api/voice/speak-stream` | Same as `/speak` | `audio/mpeg` chunked stream |
| `GET` | `/api/voice/list` | — | `{ voices: [{ voice_id, name }] }` |
| `DELETE` | `/api/voice/{voice_id}` | — | `{ deleted: true, voice_id }` |

### Chat Endpoints

| Method | Path | Request | Response |
|--------|------|---------|----------|
| `POST` | `/api/chat/ask` | `{ question, history[], system_prompt }` | `{ answer }` |
| `POST` | `/api/chat/ask-stream` | Same as `/ask` | SSE stream: `{ type: "token"/"done"/"error", text/full_text/message }` |
| `POST` | `/api/chat/ask-and-speak` | `{ question, history[], system_prompt, voice_id, stability?, similarity_boost? }` | `audio/mpeg` + `X-Agent-Answer` header |

### Common Headers

| Header | Purpose | When |
|--------|---------|------|
| `x-elevenlabs-key` | Override server ElevenLabs key | Optional, voice endpoints |
| `x-anthropic-key` | Override server Anthropic key | Optional, chat endpoints |

### Error Response Format

```json
{
  "detail": "Human-readable error message"
}
```

HTTP status codes: `400` (bad input), `502` (external API failure), `404` (not found), `500` (server error)

---

## 9. External API Reference

### ElevenLabs API

**Base URL:** `https://api.elevenlabs.io/v1`

**Authentication:** Header `xi-api-key: <key>`

**Clone Voice:**
```
POST /voices/add
Content-Type: multipart/form-data

Fields: name (string), description (string), files (audio files)
Response: { "voice_id": "abc123" }
```

**Text to Speech:**
```
POST /text-to-speech/{voice_id}
Content-Type: application/json

Body: {
  "text": "Hello world",
  "model_id": "eleven_turbo_v2_5",
  "voice_settings": {
    "stability": 0.5,           // 0.0-1.0, lower = more varied
    "similarity_boost": 0.8,    // 0.0-1.0, higher = closer to original
    "style": 0.3                // 0.0-1.0, style exaggeration
  }
}
Response: audio/mpeg binary
```

**Streaming TTS:**
```
POST /text-to-speech/{voice_id}/stream
Same body as above
Response: chunked audio/mpeg
```

**List Voices:** `GET /voices` → `{ "voices": [...] }`

**Delete Voice:** `DELETE /voices/{voice_id}`

**Docs:** https://elevenlabs.io/docs/api-reference

---

### Anthropic Claude API

**Base URL:** `https://api.anthropic.com/v1`

**Authentication:** Header `x-api-key: <key>`, `anthropic-version: 2023-06-01`

**Create Message:**
```
POST /messages
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1024,
  "system": "System prompt here",
  "messages": [
    { "role": "user", "content": "Question" }
  ]
}
Response: {
  "content": [{ "type": "text", "text": "Answer" }]
}
```

**Streaming:** Use the `anthropic` Python SDK's `.messages.stream()` method.

**Docs:** https://docs.anthropic.com/en/api/messages

---

## 10. Implementation Order

Follow this order for smooth incremental development. Each phase produces a testable, working feature.

### Phase 1: Scaffold (Day 1–2)
1. Create the folder structure from Section 4
2. Set up backend: `main.py`, `config.py`, health endpoint
3. Run: `uvicorn app.main:app --reload` → verify `/api/health`
4. Scaffold frontend: `npm create vite@latest frontend -- --template react-ts`
5. Install deps, configure Tailwind, set up Vite proxy
6. Create `App.tsx` with step-based routing (4 steps)
7. Build `ApiKeySetup.tsx` (Step 1)
8. Verify: frontend at `:5173` proxying to backend at `:8000`

### Phase 2: Voice Recording & Cloning (Day 3–5)
1. Implement `useAudioRecorder` hook
2. Build `VoiceRecorder.tsx` with record/play/delete
3. Build `AudioVisualizer.tsx` (canvas bars)
4. Implement `services/elevenlabs.py` — `clone_voice()` function
5. Implement `routers/voice.py` — `POST /api/voice/clone`
6. Implement `services/api.ts` — `cloneVoice()` client function
7. Build `CloningStatus.tsx` (Step 3)
8. Test end-to-end: record → upload → clone → get voice_id

### Phase 3: AI Q&A with Voice (Day 6–8)
1. Implement `services/anthropic_llm.py` — `ask()` function
2. Implement `routers/chat.py` — `POST /api/chat/ask`
3. Implement `services/elevenlabs.py` — `text_to_speech()`
4. Implement `routers/voice.py` — `POST /api/voice/speak`
5. Build `ChatInterface.tsx` with text input and message display
6. Implement `services/api.ts` — `askQuestion()` and `speak()`
7. Wire up `useVoiceAgent` hook
8. Test: type question → see answer → hear cloned voice

### Phase 4: Polish & Extras (Day 9–11)
1. Add `useSpeechRecognition` hook for voice input
2. Add streaming: `ask-stream` endpoint + SSE client
3. Add `ask-and-speak` combined endpoint
4. Implement all remaining voice endpoints (list, delete)
5. Add system prompt editor (collapsible)
6. Polish UI: animations, loading states, error messages
7. Mobile responsiveness
8. Test all edge cases

### Phase 5: Deploy (Day 12–14)
1. Write Dockerfile for backend
2. Write `docker-compose.yml`
3. Deploy backend to Railway/Render
4. Deploy frontend to Vercel
5. Update CORS origins for production
6. Write `README.md` with setup instructions and screenshots
7. Record a demo video/GIF

---

## 11. Error Handling

### Backend Error Strategy

```python
# All external API calls wrapped in try/except
# Return proper HTTP codes with human-readable messages

try:
    result = await elevenlabs.clone_voice(...)
except httpx.HTTPStatusError as e:
    # External API returned an error
    detail = e.response.json().get("detail", {}).get("message", str(e))
    raise HTTPException(status_code=502, detail=f"ElevenLabs error: {detail}")
except httpx.TimeoutException:
    raise HTTPException(status_code=504, detail="External API timed out")
except Exception as e:
    raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
```

### Frontend Error Strategy

```typescript
// Catch errors from API calls, show in UI, don't crash
try {
  const answer = await api.askQuestion(question, history, systemPrompt);
  // success path
} catch (err: any) {
  const message =
    err?.response?.data?.detail ||   // FastAPI error
    err?.message ||                   // Network/JS error
    "Something went wrong";
  setError(message);
}
```

### Key Error Cases to Handle

| Scenario | Backend Response | Frontend Behavior |
|----------|-----------------|-------------------|
| No audio files uploaded | 400: "At least one audio file required" | Show error, stay on record step |
| ElevenLabs API key invalid | 502: "ElevenLabs error: Invalid API key" | Show error, go back to setup |
| Voice cloning fails | 502: with ElevenLabs error detail | Show error, stay on record step |
| Claude API fails | 502: "Claude API error: ..." | Show error in chat, keep history |
| TTS fails after getting answer | Text answer still displays | Show text, skip audio silently |
| Network timeout | 504: "External API timed out" | Show retry suggestion |
| Mic access denied | N/A (browser-side) | Show "Please allow microphone" |

---

## 12. Deployment

### docker-compose.yml

```yaml
version: "3.8"

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file:
      - .env
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped
```

### Frontend Dockerfile (production)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

### Frontend `nginx.conf`

```nginx
server {
    listen 3000;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Vercel + Railway Setup

**Frontend (Vercel):**
- Connect GitHub repo, set root directory to `frontend/`
- Add environment variable: `VITE_API_URL=https://your-backend.railway.app`
- Update `api.ts` base URL to use `import.meta.env.VITE_API_URL` in production

**Backend (Railway):**
- Connect GitHub repo, set root directory to `backend/`
- Add all env vars from `.env`
- Railway auto-detects the Dockerfile

---

## .gitignore

```
# Dependencies
node_modules/
__pycache__/
*.pyc
venv/

# Environment
.env
.env.local

# Build
dist/
build/
*.egg-info/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db
```
