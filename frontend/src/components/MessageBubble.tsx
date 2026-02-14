import { ChatMessage } from "../types";
import { User, Bot } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-indigo-600" : "bg-gray-700"
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl ${
          isUser
            ? "bg-indigo-600 text-white rounded-br-md"
            : "bg-gray-800 text-gray-100 rounded-bl-md"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
