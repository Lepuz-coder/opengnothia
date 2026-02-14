import { Brain, User } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

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
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p
          className={cn(
            "text-[10px] mt-1",
            isUser ? "text-primary-200" : "text-[var(--text-muted)]"
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
