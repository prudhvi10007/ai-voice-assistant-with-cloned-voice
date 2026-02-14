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
