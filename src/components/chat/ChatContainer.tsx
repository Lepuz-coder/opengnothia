import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n";
import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatContainerProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  isStreaming?: boolean;
  isCompacting?: boolean;
}

export function ChatContainer({ messages, isLoading, isStreaming, isCompacting }: ChatContainerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isCompacting]);

  const showLoadingDots = isLoading && !isStreaming;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-4 py-6 min-h-full flex flex-col gap-6">
        {messages.length === 0 && !isLoading && !isStreaming && (
          <div className="flex items-center justify-center flex-1">
            <p className="text-[var(--text-muted)] text-sm">{t.chat.preparing}</p>
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
        {isCompacting && (
          <div className="py-4 px-4 rounded-xl bg-primary-500/5 border border-primary-500/20">
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
              <span className="text-sm font-medium text-primary-400">{t.chat.compacting}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2 ml-7">
              {t.chat.compactingDescription}
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
