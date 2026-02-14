import { useState, useRef, useCallback } from "react";

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(
    (onResult: (transcript: string) => void) => {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognitionAPI) {
        setError("Speech recognition not supported in this browser. Use Chrome or Edge.");
        return;
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        onResult(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    },
    []
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, error, startListening, stopListening };
}
