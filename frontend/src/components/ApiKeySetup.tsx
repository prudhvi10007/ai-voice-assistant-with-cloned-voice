import { Mic, ArrowRight, Info } from "lucide-react";

interface ApiKeySetupProps {
  onComplete: () => void;
}

export default function ApiKeySetup({ onComplete }: ApiKeySetupProps) {
  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mic size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to Voice Agent</h2>
        <p className="text-gray-400">
          Clone your voice and let AI answer questions sounding like you.
          Powered by Groq + Chatterbox TTS — completely free.
        </p>
      </div>

      <button
        onClick={onComplete}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
      >
        Get Started
        <ArrowRight size={18} />
      </button>

      <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-400">
            <p className="font-medium text-gray-300 mb-1">How it works:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Record your voice (30+ seconds)</li>
              <li>AI clones your voice with Chatterbox TTS</li>
              <li>Ask questions — AI answers as you</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
