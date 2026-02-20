import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Send, Mic, Loader2, Square } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/i18n";
import type { RecordingState } from "@/hooks/useAudioRecorder";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  recordingState?: RecordingState;
  audioLevel?: number;
  onMicClick?: () => void;
  onMicStop?: () => void;
}

export interface ChatInputHandle {
  insertText: (text: string) => void;
}

const BAR_COUNT = 24;
const MIN_HEIGHT = 6;
const MAX_HEIGHT = 32;
const LEVEL_SCALE = 8;

export function RecordingWave({ audioLevel = 0 }: { audioLevel: number }) {
  const barsRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // sqrt for perceptual scaling — small sounds become much more visible
    targetRef.current = Math.min(Math.sqrt(audioLevel * LEVEL_SCALE), 1.0);
  }, [audioLevel]);

  useEffect(() => {
    if (!barsRef.current) return;

    let lastTime = 0;

    const animate = (time: number) => {
      const bars = barsRef.current;
      if (!bars) return;

      const dt = lastTime ? (time - lastTime) / 1000 : 0.016;
      lastTime = time;

      // Interpolate current toward target
      const target = targetRef.current;
      const speed = target > currentRef.current ? 18 : 8;
      currentRef.current += (target - currentRef.current) * Math.min(speed * dt, 1);

      const level = currentRef.current;
      const children = bars.children;

      for (let i = 0; i < children.length; i++) {
        const wave1 = Math.sin(time * 0.005 + i * 0.6) * 0.35;
        const wave2 = Math.sin(time * 0.008 + i * 1.2) * 0.15;
        const barLevel = Math.max(0, Math.min(1, level + (wave1 + wave2) * level));
        const height = MIN_HEIGHT + barLevel * (MAX_HEIGHT - MIN_HEIGHT);
        (children[i] as HTMLElement).style.height = `${height}px`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div ref={barsRef} className="flex items-center justify-center gap-[3px] h-10">
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full bg-red-400"
          style={{ height: `${MIN_HEIGHT}px` }}
        />
      ))}
    </div>
  );
}

export function RecordingTimer() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return (
    <span className="text-sm tabular-nums text-red-400 font-medium">
      {mins}:{secs.toString().padStart(2, "0")}
    </span>
  );
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(
  ({ onSend, disabled, recordingState = "idle", audioLevel = 0, onMicClick, onMicStop }, ref) => {
    const { t } = useTranslation();
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      insertText: (text: string) => {
        setValue((prev) => {
          const separator = prev.trim() ? " " : "";
          return prev + separator + text;
        });
        setTimeout(() => textareaRef.current?.focus(), 0);
      },
    }));

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
      }
    }, [value]);

    useEffect(() => {
      if (!disabled) {
        textareaRef.current?.focus();
      }
    }, [disabled]);

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

    const isRecording = recordingState === "recording";

    return (
      <div className="px-4 pb-4 pt-2">
        <div className="max-w-3xl mx-auto">
          <div
            className={cn(
              "relative flex items-end rounded-2xl border bg-[var(--bg-secondary)] shadow-lg shadow-black/20 transition-all duration-300",
              isRecording
                ? "border-red-500/50 shadow-red-500/10"
                : "border-[var(--border-color)] focus-within:border-primary-500/50 focus-within:ring-1 focus-within:ring-primary-500/20"
            )}
          >
            {isRecording ? (
              <div className="flex items-center w-full px-4 py-3 gap-3">
                {/* Mic icon with pulsing dot */}
                <div className="relative flex-shrink-0">
                  <Mic className="w-5 h-5 text-red-400" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                </div>

                {/* Animated wave + recording text */}
                <div className="flex flex-col items-center flex-1 gap-1">
                  <RecordingWave audioLevel={audioLevel} />
                  <span className="text-xs text-red-400/70">{t.transcript.recordingAudio}</span>
                </div>

                {/* Timer + stop button */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <RecordingTimer />
                  <button
                    onClick={onMicStop}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-colors"
                    title={t.transcript.recording}
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t.chat.placeholder}
                  disabled={disabled}
                  rows={1}
                  className="flex-1 resize-none bg-transparent px-4 py-3 pr-20 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none disabled:opacity-50"
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  {/* Mic button */}
                  <button
                    onClick={onMicClick}
                    disabled={disabled || recordingState === "transcribing"}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                      recordingState === "transcribing"
                        ? "text-primary-400"
                        : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    )}
                    title={
                      recordingState === "transcribing"
                        ? t.transcript.transcribing
                        : undefined
                    }
                  >
                    {recordingState === "transcribing" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                  {/* Send button */}
                  <button
                    onClick={handleSubmit}
                    disabled={!value.trim() || disabled}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                      value.trim() && !disabled
                        ? "bg-primary-500 text-white hover:bg-primary-600"
                        : "text-[var(--text-muted)]"
                    )}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
);
