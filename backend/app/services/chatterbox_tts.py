import os
import io
import uuid
import torch
import torchaudio as ta
from pathlib import Path
from chatterbox.tts import ChatterboxTTS

from app.config import settings

# ── Global model (loaded once at startup) ──
_model: ChatterboxTTS | None = None


def get_model() -> ChatterboxTTS:
    """Load the Chatterbox model (lazy singleton)."""
    global _model
    if _model is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Loading Chatterbox TTS model on {device}...")
        _model = ChatterboxTTS.from_pretrained(device=device)
        print("Chatterbox TTS model loaded.")
    return _model


def get_voice_dir() -> Path:
    """Get the directory where voice samples are stored."""
    voice_dir = Path(settings.voice_samples_dir)
    voice_dir.mkdir(parents=True, exist_ok=True)
    return voice_dir


def save_voice_sample(filename: str, audio_bytes: bytes) -> str:
    """
    Save an uploaded voice sample to disk.
    Returns the saved file path.
    """
    voice_dir = get_voice_dir()
    filepath = voice_dir / filename
    with open(filepath, "wb") as f:
        f.write(audio_bytes)
    return str(filepath)


def clone_voice(
    name: str,
    audio_files: list[tuple[str, bytes]],  # [(filename, content)]
) -> dict:
    """
    'Clone' a voice by saving the reference audio file.
    Chatterbox doesn't need a separate cloning step —
    it uses a reference audio file at generation time (zero-shot).

    We save the FIRST file as the reference and return a voice_id.
    For best quality, the reference should be 5-30 seconds of clean speech.
    """
    voice_id = str(uuid.uuid4())[:8]
    voice_dir = get_voice_dir()

    # Save primary reference audio
    primary_file = audio_files[0]
    ext = primary_file[0].rsplit(".", 1)[-1] if "." in primary_file[0] else "webm"
    ref_filename = f"{voice_id}_ref.{ext}"
    ref_path = voice_dir / ref_filename

    with open(ref_path, "wb") as f:
        f.write(primary_file[1])

    # If webm, convert to wav for Chatterbox compatibility
    wav_path = voice_dir / f"{voice_id}_ref.wav"
    if ext != "wav":
        try:
            waveform, sr = ta.load(str(ref_path))
            # Resample to 24kHz if needed (Chatterbox prefers 24k+)
            if sr != 24000:
                resampler = ta.transforms.Resample(orig_freq=sr, new_freq=24000)
                waveform = resampler(waveform)
            # Convert to mono if stereo
            if waveform.shape[0] > 1:
                waveform = waveform.mean(dim=0, keepdim=True)
            ta.save(str(wav_path), waveform, 24000)
        except Exception:
            # Fallback: just save raw bytes as wav
            wav_path = ref_path

    # Save metadata
    meta_path = voice_dir / f"{voice_id}.meta"
    with open(meta_path, "w") as f:
        f.write(f"{name}\n{wav_path}")

    return {"voice_id": voice_id, "name": name}


def text_to_speech(
    text: str,
    voice_id: str,
    exaggeration: float = 0.5,
    cfg_weight: float = 0.5,
) -> bytes:
    """
    Generate speech from text using a cloned voice reference.
    Returns: raw WAV audio bytes.
    """
    model = get_model()
    voice_dir = get_voice_dir()

    # Load the reference audio path from metadata
    meta_path = voice_dir / f"{voice_id}.meta"
    if not meta_path.exists():
        raise FileNotFoundError(f"Voice '{voice_id}' not found")

    lines = meta_path.read_text().strip().split("\n")
    ref_audio_path = lines[1] if len(lines) > 1 else None

    if ref_audio_path and os.path.exists(ref_audio_path):
        wav = model.generate(
            text,
            audio_prompt_path=ref_audio_path,
            exaggeration=exaggeration,
            cfg_weight=cfg_weight,
        )
    else:
        # No reference — use default voice
        wav = model.generate(text)

    # Convert tensor to WAV bytes
    buffer = io.BytesIO()
    ta.save(buffer, wav, model.sr, format="wav")
    buffer.seek(0)
    return buffer.read()


def list_voices() -> list[dict]:
    """List all saved voice clones."""
    voice_dir = get_voice_dir()
    voices = []
    for meta_file in voice_dir.glob("*.meta"):
        voice_id = meta_file.stem
        lines = meta_file.read_text().strip().split("\n")
        name = lines[0] if lines else voice_id
        voices.append({"voice_id": voice_id, "name": name})
    return voices


def delete_voice(voice_id: str) -> bool:
    """Delete a voice clone and its files."""
    voice_dir = get_voice_dir()
    deleted = False

    for f in voice_dir.glob(f"{voice_id}*"):
        f.unlink()
        deleted = True

    return deleted
