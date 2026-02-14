import { useState } from "react";
import { KeyRound, ArrowRight, Info } from "lucide-react";

interface ApiKeySetupProps {
  onComplete: (elevenLabsKey: string) => void;
}

export default function ApiKeySetup({ onComplete }: ApiKeySetupProps) {
  const [key, setKey] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onComplete(key.trim());
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <KeyRound size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to Voice Agent</h2>
        <p className="text-gray-400">
          Clone your voice and let AI answer questions sounding like you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            ElevenLabs API Key
          </label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="xi-xxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <a
            href="https://elevenlabs.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 inline-block"
          >
            Get your free API key at elevenlabs.io
          </a>
        </div>

        <button
          type="submit"
          disabled={!key.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          Continue
          <ArrowRight size={18} />
        </button>
      </form>

      <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-400">
            <p className="font-medium text-gray-300 mb-1">How it works:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Record your voice (30+ seconds)</li>
              <li>AI clones your voice with ElevenLabs</li>
              <li>Ask questions — AI answers as you</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
