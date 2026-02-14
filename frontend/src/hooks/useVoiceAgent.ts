import { useState, useRef, useCallback } from "react";
import { AppStep, ChatMessage, AgentConfig } from "../types";
import * as api from "../services/api";

export function useVoiceAgent() {
  const [step, setStep] = useState<AppStep>("record");
  const [config, setConfig] = useState<AgentConfig>({
    voiceId: "",
    voiceName: "My Voice Clone",
    systemPrompt:
      "You are a helpful personal assistant. Answer concisely and conversationally, as if you were the person whose voice you have.",
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cloneVoice = useCallback(
    async (name: string, blobs: Blob[]) => {
      setStep("cloning");
      setError(null);
      try {
        const result = await api.cloneVoice(name, blobs);
        setConfig((prev) => ({
          ...prev,
          voiceId: result.voice_id,
          voiceName: result.name,
        }));
        setStep("agent");
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } }; message?: string };
        setError(error?.response?.data?.detail || error?.message || "Cloning failed");
        setStep("record");
      }
    },
    []
  );

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
        const answer = await api.askQuestion(
          question,
          messages,
          config.systemPrompt
        );

        setMessages((prev) => [...prev, { role: "assistant", content: answer }]);

        if (config.voiceId) {
          setIsSpeaking(true);
          try {
            const audioBlob = await api.speak(
              answer,
              config.voiceId
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
          }
        }
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } }; message?: string };
        setError(error?.response?.data?.detail || error?.message || "Something went wrong");
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
