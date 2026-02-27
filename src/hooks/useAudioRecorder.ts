import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export type RecordingState = "idle" | "recording" | "transcribing";

// Module-level lock shared across ALL useAudioRecorder instances.
// Prevents concurrent startRecording calls from different hook instances
// (e.g. SessionPage's recorder AND useVoiceConversation's recorder).
let globalStarting = false;

export function useAudioRecorder() {
  const [state, setState] = useState<RecordingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const smoothedRef = useRef(0);

  // Listen for audio-level events while recording
  useEffect(() => {
    if (state !== "recording") {
      smoothedRef.current = 0;
      setAudioLevel(0);
      return;
    }

    let active = true;
    let unlisten: (() => void) | undefined;

    listen<number>("audio-level", (event) => {
      if (!active) return;
      const raw = event.payload;
      const prev = smoothedRef.current;
      // Asymmetric smoothing: fast attack, slow release
      const factor = raw > prev ? 0.45 : 0.25;
      const smoothed = prev * (1 - factor) + raw * factor;
      smoothedRef.current = smoothed;
      setAudioLevel(smoothed);
    }).then((fn) => {
      if (active) {
        unlisten = fn;
      } else {
        fn(); // Already unmounted, clean up immediately
      }
    });

    return () => {
      active = false;
      unlisten?.();
    };
  }, [state]);

  const startRecording = useCallback(async () => {
    if (state === "recording" || globalStarting) return;
    globalStarting = true;
    try {
      setError(null);
      // start_recording now handles macOS mic permission internally
      // (via OnceLock + AVCaptureDevice) before cpal touches CoreAudio.
      await invoke("start_recording");
      setState("recording");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState("idle");
    } finally {
      globalStarting = false;
    }
  }, [state]);

  const stopRecording = useCallback(async (): Promise<Blob> => {
    const base64Wav = await invoke<string>("stop_recording");
    const binaryStr = atob(base64Wav);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return new Blob([bytes], { type: "audio/wav" });
  }, []);

  const cancelRecording = useCallback(async () => {
    try {
      await invoke("stop_recording");
    } catch {
      // Ignore errors on cancel
    }
    setState("idle");
  }, []);

  return {
    state,
    setState,
    error,
    setError,
    audioLevel,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
