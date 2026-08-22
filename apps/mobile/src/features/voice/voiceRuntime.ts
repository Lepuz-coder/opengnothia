import { setAudioModeAsync } from "expo-audio";
import type { File } from "expo-file-system";
import { getQueries } from "@/db";
import { useSessionStore } from "@/stores/useSessionStore";

/**
 * The pieces every microphone surface needs, shared by the voice loop
 * (useVoiceConversation) and text-mode dictation (useDictation). Both record
 * through expo-audio, both bill an `stt` row, and both have to hand the iOS
 * audio session back when they are done with it.
 */

export function deleteQuietly(file: File | null | undefined) {
  try {
    if (file && file.exists) file.delete();
  } catch {
    // Temp-file cleanup must never surface
  }
}

export async function trackVoiceUsage(callType: "stt" | "tts") {
  try {
    // Null outside a session — the onboarding interview dictates with no
    // session row, exactly like its own intake_interview usage rows.
    const sessionId = useSessionStore.getState().sessionId;
    const queries = await getQueries();
    // Cost and model are opaque behind the proxy (M5): zero-value rows keep
    // the same call trail desktop's voice loop leaves.
    await queries.saveTokenUsage({
      session_id: sessionId,
      provider: "openai",
      model: "proxy",
      input_tokens: 0,
      output_tokens: 0,
      cost: 0,
      call_type: callType,
    });
  } catch {
    // The trail is best-effort; the loop must not die on a bookkeeping miss
  }
}

/**
 * Step 68: while a microphone is live, therapy speech must survive the silent
 * switch, the mic stays claimable, and other audio does not mix in.
 *
 * `allowsRecording` is not optional dressing — expo-audio's iOS recorder
 * throws RecordingDisabledException without it, which surfaces as a bogus
 * "permission denied". And `playsInSilentMode: false` alongside it is itself
 * rejected, so the two always travel together.
 */
export async function setRecordingAudioMode() {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
      interruptionMode: "doNotMix",
      shouldRouteThroughEarpiece: false,
    });
  } catch (err) {
    console.error("Audio session config failed:", err);
  }
}

/** Hands the session back to the rest of the app (meditation bells mix again). */
export async function resetAudioMode() {
  try {
    await setAudioModeAsync({
      playsInSilentMode: false,
      allowsRecording: false,
      interruptionMode: "mixWithOthers",
    });
  } catch (err) {
    console.error("Audio session config failed:", err);
  }
}
