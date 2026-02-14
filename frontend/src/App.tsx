import { useVoiceAgent } from "./hooks/useVoiceAgent";
import ApiKeySetup from "./components/ApiKeySetup";
import VoiceRecorder from "./components/VoiceRecorder";
import CloningStatus from "./components/CloningStatus";
import ChatInterface from "./components/ChatInterface";
import { Mic } from "lucide-react";

export default function App() {
  const {
    step,
    setStep,
    config,
    setConfig,
    messages,
    isProcessing,
    isSpeaking,
    error,
    cloneVoice,
    askQuestion,
    stopSpeaking,
    clearMessages,
    setError,
  } = useVoiceAgent();

  const handleApiKeyComplete = (elevenLabsKey: string) => {
    setConfig((prev) => ({ ...prev, elevenLabsKey }));
    setStep("record");
  };

  const handleSystemPromptChange = (prompt: string) => {
    setConfig((prev) => ({ ...prev, systemPrompt: prompt }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Mic size={18} />
          </div>
          <h1 className="text-lg font-semibold">Voice Agent</h1>
          {/* Step indicator */}
          <div className="ml-auto flex items-center gap-2">
            {(["setup", "record", "cloning", "agent"] as const).map((s, i) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full ${
                  step === s
                    ? "bg-indigo-500"
                    : i < ["setup", "record", "cloning", "agent"].indexOf(step)
                    ? "bg-indigo-500/50"
                    : "bg-gray-700"
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-65px)] flex flex-col">
        {step === "setup" && (
          <ApiKeySetup onComplete={handleApiKeyComplete} />
        )}
        {step === "record" && (
          <VoiceRecorder onClone={cloneVoice} />
        )}
        {step === "cloning" && (
          <CloningStatus
            error={error}
            onBack={() => {
              setError(null);
              setStep("record");
            }}
          />
        )}
        {step === "agent" && (
          <ChatInterface
            messages={messages}
            voiceName={config.voiceName}
            isProcessing={isProcessing}
            isSpeaking={isSpeaking}
            error={error}
            systemPrompt={config.systemPrompt}
            onAsk={askQuestion}
            onStopSpeaking={stopSpeaking}
            onClearMessages={clearMessages}
            onSystemPromptChange={handleSystemPromptChange}
          />
        )}
      </main>
    </div>
  );
}
