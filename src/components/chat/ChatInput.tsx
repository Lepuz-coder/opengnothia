import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/cn";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [value]);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="border-t border-[var(--border-color)] p-4">
      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Mesajını yaz..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0",
            value.trim() && !disabled
              ? "bg-primary-500 text-white hover:bg-primary-600"
              : "bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
