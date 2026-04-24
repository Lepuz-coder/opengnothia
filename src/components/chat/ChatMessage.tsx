import { useState } from "react";
import { Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTranslation, getDateLocale } from "@/i18n";
import type { ChatMessage as ChatMessageType } from "@/types";
import { AssistantMessageContent } from "./AssistantMessageContent";

interface ChatMessageProps {
  message: ChatMessageType;
  onRevealStateChange?: (active: boolean) => void;
}

export function ChatMessage({ message, onRevealStateChange }: ChatMessageProps) {
  const isUser = message.role === "user";
  const hasThinking = Boolean(message.thinking && message.thinking.length > 0);
  const isThinkingPhase = message.isStreaming && (message.isThinkingActive === true || (hasThinking && !message.content));
  const { t, language } = useTranslation();
  const locale = getDateLocale(language);

  const [thinkingOpen, setThinkingOpen] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const showThinkingExpanded = thinkingOpen;

  const handleRevealStateChange = (active: boolean) => {
    setIsRevealing(active);
    onRevealStateChange?.(active);
  };

  return (
    <div className={cn("w-full", isUser && "flex justify-end")}>
      <div
        className={cn(
          "text-base leading-relaxed",
          isUser
            ? "max-w-[70%] rounded-2xl rounded-br-md px-4 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)]"
            : "w-full text-[var(--text-primary)]",
          !isUser && (message.isStreaming || isRevealing) && "min-h-[3.5rem]"
        )}
      >
        {/* Thinking section */}
        {hasThinking && !isUser && (
          <div className="mb-2">
            <button
              onClick={() => setThinkingOpen(!thinkingOpen)}
              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <Sparkles className={cn(
                "w-3 h-3 transition-all duration-300",
                isThinkingPhase && "text-accent-400 animate-pulse drop-shadow-[0_0_6px_rgba(232,168,56,0.6)]"
              )} />
              <span>{isThinkingPhase ? t.chat.thinking : t.chat.thinkingProcess}</span>
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

        {/* Thinking phase indicator when collapsed */}
        {isThinkingPhase && !showThinkingExpanded && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
            <span className="inline-block w-1.5 h-3.5 bg-accent-400 animate-pulse rounded-sm" />
          </div>
        )}

        {/* Content */}
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <AssistantMessageContent
            content={message.content}
            isStreaming={Boolean(message.isStreaming)}
            onRevealStateChange={handleRevealStateChange}
          />
        )}

        {/* Streaming indicator when no content yet and no thinking.
            For reasoning models that don't stream a visible summary (e.g. gpt-5.4),
            show a pulsing sparkle + "Düşünüyor..." so the user sees reasoning is in progress. */}
        {message.isStreaming && !message.content && !hasThinking && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Sparkles className="w-3.5 h-3.5 text-accent-400 animate-pulse drop-shadow-[0_0_6px_rgba(232,168,56,0.6)]" />
            <span>{t.chat.thinking}</span>
          </div>
        )}

        {!message.isStreaming && !isRevealing && (
          <p
            className="text-[10px] mt-1 text-[var(--text-muted)]"
          >
            {new Date(message.timestamp).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
}
