import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTranslation, getDateLocale } from "@/i18n";
import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const hasThinking = Boolean(message.thinking && message.thinking.length > 0);
  const isThinkingPhase = message.isStreaming && hasThinking && !message.content;
  const { t, language } = useTranslation();
  const locale = getDateLocale(language);

  const [thinkingOpen, setThinkingOpen] = useState(false);
  const showThinkingExpanded = thinkingOpen;

  return (
    <div className={cn("w-full", isUser && "flex justify-end")}>
      <div
        className={cn(
          "text-base leading-relaxed",
          isUser
            ? "max-w-[70%] rounded-2xl rounded-br-md px-4 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)]"
            : "w-full text-[var(--text-primary)]"
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
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
            {message.isStreaming && message.content && (
              <span className="inline-block w-1.5 h-3.5 bg-[var(--text-primary)] ml-0.5 animate-pulse" />
            )}
          </div>
        )}

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
            className="text-[10px] mt-1 text-[var(--text-muted)]"
          >
            {new Date(message.timestamp).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
}
