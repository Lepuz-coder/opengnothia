import { useRef, useEffect } from "react";
import { Send, Loader2, RotateCcw, Check } from "lucide-react";
import { useTranslation } from "@/i18n";
import { RecordingWave, RecordingTimer } from "@/components/chat/ChatInput";
import type { VoiceLoopStatus } from "@/hooks/useVoiceConversation";

interface VoiceConversationViewProps {
  voiceStatus: VoiceLoopStatus;
  currentAIText: string | null;
  lastUserTranscript: string | null;
  isStreaming: boolean;
  audioLevel: number;
  onRecordingStop: () => void;
  onConfirmTranscript: () => void;
  onRetryRecording: () => void;
  error: string | null;
}

function AIOrb({ voiceStatus }: { voiceStatus: VoiceLoopStatus }) {
  const isPlaying = voiceStatus === "playing";
  const isListening = voiceStatus === "listening";
  const isPaused = voiceStatus === "paused";
  const isConfirming = voiceStatus === "confirming_transcript";
  const isThinking = voiceStatus === "waiting_for_ai" || voiceStatus === "synthesizing" || voiceStatus === "transcribing";

  return (
    <div className={`relative flex items-center justify-center w-32 h-32 flex-shrink-0 ${isPaused ? "opacity-40" : ""}`}>
      {/* Outer ring */}
      <div
        className={`absolute rounded-full transition-all duration-700 ${
          isPlaying
            ? "w-32 h-32 bg-primary-500/10 animate-[voice-pulse_1.2s_ease-in-out_infinite]"
            : isThinking
              ? "w-28 h-28 bg-primary-500/5 animate-[orb-pulse_2s_ease-in-out_infinite]"
              : isConfirming
                ? "w-26 h-26 bg-primary-500/5"
                : "w-24 h-24 bg-[var(--bg-tertiary)]"
        }`}
      />
      {/* Middle ring */}
      <div
        className={`absolute rounded-full transition-all duration-700 ${
          isPlaying
            ? "w-24 h-24 bg-primary-500/15 animate-[voice-pulse_1.2s_ease-in-out_infinite_0.15s]"
            : isThinking
              ? "w-20 h-20 bg-primary-500/10 animate-[orb-pulse_2s_ease-in-out_infinite_0.3s]"
              : "w-18 h-18 bg-[var(--bg-secondary)]"
        }`}
      />
      {/* Inner core */}
      <div
        className={`absolute rounded-full transition-all duration-700 ${
          isPlaying
            ? "w-16 h-16 bg-primary-500/30 animate-[voice-pulse_1.2s_ease-in-out_infinite_0.3s]"
            : isThinking
              ? "w-14 h-14 bg-primary-500/20 animate-[orb-pulse_2s_ease-in-out_infinite_0.6s]"
              : isListening || isConfirming
                ? "w-14 h-14 bg-primary-500/15"
                : "w-14 h-14 bg-[var(--bg-tertiary)]"
        }`}
      />
      {/* Center dot */}
      <div
        className={`relative w-3 h-3 rounded-full transition-all duration-500 ${
          isPlaying
            ? "bg-primary-500 shadow-lg shadow-primary-500/50"
            : isThinking
              ? "bg-primary-400 animate-pulse"
              : isListening || isConfirming
                ? "bg-primary-500/60"
                : "bg-[var(--text-muted)]"
        }`}
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
  const showFadedAIText = voiceStatus === "listening" || voiceStatus === "transcribing" || voiceStatus === "paused" || voiceStatus === "waiting_for_ai" || voiceStatus === "confirming_transcript";
  const showRecordingUI = voiceStatus === "listening";
  const showConfirmUI = voiceStatus === "confirming_transcript" && lastUserTranscript;
  const showUserTranscript = lastUserTranscript && (voiceStatus === "confirming_transcript" || voiceStatus === "waiting_for_ai" || voiceStatus === "synthesizing");

  return (
    <div className="flex-1 flex flex-col items-center px-6 py-6 gap-4 overflow-hidden">
      {/* Top: AI Orb + Status */}
      <div className="flex flex-col items-center gap-3 flex-shrink-0">
        <AIOrb voiceStatus={voiceStatus} />
        {statusLabel && (
          <div className="flex items-center gap-2">
            {voiceStatus !== "paused" && voiceStatus !== "confirming_transcript" && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
            )}
            <span className="text-sm text-[var(--text-muted)] font-medium">{statusLabel}</span>
          </div>
        )}
      </div>

      {/* Middle: Transcript area (scrollable) */}
      <div
        ref={scrollRef}
        className="flex-1 w-full max-w-lg overflow-y-auto flex flex-col gap-3 min-h-0"
      >
        {/* AI transcript */}
        {currentAIText && (showAIText || showFadedAIText) && (
          <div className={`transition-opacity duration-500 ${showFadedAIText ? "opacity-25" : "opacity-100"}`}>
            <p className="text-base text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{currentAIText}</p>
          </div>
        )}

        {/* User's transcript bubble */}
        {showUserTranscript && (
          <div className="self-end max-w-[85%] mt-2">
            <div className="px-4 py-2.5 rounded-2xl rounded-br-md bg-primary-500/15 border border-primary-500/20">
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">{lastUserTranscript}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom: Actions */}
      <div className="flex-shrink-0 flex flex-col items-center gap-3">
        {/* Recording UI - only during listening */}
        {showRecordingUI && (
          <div className="flex items-center gap-4 px-6 py-3 rounded-2xl border border-primary-500/30 bg-primary-500/5">
            <div className="w-48">
              <RecordingWave audioLevel={audioLevel} />
            </div>
            <RecordingTimer />
            <button
              onClick={onRecordingStop}
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary-500 text-white hover:bg-primary-600 transition-colors"
              title={t.voice.sendRecording}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Transcript confirmation UI */}
        {showConfirmUI && (
          <div className="flex items-center gap-3">
            <button
              onClick={onRetryRecording}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              {t.voice.retryRecording}
            </button>
            <button
              onClick={onConfirmTranscript}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              <Check className="w-4 h-4" />
              {t.voice.confirmAndSend}
            </button>
          </div>
        )}

        {/* Transcribing indicator */}
        {voiceStatus === "transcribing" && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-secondary)]">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-muted)]">{t.voice.transcribing}</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-400 text-center">{error}</p>
        )}
      </div>

      {/* Inline keyframes style */}
      <style>{`
        @keyframes orb-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.7; }
        }
        @keyframes voice-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
