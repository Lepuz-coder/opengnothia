import { useCallback, useRef, useState } from "react";
import {
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { File } from "expo-file-system";

export type VoiceRecordingState = "idle" | "recording";

/**
 * Mono voice at 64 kbps: a quarter of HIGH_QUALITY's upload size at no
 * transcription-accuracy cost. Metering feeds the orb/wave visuals.
 */
const VOICE_RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  numberOfChannels: 1,
  bitRate: 64000,
  isMeteringEnabled: true,
};

const METERING_POLL_MS = 100;
/** Microphone metering is dBFS (silence ≈ -50 and below, loud ≈ 0). */
const METERING_FLOOR_DB = -50;

// Module-level lock shared across hook instances, like desktop's recorder:
// two surfaces must not race prepare/record on the OS recorder.
let globalStarting = false;

/**
 * Faz 8 Step 63 — desktop useAudioRecorder's RN port. Tauri's cpal recorder
 * becomes expo-audio: permission flow inline, output is an .m4a File (AAC —
 * one of the containers the Worker's transcription passthrough accepts).
 */
export function useVoiceRecorder() {
  const recorder = useAudioRecorder(VOICE_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, METERING_POLL_MS);
  const [state, setState] = useState<VoiceRecordingState>("idle");
  const stateRef = useRef<VoiceRecordingState>("idle");
  const smoothedRef = useRef(0);

  const setStateAndRef = useCallback((s: VoiceRecordingState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  // dBFS → 0..1 with desktop's asymmetric smoothing (fast attack, slow release).
  let audioLevel = 0;
  if (state === "recording") {
    const metering = recorderState.metering ?? METERING_FLOOR_DB;
    const raw = Math.min(1, Math.max(0, (metering - METERING_FLOOR_DB) / -METERING_FLOOR_DB));
    const prev = smoothedRef.current;
    const factor = raw > prev ? 0.45 : 0.25;
    smoothedRef.current = prev * (1 - factor) + raw * factor;
    audioLevel = smoothedRef.current;
  } else {
    smoothedRef.current = 0;
  }

  /** Returns false when the microphone permission is denied or start fails. */
  const startRecording = useCallback(async (): Promise<boolean> => {
    if (stateRef.current === "recording" || globalStarting) return true;
    globalStarting = true;
    try {
      let permission = await getRecordingPermissionsAsync();
      if (!permission.granted && permission.canAskAgain) {
        permission = await requestRecordingPermissionsAsync();
      }
      if (!permission.granted) return false;
      // Each prepare allocates a fresh output file, so back-to-back turns
      // never overwrite a recording that is still being uploaded.
      await recorder.prepareToRecordAsync();
      recorder.record();
      setStateAndRef("recording");
      return true;
    } catch {
      setStateAndRef("idle");
      return false;
    } finally {
      globalStarting = false;
    }
  }, [recorder, setStateAndRef]);

  const stopRecording = useCallback(async (): Promise<File> => {
    await recorder.stop();
    setStateAndRef("idle");
    if (!recorder.uri) {
      throw new Error("Recording produced no file");
    }
    return new File(recorder.uri);
  }, [recorder, setStateAndRef]);

  const cancelRecording = useCallback(async () => {
    try {
      if (stateRef.current === "recording") {
        await recorder.stop();
        if (recorder.uri) {
          const file = new File(recorder.uri);
          if (file.exists) file.delete();
        }
      }
    } catch {
      // Ignore errors on cancel
    }
    setStateAndRef("idle");
  }, [recorder, setStateAndRef]);

  return {
    state,
    audioLevel,
    /** Elapsed seconds of the in-progress recording (drives the timer). */
    durationSeconds: state === "recording" ? recorderState.durationMillis / 1000 : 0,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
