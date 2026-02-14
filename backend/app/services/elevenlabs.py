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
