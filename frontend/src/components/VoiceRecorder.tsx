import { useState } from "react";
import { Mic, Square, Play, Trash2, Upload } from "lucide-react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import AudioVisualizer from "./AudioVisualizer";

interface VoiceRecorderProps {
  onClone: (name: string, blobs: Blob[]) => void;
}

export default function VoiceRecorder({ onClone }: VoiceRecorderProps) {
  const [voiceName, setVoiceName] = useState("My Voice Clone");
  const {
    isRecording,
    recordings,
    recordingTime,
    totalDuration,
    error,
    startRecording,
    stopRecording,
    removeRecording,
  } = useAudioRecorder();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleClone = () => {
    const blobs = recordings.map((r) => r.blob);
    onClone(voiceName, blobs);
  };

  const canClone = totalDuration >= 30 && voiceName.trim().length > 0;

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Record Your Voice</h2>
        <p className="text-gray-400 text-sm">
          Record at least 30 seconds of clear speech for best results.
        </p>
      </div>

      {/* Voice Name Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Voice Name
        </label>
        <input
          type="text"
          value={voiceName}
          onChange={(e) => setVoiceName(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Visualizer */}
      <div className="mb-4">
        <AudioVisualizer isActive={isRecording} color="#ef4444" />
      </div>

      {/* Record Button */}
      <div className="flex flex-col items-center mb-6">
        {isRecording ? (
          <>
            <button
              onClick={stopRecording}
              className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors shadow-lg shadow-red-600/30"
            >
              <Square size={28} fill="white" />
            </button>
            <span className="mt-3 text-red-400 font-mono text-lg">
              {formatTime(recordingTime)}
            </span>
          </>
        ) : (
          <button
            onClick={startRecording}
            className="w-20 h-20 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors border-2 border-gray-600"
          >
            <Mic size={32} className="text-red-400" />
          </button>
        )}
        {!isRecording && (
          <span className="mt-2 text-gray-500 text-sm">Tap to record</span>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center mb-4">{error}</p>
      )}

      {/* Recordings List */}
      {recordings.length > 0 && (
        <div className="space-y-2 mb-6">
          <h3 className="text-sm font-medium text-gray-400">
            Recordings ({recordings.length}) — Total: {formatTime(totalDuration)}
          </h3>
          {recordings.map((rec) => (
            <div
              key={rec.id}
              className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg"
            >
              <button
                onClick={() => new Audio(rec.url).play()}
                className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0"
              >
                <Play size={14} />
              </button>
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${Math.min(100, (rec.duration / 60) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 font-mono w-10">
                {formatTime(rec.duration)}
              </span>
              <button
                onClick={() => removeRecording(rec.id)}
                className="text-gray-500 hover:text-red-400 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Clone Button */}
      <button
        onClick={handleClone}
        disabled={!canClone}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
      >
        <Upload size={18} />
        Clone My Voice
      </button>

      {!canClone && totalDuration > 0 && totalDuration < 30 && (
        <p className="text-center text-xs text-gray-500 mt-2">
          Need {30 - totalDuration} more seconds of audio
        </p>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <p className="text-xs font-medium text-gray-300 mb-2">Tips for better cloning:</p>
        <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
          <li>Speak naturally in a quiet environment</li>
          <li>Vary your tone and pitch slightly</li>
          <li>More audio = better voice quality</li>
          <li>Avoid background noise and music</li>
        </ul>
      </div>
    </div>
  );
}
