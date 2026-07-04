import { useRef, useEffect, useState } from "react";
import { Send, Loader2, RotateCcw, Check, Mic, Volume2, MessageCircle, Pause, Pencil, X } from "lucide-react";
import { cn } from "@opengnothia/shared/lib/cn";
import { useTranslation } from "@opengnothia/shared/i18n";
import { RecordingWave, RecordingTimer } from "@/components/chat/ChatInput";
import type { VoiceLoopStatus } from "@/hooks/useVoiceConversation";

interface VoiceConversationViewProps {
  voiceStatus: VoiceLoopStatus;
  currentAIText: string | null;
  lastUserTranscript: string | null;
  isStreaming: boolean;
  audioLevel: number;
  onRecordingStop: () => void;
  onConfirmTranscript: (overrideText?: string) => void;
  onRetryRecording: () => void;
  error: string | null;
}

function AIOrb({ voiceStatus, audioLevel }: { voiceStatus: VoiceLoopStatus; audioLevel: number }) {
  const isPlaying = voiceStatus === "playing";
  const isListening = voiceStatus === "listening";
  const isPaused = voiceStatus === "paused";
  const isConfirming = voiceStatus === "confirming_transcript";
  const isThinking = voiceStatus === "waiting_for_ai" || voiceStatus === "synthesizing" || voiceStatus === "transcribing";

  const orbRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const smoothedLevel = useRef(0);
  const rafId = useRef(0);

  useEffect(() => {
    const isActive = isPlaying || isListening;
    if (!isActive) {
      smoothedLevel.current = 0;
      if (orbRef.current) orbRef.current.style.transform = "scale(1)";
      if (rippleRef.current) rippleRef.current.style.opacity = "0";
      return;
    }

    const animate = () => {
      const target = audioLevel;
      const speed = target > smoothedLevel.current ? 0.3 : 0.12;
      smoothedLevel.current += (target - smoothedLevel.current) * speed;

      const level = smoothedLevel.current;
      const orb = orbRef.current;
      if (orb) {
        const scale = 1 + level * 0.08;
        orb.style.transform = `scale(${scale})`;
      }
      if (rippleRef.current) {
        rippleRef.current.style.opacity = String(Math.min(0.25 + level * 0.75, 1));
      }

      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [isPlaying, isListening, audioLevel]);

  return (
    <div
      ref={orbRef}
      className={cn(
        "relative flex items-center justify-center w-44 h-44 flex-shrink-0 transition-transform duration-100",
        isPaused && "opacity-30",
      )}
    >
      {/* Layer 0: Breathing halo — expands the orb's presence beyond its container */}
      <div
        className={cn(
          "absolute w-64 h-64 rounded-full transition-opacity duration-1000",
          isPlaying || isListening ? "opacity-100" : isThinking ? "opacity-60" : "opacity-0",
          "motion-safe:animate-[orb-breathe_6s_ease-in-out_infinite]",
        )}
        style={{
          background:
            "radial-gradient(circle, rgba(58,186,180,0.08) 0%, rgba(58,186,180,0.03) 45%, transparent 70%)",
        }}
      />

      {/* Audio-reactive ripple rings — group opacity driven by the smoothed level */}
      <div
        ref={rippleRef}
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-500",
          !(isPlaying || isListening) && "opacity-0",
        )}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "absolute inset-0 rounded-full border border-primary-400/30",
              "motion-safe:animate-[orb-ripple_2.6s_ease-out_infinite]",
              isPlaying && "[animation-duration:1.8s]",
            )}
            style={{ animationDelay: `${i * (isPlaying ? 0.6 : 0.85)}s` }}
          />
        ))}
      </div>

      {/* Layer 1: Ambient glow */}
      <div
        className={cn(
          "absolute w-44 h-44 rounded-full transition-all duration-1000",
          isPlaying && "motion-safe:animate-[orb-glow_2s_ease-in-out_infinite]",
          isListening && "motion-safe:animate-[orb-glow_3s_ease-in-out_infinite]",
          isThinking && "motion-safe:animate-[orb-glow_4s_ease-in-out_infinite]",
        )}
        style={{
          background:
            isPlaying || isListening
              ? "radial-gradient(circle, rgba(58,186,180,0.15) 0%, rgba(58,186,180,0.05) 50%, transparent 70%)"
              : isThinking
                ? "radial-gradient(circle, rgba(58,186,180,0.08) 0%, transparent 60%)"
                : "none",
        }}
      />

      {/* Layer 2: Rotating gradient ring */}
      <div
        className={cn(
          "absolute w-36 h-36 rounded-full transition-opacity duration-700",
          isPlaying || isListening || isThinking ? "opacity-100" : "opacity-0",
          "motion-safe:animate-[orb-rotate_8s_linear_infinite]",
        )}
        style={{
          background:
            "conic-gradient(from 0deg, transparent, rgba(58,186,180,0.3), transparent, rgba(75,195,190,0.2), transparent)",
          maskImage:
            "radial-gradient(circle, transparent 55%, black 57%, black 63%, transparent 65%)",
          WebkitMaskImage:
            "radial-gradient(circle, transparent 55%, black 57%, black 63%, transparent 65%)",
        }}
      />

      {/* Layer 3: Outer ring */}
      <div
        className={cn(
          "absolute rounded-full transition-all duration-700",
          isPlaying
            ? "w-32 h-32 motion-safe:animate-[voice-pulse_1.2s_ease-in-out_infinite]"
            : isThinking
              ? "w-28 h-28 motion-safe:animate-[orb-pulse_2s_ease-in-out_infinite]"
              : isConfirming
                ? "w-26 h-26"
                : "w-24 h-24",
        )}
        style={{
          background: isPlaying
            ? "radial-gradient(circle, rgba(58,186,180,0.18) 0%, rgba(58,186,180,0.05) 100%)"
            : isThinking
              ? "radial-gradient(circle, rgba(58,186,180,0.10) 0%, rgba(58,186,180,0.02) 100%)"
              : undefined,
        }}
      />

      {/* Layer 4: Middle ring */}
      <div
        className={cn(
          "absolute rounded-full transition-all duration-700",
          isPlaying
            ? "w-24 h-24 motion-safe:animate-[voice-pulse_1.2s_ease-in-out_infinite_0.15s]"
            : isThinking
              ? "w-20 h-20 motion-safe:animate-[orb-pulse_2s_ease-in-out_infinite_0.3s]"
              : "w-18 h-18",
        )}
        style={{
          background: isPlaying
            ? "radial-gradient(circle, rgba(58,186,180,0.25) 0%, rgba(58,186,180,0.08) 100%)"
            : isThinking
              ? "radial-gradient(circle, rgba(58,186,180,0.15) 0%, rgba(58,186,180,0.05) 100%)"
              : undefined,
        }}
      />

      {/* Layer 5: Inner core */}
      <div
        className={cn(
          "absolute w-14 h-14 rounded-full transition-all duration-700",
          isPlaying && "w-16 h-16 motion-safe:animate-[voice-pulse_1.2s_ease-in-out_infinite_0.3s]",
          isThinking && "motion-safe:animate-[orb-pulse_2s_ease-in-out_infinite_0.6s]",
        )}
        style={{
          background: isPlaying
            ? "radial-gradient(circle, rgba(58,186,180,0.45) 0%, rgba(58,186,180,0.15) 100%)"
            : isThinking
              ? "radial-gradient(circle, rgba(58,186,180,0.30) 0%, rgba(58,186,180,0.10) 100%)"
              : isListening || isConfirming
                ? "radial-gradient(circle, rgba(58,186,180,0.20) 0%, rgba(58,186,180,0.08) 100%)"
                : "var(--bg-tertiary)",
        }}
      />

      {/* Layer 6: Center dot */}
      <div
        className={cn(
          "relative w-4 h-4 rounded-full transition-all duration-500",
          isPlaying && "bg-primary-400 shadow-[0_0_16px_rgba(58,186,180,0.6),0_0_32px_rgba(58,186,180,0.3)]",
          isThinking && "bg-primary-400 animate-pulse shadow-[0_0_12px_rgba(58,186,180,0.4)]",
          isListening && "bg-primary-500 shadow-[0_0_12px_rgba(58,186,180,0.5)]",
          isConfirming && "bg-primary-500/60",
          !isPlaying && !isThinking && !isListening && !isConfirming && "bg-[var(--text-muted)]",
        )}
      />
    </div>
  );
}

