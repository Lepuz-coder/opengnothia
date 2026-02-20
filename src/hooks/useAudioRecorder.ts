import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export type RecordingState = "idle" | "recording" | "transcribing";

export function useAudioRecorder() {
  const [state, setState] = useState<RecordingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      await invoke("start_recording");
      setState("recording");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState("idle");
    }
  }, []);

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
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
