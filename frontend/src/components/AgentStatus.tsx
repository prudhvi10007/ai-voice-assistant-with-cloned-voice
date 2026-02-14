interface AgentStatusProps {
  voiceName: string;
  isSpeaking: boolean;
}

export default function AgentStatus({ voiceName, isSpeaking }: AgentStatusProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-800 rounded-lg">
      <div className="relative">
        <div className="w-3 h-3 bg-green-500 rounded-full" />
        {isSpeaking && (
          <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping" />
        )}
      </div>
      <span className="text-sm text-gray-300">
        {voiceName}
      </span>
      {isSpeaking && (
        <span className="text-xs text-indigo-400 animate-pulse">
          Speaking...
        </span>
      )}
    </div>
  );
}
