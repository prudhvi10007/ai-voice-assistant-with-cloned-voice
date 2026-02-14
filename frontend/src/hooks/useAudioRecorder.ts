import { useState, useRef, useCallback } from "react";
import { Recording } from "../types";

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeRef = useRef(0);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      chunksRef.current = [];
      timeRef.current = 0;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordings((prev) => [
          ...prev,
          { id: Date.now(), blob, duration: timeRef.current, url },
        ]);
        stream.getTracks().forEach((t) => t.stop());
        setRecordingTime(0);
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        timeRef.current += 1;
        setRecordingTime(timeRef.current);
      }, 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone access.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  }, []);

  const removeRecording = useCallback((id: number) => {
    setRecordings((prev) => {
      const rec = prev.find((r) => r.id === id);
      if (rec) URL.revokeObjectURL(rec.url);
      return prev.filter((r) => r.id !== id);
    });
  }, []);

  const totalDuration = recordings.reduce((sum, r) => sum + r.duration, 0);

  return {
    isRecording,
    recordings,
    recordingTime,
    totalDuration,
    error,
    startRecording,
    stopRecording,
    removeRecording,
  };
}
