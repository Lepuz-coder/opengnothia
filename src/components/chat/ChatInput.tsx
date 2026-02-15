import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
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
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
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
    <div className="pb-4 pt-2 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-end rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/10 transition-all">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mesajını yaz..."
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none bg-transparent px-4 py-3.5 text-sm focus:outline-none disabled:opacity-50 placeholder:text-[var(--text-muted)]"
          />
          <div className="p-2">
            <button
              onClick={handleSubmit}
              disabled={!value.trim() || disabled}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0",
                value.trim() && !disabled
                  ? "bg-primary-600 text-white hover:bg-primary-700 shadow-sm"
                  : "bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
              )}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] text-center mt-2">
          Gnothia bir terapi aracıdır, profesyonel destek yerine geçmez.
        </p>
      </div>
    </div>
  );
}
