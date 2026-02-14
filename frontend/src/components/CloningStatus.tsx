import { Loader2, ArrowLeft } from "lucide-react";
import AudioVisualizer from "./AudioVisualizer";

interface CloningStatusProps {
  error: string | null;
  onBack: () => void;
}

export default function CloningStatus({ error, onBack }: CloningStatusProps) {
  if (error) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">!</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Cloning Failed</h2>
        <p className="text-red-400 text-sm mb-6">{error}</p>
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors mx-auto"
        >
          <ArrowLeft size={16} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-6">
        <Loader2 size={48} className="text-indigo-500 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Cloning Your Voice</h2>
        <p className="text-gray-400 text-sm">
          Uploading samples and creating your voice clone...
        </p>
      </div>

      <div className="mb-6">
        <AudioVisualizer isActive={true} color="#6366f1" barCount={30} height={80} />
      </div>

      <p className="text-xs text-gray-500">This may take 30–60 seconds</p>
    </div>
  );
}
