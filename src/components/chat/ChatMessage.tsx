import { useState } from "react";
import { Brain, User, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const hasThinking = Boolean(message.thinking && message.thinking.length > 0);
  const isThinkingPhase = message.isStreaming && hasThinking && !message.content;

  const [thinkingOpen, setThinkingOpen] = useState(false);
  const showThinkingExpanded = thinkingOpen || isThinkingPhase;

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isUser
            ? "bg-primary-900/30"
            : "bg-accent-900/30"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary-400" />
        ) : (
          <Brain className="w-4 h-4 text-accent-400" />
        )}
      </div>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary-500 text-white rounded-br-md"
            : "bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-md"
        )}
      >
        {/* Thinking section */}
        {hasThinking && !isUser && (
          <div className="mb-2">
            <button
              onClick={() => setThinkingOpen(!showThinkingExpanded)}
              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>Düşünce süreci</span>
              {showThinkingExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            {showThinkingExpanded && (
              <div className="mt-1.5 pl-2 border-l-2 border-[var(--border-color)] max-h-60 overflow-y-auto scrollbar-thin">
                <p className="text-xs text-[var(--text-muted)] whitespace-pre-wrap leading-relaxed">
                  {message.thinking}
                  {message.isStreaming && !message.content && (
                    <span className="inline-block w-1.5 h-3.5 bg-[var(--text-muted)] ml-0.5 animate-pulse" />
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <p className="whitespace-pre-wrap">
          {message.content}
          {message.isStreaming && message.content && (
            <span className="inline-block w-1.5 h-3.5 bg-[var(--text-primary)] ml-0.5 animate-pulse" />
          )}
        </p>

        {/* Streaming indicator when no content yet and no thinking */}
        {message.isStreaming && !message.content && !hasThinking && (
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:0ms]" />
            <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:150ms]" />
            <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:300ms]" />
          </div>
        )}

        {!message.isStreaming && (
          <p
            className={cn(
              "text-[10px] mt-1",
              isUser ? "text-primary-200" : "text-[var(--text-muted)]"
            )}
          >
            {new Date(message.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
}
