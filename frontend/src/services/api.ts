import axios from "axios";
import { ChatMessage } from "../types";

const api = axios.create({
  baseURL: "/api",
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
