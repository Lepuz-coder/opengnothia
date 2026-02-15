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
    <div className="px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-end rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-lg shadow-black/20 transition-colors focus-within:border-primary-500/50 focus-within:ring-1 focus-within:ring-primary-500/20">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mesajını yaz..."
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none bg-transparent px-4 py-3 pr-12 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            className={cn(
              "absolute right-2 bottom-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              value.trim() && !disabled
                ? "bg-primary-500 text-white hover:bg-primary-600"
                : "text-[var(--text-muted)]"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
