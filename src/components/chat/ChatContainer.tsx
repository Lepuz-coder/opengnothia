import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatContainerProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  isStreaming?: boolean;
}

export function ChatContainer({ messages, isLoading, isStreaming }: ChatContainerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const showLoadingDots = isLoading && !isStreaming;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-4 py-6 min-h-full flex flex-col justify-end gap-6">
        {messages.length === 0 && !isLoading && !isStreaming && (
          <div className="flex items-center justify-center flex-1">
            <p className="text-[var(--text-muted)] text-sm">Hazırlanıyor...</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} id={`msg-${msg.id}`}>
            <ChatMessage message={msg} />
          </div>
        ))}
        {showLoadingDots && (
          <div className="py-2">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:0ms]" />
              <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:150ms]" />
              <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