export function VoiceConversationView({
  voiceStatus,
  currentAIText,
  lastUserTranscript,
  isStreaming,
  audioLevel,
  onRecordingStop,
  onConfirmTranscript,
  onRetryRecording,
  error,
}: VoiceConversationViewProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Inline transcript editing (confirming_transcript state)
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState("");
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (voiceStatus !== "confirming_transcript") {
      setIsEditingTranscript(false);
    }
  }, [voiceStatus]);

  useEffect(() => {
    if (!isEditingTranscript) return;
    const ta = editTextareaRef.current;
    if (ta) {
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }
  }, [isEditingTranscript]);

  useEffect(() => {
    if (!isEditingTranscript) return;
    const ta = editTextareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
    }
  }, [editedTranscript, isEditingTranscript]);

  const startEditingTranscript = () => {
    setEditedTranscript(lastUserTranscript ?? "");
    setIsEditingTranscript(true);
  };

  const cancelEditingTranscript = () => {
    setIsEditingTranscript(false);
  };

  const confirmEditedTranscript = () => {
    const trimmed = editedTranscript.trim();
    if (!trimmed) return;
    setIsEditingTranscript(false);
    onConfirmTranscript(trimmed);
  };

  // Auto-scroll transcript to bottom when content updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentAIText, lastUserTranscript, voiceStatus]);

  const statusLabel = (() => {
    switch (voiceStatus) {
      case "waiting_for_ai":
        return t.chat.thinking;
      case "synthesizing":
        return t.voice.synthesizing;
      case "playing":
        return t.voice.playing;
      case "listening":
        return t.voice.listening;
      case "transcribing":
        return t.voice.transcribing;
      case "confirming_transcript":
        return t.voice.confirmTranscript;
      case "paused":
        return t.voice.voicePaused;
      default:
        return null;
    }
  })();

  const showAIText = voiceStatus === "playing" || voiceStatus === "synthesizing";
  const showFadedAIText =
    voiceStatus === "listening" ||
    voiceStatus === "transcribing" ||
    voiceStatus === "paused" ||
    voiceStatus === "waiting_for_ai" ||
    voiceStatus === "confirming_transcript";
  const showRecordingUI = voiceStatus === "listening";
  const showConfirmUI = voiceStatus === "confirming_transcript" && lastUserTranscript;
  const showUserTranscript =
    lastUserTranscript &&
    (voiceStatus === "confirming_transcript" ||
      voiceStatus === "waiting_for_ai" ||
      voiceStatus === "synthesizing");

  return (
    <div className="flex-1 flex flex-col items-center px-6 py-6 gap-4 overflow-hidden relative">
      {/* Ambient background spotlight */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full pointer-events-none transition-all duration-1000"
        style={{
          background:
            voiceStatus === "playing"
              ? "radial-gradient(circle, rgba(58,186,180,0.12) 0%, rgba(58,186,180,0.04) 40%, transparent 70%)"
              : voiceStatus === "listening"
                ? "radial-gradient(circle, rgba(58,186,180,0.08) 0%, rgba(58,186,180,0.02) 40%, transparent 70%)"
                : voiceStatus === "waiting_for_ai" ||
                    voiceStatus === "synthesizing" ||
                    voiceStatus === "transcribing"
                  ? "radial-gradient(circle, rgba(58,186,180,0.06) 0%, rgba(58,186,180,0.01) 40%, transparent 70%)"
                  : "radial-gradient(circle, rgba(58,186,180,0.02) 0%, transparent 50%)",
          filter: "blur(40px)",
        }}
      />

      {/* Top: AI Orb + Status */}
      <div className="relative z-10 flex flex-col items-center gap-3 flex-shrink-0">
        <AIOrb voiceStatus={voiceStatus} audioLevel={audioLevel} />
        {statusLabel && (
          <div
            className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/[0.08] bg-surface-800/50 backdrop-blur-md shadow-lg shadow-black/20 motion-safe:animate-[text-fade-in_0.3s_ease-out]"
            key={voiceStatus}
          >
            {voiceStatus === "playing" && <Volume2 className="w-4 h-4 text-primary-400" />}
            {voiceStatus === "listening" && <Mic className="w-4 h-4 text-primary-400" />}
            {(voiceStatus === "waiting_for_ai" ||
              voiceStatus === "synthesizing" ||
              voiceStatus === "transcribing") && (
              <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
            )}
            {voiceStatus === "confirming_transcript" && (
              <MessageCircle className="w-4 h-4 text-primary-400" />
            )}
            {voiceStatus === "paused" && <Pause className="w-4 h-4 text-[var(--text-muted)]" />}

            <span className="text-sm font-medium text-[var(--text-muted)]">{statusLabel}</span>

            {voiceStatus !== "paused" && voiceStatus !== "confirming_transcript" && (
              <span className="w-2 h-2 rounded-full bg-primary-500 motion-safe:animate-[status-dot-pulse_1.5s_ease-in-out_infinite]" />
            )}
          </div>
        )}
      </div>

      {/* Middle: Transcript area (scrollable) */}
      <div
        ref={scrollRef}
        className="relative z-10 flex-1 w-full max-w-lg overflow-y-auto flex flex-col gap-3 min-h-0"
      >
        {/* AI transcript -- glass card */}
        {currentAIText && (showAIText || showFadedAIText) && (
          <div
            className={cn(
              "transition-all duration-500",
              showFadedAIText ? "opacity-25" : "opacity-100",
            )}
          >
            <div
              className="px-5 py-4 rounded-2xl motion-safe:animate-[text-fade-in_0.5s_ease-out]"
              style={{
                border: "1px solid transparent",
                background:
                  "linear-gradient(135deg, rgba(36,53,86,0.55) 0%, rgba(26,39,68,0.45) 100%) padding-box, " +
                  "linear-gradient(135deg, rgba(58,186,180,0.28) 0%, rgba(255,255,255,0.05) 45%, rgba(58,186,180,0.10) 100%) border-box",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              <p className="text-[17px] text-[var(--text-secondary)] leading-[1.7] whitespace-pre-wrap tracking-[-0.01em]">
                {currentAIText}
              </p>
            </div>
          </div>
        )}

        {/* User's transcript bubble */}
        {showUserTranscript && (
          <div
            className={cn(
              "self-end mt-3 motion-safe:animate-[text-fade-in_0.4s_ease-out]",
              isEditingTranscript ? "w-full" : "max-w-[85%]",
            )}
          >
            <div
              className={cn(
                "px-5 py-3 rounded-2xl rounded-br-md bg-gradient-to-br from-primary-500/[0.16] to-surface-800/90 border transition-all duration-300",
                isEditingTranscript
                  ? "border-primary-400/45 shadow-[0_0_24px_-6px_rgba(58,186,180,0.35)]"
                  : "border-primary-500/25 shadow-lg shadow-primary-500/5",
              )}
            >
              {isEditingTranscript ? (
                <textarea
                  ref={editTextareaRef}
                  value={editedTranscript}
                  onChange={(e) => setEditedTranscript(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      confirmEditedTranscript();
                    } else if (e.key === "Escape") {
                      cancelEditingTranscript();
                    }
                  }}
                  rows={1}
                  className="scrollbar-thin w-full resize-none bg-transparent text-[15px] text-[var(--text-primary)] leading-relaxed focus:outline-none"
                />
              ) : (
                <p className="text-[15px] text-[var(--text-primary)] leading-relaxed">
                  {lastUserTranscript}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom: Actions */}
      <div className="relative z-10 flex-shrink-0 flex flex-col items-center gap-3">
        {/* Recording UI -- centered vertical layout */}
        {showRecordingUI && (
          <div className="flex flex-col items-center gap-4 motion-safe:animate-[text-fade-in_0.3s_ease-out]">
            <div className="w-64">
              <RecordingWave audioLevel={audioLevel} />
            </div>
            <RecordingTimer />
            <div className="relative">
              <div className="absolute inset-0 rounded-full border-2 border-primary-500/40 motion-safe:animate-[recording-ring-pulse_2s_ease-in-out_infinite]" />
              <button
                onClick={onRecordingStop}
                className="relative w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600 text-white hover:from-primary-300 hover:to-primary-500 transition-all shadow-[0_0_20px_rgba(58,186,180,0.45)]"
                title={t.voice.sendRecording}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Transcript confirmation UI */}
        {showConfirmUI && (
          <div className="flex items-center gap-3 motion-safe:animate-[text-fade-in_0.3s_ease-out]">
            {isEditingTranscript ? (
              <button
                onClick={cancelEditingTranscript}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md text-sm text-[var(--text-secondary)] hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-4 h-4" />
                {t.common.cancel}
              </button>
            ) : (
              <>
                <button
                  onClick={onRetryRecording}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md text-sm text-[var(--text-secondary)] hover:bg-white/[0.08] transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t.voice.retryRecording}
                </button>
                <button
                  onClick={startEditingTranscript}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md text-sm text-[var(--text-secondary)] hover:bg-white/[0.08] transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  {t.common.edit}
                </button>
              </>
            )}
            <button
              onClick={() => (isEditingTranscript ? confirmEditedTranscript() : onConfirmTranscript())}
              disabled={isEditingTranscript && !editedTranscript.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white text-sm font-medium shadow-[0_0_16px_rgba(58,186,180,0.35)] hover:from-primary-300 hover:to-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              {t.voice.confirmAndSend}
            </button>
          </div>
        )}

        {/* Transcribing indicator */}
        {voiceStatus === "transcribing" && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800/60 backdrop-blur-md border border-white/[0.06]">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-muted)]">{t.voice.transcribing}</span>
          </div>
        )}

        {/* Error message */}
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes orb-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.7; }
        }
        @keyframes voice-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }
        @keyframes orb-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes orb-glow {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes text-fade-in {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes recording-ring-pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.35); opacity: 0; }
        }
        @keyframes status-dot-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        @keyframes orb-ripple {
          0%   { transform: scale(0.62); opacity: 0.5; }
          70%  { opacity: 0.15; }
          100% { transform: scale(1.9); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
