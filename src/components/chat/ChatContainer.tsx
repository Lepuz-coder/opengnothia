import { useEffect, useRef } from "react";
import { Brain, Loader2 } from "lucide-react";
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
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="px-4 py-6 space-y-6">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="w-14 h-14 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
              <Brain className="w-7 h-7 text-accent-500 dark:text-accent-400" />
            </div>
            <div className="text-center">
              <p className="text-[var(--text-secondary)] text-base font-medium">Merhaba, nasılsın?</p>
              <p className="text-[var(--text-muted)] text-sm mt-1">Seansa başlamak için bir mesaj yaz...</p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex gap-3 max-w-3xl mx-auto w-full">
            <div className="w-8 h-8 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 text-accent-600 animate-spin" />
            </div>
            <div className="pt-2">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:0ms]" />
                <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:150ms]" />
                <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
