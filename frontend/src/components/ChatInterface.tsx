import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Volume2, VolumeX, ChevronDown, ChevronUp, Settings, Trash2 } from "lucide-react";
import { ChatMessage } from "../types";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import MessageBubble from "./MessageBubble";
import AgentStatus from "./AgentStatus";
import AudioVisualizer from "./AudioVisualizer";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  voiceName: string;
  isProcessing: boolean;
  isSpeaking: boolean;
  error: string | null;
  systemPrompt: string;
  onAsk: (question: string) => void;
  onStopSpeaking: () => void;
  onClearMessages: () => void;
  onSystemPromptChange: (prompt: string) => void;
}

export default function ChatInterface({
  messages,
  voiceName,
  isProcessing,
  isSpeaking,
  error,
  systemPrompt,
  onAsk,
  onStopSpeaking,
  onClearMessages,
  onSystemPromptChange,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isListening, startListening, stopListening } = useSpeechRecognition();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onAsk(input.trim());
      setInput("");
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((transcript) => {
        setInput(transcript);
      });
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <AgentStatus voiceName={voiceName} isSpeaking={isSpeaking} />
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <button
              onClick={onStopSpeaking}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Stop speaking"
            >
              <VolumeX size={18} />
            </button>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings size={18} />
          </button>
          {messages.length > 0 && (
            <button
              onClick={onClearMessages}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              title="Clear chat"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* System Prompt Editor (collapsible) */}
      {showSettings && (
        <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowSettings(!showSettings)}
          >
            <span className="text-sm font-medium text-gray-300">System Prompt</span>
            {showSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          <textarea
            value={systemPrompt}
            onChange={(e) => onSystemPromptChange(e.target.value)}
            rows={3}
            className="mt-2 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Volume2 size={48} className="text-gray-700 mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              Ready to chat!
            </h3>
            <p className="text-sm text-gray-600 max-w-xs">
              Ask a question and hear the answer in your cloned voice. Type or use the microphone.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {isProcessing && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-800 rounded-2xl rounded-bl-md">
              <span className="text-sm text-gray-400">Thinking...</span>
            </div>
          </div>
        )}
        {isSpeaking && (
          <div className="px-4">
            <AudioVisualizer isActive={true} color="#6366f1" barCount={15} height={30} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-xs text-center mb-2">{error}</p>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleMicClick}
          className={`p-3 rounded-lg transition-colors flex-shrink-0 ${
            isListening
              ? "bg-red-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={isProcessing}
          className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex-shrink-0"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
