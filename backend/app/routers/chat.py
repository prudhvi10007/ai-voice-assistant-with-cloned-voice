from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import StreamingResponse, Response
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

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"X-Agent-Answer": answer[:500]},
        )
    except Exception as e:
        raise HTTPException(502, f"Ask-and-speak failed: {str(e)}")
