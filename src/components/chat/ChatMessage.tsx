import { Brain, User } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 max-w-3xl mx-auto w-full",
        isUser && "justify-end"
      )}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-accent-100 dark:bg-accent-900/30 mt-1">
          <Brain className="w-4 h-4 text-accent-600 dark:text-accent-400" />
        </div>
      )}
      <div
        className={cn(
          "text-sm leading-relaxed",
          isUser
            ? "bg-primary-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%]"
            : "text-[var(--text-primary)] pt-1 max-w-[85%]"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p
          className={cn(
            "text-[10px] mt-1.5",
            isUser ? "text-primary-200" : "text-[var(--text-muted)]"
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary-100 dark:bg-primary-900/30 mt-1">
          <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        </div>
      )}
    </div>
  );
}
