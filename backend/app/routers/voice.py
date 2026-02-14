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
