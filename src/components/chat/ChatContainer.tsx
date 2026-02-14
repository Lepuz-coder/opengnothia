import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatContainerProps {
  messages: ChatMessageType[];
  isLoading: boolean;
}

export function ChatContainer({ messages, isLoading }: ChatContainerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
      {messages.length === 0 && !isLoading && (
        <div className="flex items-center justify-center h-full">
          <p className="text-[var(--text-muted)] text-sm">Seansa başlamak için bir mesaj yaz...</p>
        </div>
      )}
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      {isLoading && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-900/30 flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-accent-400 animate-spin" />
          </div>
          <div className="bg-[var(--bg-tertiary)] rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:0ms]" />
              <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:150ms]" />
              <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
