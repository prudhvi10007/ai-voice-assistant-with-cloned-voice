from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, Response
import json

from app.services import groq_llm, chatterbox_tts
from app.models.schemas import AskRequest, AskResponse, AskAndSpeakRequest

router = APIRouter()


@router.post("/ask", response_model=AskResponse)
async def ask_question(req: AskRequest):
    """Send a question to Groq and get a text response."""
    messages = [{"role": m.role, "content": m.content} for m in req.history]
    messages.append({"role": "user", "content": req.question})

    try:
        answer = groq_llm.ask(
            messages=messages,
            system_prompt=req.system_prompt,
        )
        return AskResponse(answer=answer)
    except Exception as e:
        raise HTTPException(502, f"Groq API error: {str(e)}")


@router.post("/ask-stream")
async def ask_question_stream(req: AskRequest):
    """Stream Groq's response as Server-Sent Events."""
    messages = [{"role": m.role, "content": m.content} for m in req.history]
    messages.append({"role": "user", "content": req.question})

    def generate():
        try:
            full_response = ""
            for token in groq_llm.ask_stream(
                messages=messages,
                system_prompt=req.system_prompt,
            ):
                full_response += token
                yield f"data: {json.dumps({'type': 'token', 'text': token})}\n\n"

            yield f"data: {json.dumps({'type': 'done', 'full_text': full_response})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post("/ask-and-speak")
async def ask_and_speak(req: AskAndSpeakRequest):
    """Ask Groq a question, then return the answer as spoken audio."""
    messages = [{"role": m.role, "content": m.content} for m in req.history]
    messages.append({"role": "user", "content": req.question})

    try:
        # Step 1: Get text answer from Groq
        answer = groq_llm.ask(
            messages=messages,
            system_prompt=req.system_prompt,
        )

        # Step 2: Convert to speech with Chatterbox
        audio_bytes = chatterbox_tts.text_to_speech(
            text=answer,
            voice_id=req.voice_id,
        )

        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={"X-Agent-Answer": answer[:500]},
        )
    except Exception as e:
        raise HTTPException(502, f"Ask-and-speak failed: {str(e)}")
