# 🎙 Voice Agent

> Clone your voice. Answer as you. AI-powered voice clone agent built with React, FastAPI, ElevenLabs, and Claude.

## What It Does

Record your voice → AI clones it → Ask questions → AI answers in your voice

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI, uvicorn |
| Voice AI | ElevenLabs (voice cloning + TTS) |
| LLM | Anthropic Claude (question answering) |
| Speech Input | Web Speech API (browser-native) |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- [ElevenLabs API Key](https://elevenlabs.io) (free tier works)
- [Anthropic API Key](https://console.anthropic.com)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Add your API keys
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## API Docs

FastAPI auto-generates interactive docs at http://localhost:8000/docs

## Project Structure

```
voice-agent/
├── backend/          # Python FastAPI
│   ├── app/
│   │   ├── main.py           # App entry point
│   │   ├── config.py         # Environment config
│   │   ├── routers/          # API endpoints
│   │   │   ├── voice.py      # Clone, TTS, list, delete
│   │   │   └── chat.py       # Ask, stream, ask-and-speak
│   │   ├── services/         # External API wrappers
│   │   │   ├── elevenlabs.py
│   │   │   └── anthropic_llm.py
│   │   └── models/
│   │       └── schemas.py    # Pydantic models
│   └── requirements.txt
├── frontend/         # React + Vite
│   └── src/
│       ├── components/       # UI components
│       ├── hooks/            # Custom React hooks
│       ├── services/         # API client
│       └── types/            # TypeScript interfaces
├── PROJECT_SPEC.md   # Full implementation spec
└── docker-compose.yml
```

## Environment Variables

```env
ELEVENLABS_API_KEY=xi-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
ALLOWED_ORIGINS=http://localhost:5173
```

## Deployment

```bash
docker-compose up --build
```

Or deploy separately:
- **Frontend** → Vercel
- **Backend** → Railway / Render

## Roadmap

- [ ] Phone integration (Twilio)
- [ ] Knowledge base / RAG
- [ ] Multi-language support
- [ ] Conversation memory (PostgreSQL)
- [ ] Real-time streaming audio
- [ ] Analytics dashboard

## License

MIT
