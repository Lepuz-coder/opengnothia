import { useCallback, useEffect, useRef, useState } from "react";
import type { File } from "expo-file-system";
import { getCurrentLanguage, useTranslation } from "@opengnothia/shared/i18n";
import { transcribe } from "@/ai/client";
import { showToast } from "@/stores/useToastStore";
import { useVoiceRecorder } from "./useVoiceRecorder";
import { deleteQuietly, resetAudioMode, setRecordingAudioMode, trackVoiceUsage } from "./voiceRuntime";

/** Desktop's RecordingState (useAudioRecorder.ts), same three phases. */
export type DictationState = "idle" | "recording" | "transcribing";

interface UseDictationOptions {
  /** Receives the transcript; the caller appends it to its own draft. */
  onText: (text: string) => void;
  /** Proxy-shaped failures (403 → paywall contract) route through here. */
  onAIError: (error: unknown) => void;
}

/**
 * Desktop's handleMicClick/handleMicStop pair (SessionPage.tsx:695-738) as a
 * hook: record, transcribe, hand the text back. It never sends — dictation
 * fills the composer and the user still presses send, which is the whole point
 * of the confirmation the voice loop gets from its own confirm screen.
 *
 * Recording needs the iOS session in play-and-record; the profile is handed
 * back on every exit so the meditation bells and TTS keep their own routing.
 */
export function useDictation({ onText, onAIError }: UseDictationOptions) {
  const { t } = useTranslation();
  const { startRecording, stopRecording, cancelRecording, audioLevel, durationSeconds } = useVoiceRecorder();
  const [state, setState] = useState<DictationState>("idle");
  const stateRef = useRef<DictationState>("idle");

  const setStateAndRef = useCallback((next: DictationState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const start = useCallback(async () => {
    if (stateRef.current !== "idle") return;
    await setRecordingAudioMode();
    const started = await startRecording();
    if (!started) {
      await resetAudioMode();
      showToast(t.transcript.microphoneError, "error");
      return;
    }
    setStateAndRef("recording");
  }, [startRecording, setStateAndRef, t]);

  const stop = useCallback(async () => {
    if (stateRef.current !== "recording") return;
    let recording: File | null = null;
    try {
      recording = await stopRecording();
      setStateAndRef("transcribing");
      // Only now: clearing allowsRecording stops any live recorder, so the
      // reset has to follow the stop rather than race it.
      void resetAudioMode();

      const result = await transcribe(recording, getCurrentLanguage());
      void trackVoiceUsage("stt");

      const text = result.text.trim();
      if (text) {
        onText(text);
      } else {
        showToast(t.transcript.emptyTranscription, "info");
      }
    } catch (err) {
      console.error("Dictation STT error:", err);
      // The single error surface: 403 opens the paywall, everything else is
      // already a toast. A second toast here would double up.
      onAIError(err);
    } finally {
      deleteQuietly(recording);
      setStateAndRef("idle");
    }
  }, [stopRecording, setStateAndRef, onText, onAIError, t]);

  // Leaving the surface mid-recording must not strand the audio session.
  useEffect(
    () => () => {
      if (stateRef.current === "recording") {
        void cancelRecording().finally(() => void resetAudioMode());
      }
    },
    [cancelRecording],
  );

  return { state, audioLevel, durationSeconds, start, stop };
}
