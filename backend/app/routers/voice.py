from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from typing import List

from app.services import chatterbox_tts
from app.models.schemas import SpeakRequest, CloneVoiceResponse

router = APIRouter()


@router.post("/clone", response_model=CloneVoiceResponse)
async def clone_voice(
    name: str = Form(...),
    files: List[UploadFile] = File(...),
):
    """Clone a voice from uploaded audio samples."""
    if len(files) == 0:
        raise HTTPException(400, "At least one audio file is required")

    audio_files = []
    for f in files:
        content = await f.read()
        if len(content) == 0:
            raise HTTPException(400, f"Empty file: {f.filename}")
        audio_files.append((f.filename or "sample.webm", content))

    try:
        result = chatterbox_tts.clone_voice(name=name, audio_files=audio_files)
        return CloneVoiceResponse(voice_id=result["voice_id"], name=result["name"])
    except Exception as e:
        raise HTTPException(500, f"Voice cloning failed: {str(e)}")


@router.post("/speak")
async def text_to_speech(req: SpeakRequest):
    """Convert text to speech using a cloned voice. Returns audio/wav bytes."""
    try:
        audio_bytes = chatterbox_tts.text_to_speech(
            text=req.text,
            voice_id=req.voice_id,
        )
        return Response(content=audio_bytes, media_type="audio/wav")
    except FileNotFoundError:
        raise HTTPException(404, f"Voice '{req.voice_id}' not found")
    except Exception as e:
        raise HTTPException(500, f"Text-to-speech failed: {str(e)}")


@router.get("/list")
async def list_voices():
    """List all saved voice clones."""
    voices = chatterbox_tts.list_voices()
    return {"voices": voices}


@router.delete("/{voice_id}")
async def delete_voice(voice_id: str):
    """Delete a cloned voice."""
    success = chatterbox_tts.delete_voice(voice_id)
    if not success:
        raise HTTPException(404, "Voice not found or already deleted")
    return {"deleted": True, "voice_id": voice_id}
