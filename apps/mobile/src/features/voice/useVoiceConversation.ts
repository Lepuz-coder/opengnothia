import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { createAudioPlayer } from "expo-audio";
import type { File } from "expo-file-system";
import { getCurrentLanguage } from "@opengnothia/shared/i18n";
import { speak, transcribe, type SpeechResult } from "@/ai/client";
import { useVoiceRecorder } from "./useVoiceRecorder";
import { deleteQuietly, resetAudioMode, setRecordingAudioMode, trackVoiceUsage } from "./voiceRuntime";

export type VoiceLoopStatus =
  | "idle"
  | "waiting_for_ai"
  | "synthesizing"
  | "playing"
  | "listening"
  | "transcribing"
  | "confirming_transcript"
  | "paused";

/** Error codes the view translates — the hook stays out of i18n. */
export type VoiceLoopError = "mic_denied" | "empty_transcription" | "stt_failed" | "tts_failed";

interface UseVoiceConversationOptions {
  onTranscriptionReady: (text: string) => void;
  /** Proxy-shaped failures (403 → paywall contract) route through here. */
  onAIError: (error: unknown) => void;
}

type QueueItem = { text: string; audioPromise: Promise<SpeechResult> };

const MIN_PARA_LENGTH = 15;

/**
 * Desktop useVoiceConversation's sentence extractor, verbatim: punctuation
 * boundary past 40 chars, or a paragraph break past 15.
 */
function extractSentence(buffer: string): { sentence: string; remaining: string } | null {
  const match = buffer.match(/^([\s\S]{40,}?[.!?;:])\s+([\s\S]*)$/);
  if (match) return { sentence: match[1], remaining: match[2] };
  const paraMatch = buffer.match(/^([\s\S]+?)\n\n([\s\S]*)$/);
  if (paraMatch && paraMatch[1].length >= MIN_PARA_LENGTH) {
    return { sentence: paraMatch[1], remaining: paraMatch[2] };
  }
  return null;
}

/** Play a temp mp3; resolves on finish, rejects on load failure, stop() interrupts. */
function playSpeechFile(speech: SpeechResult): { promise: Promise<void>; stop: () => void } {
  const player = createAudioPlayer(speech.file.uri);
  let settled = false;
  let resolveFn = () => {};
  let rejectFn: (err: Error) => void = () => {};
  const promise = new Promise<void>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });

  const finish = (error?: Error) => {
    if (settled) return;
    settled = true;
    subscription.remove();
    try {
      player.remove();
    } catch {
      // Releasing a finished player can no-op
    }
    deleteQuietly(speech.file);
    if (error) rejectFn(error);
    else resolveFn();
  };

  const subscription = player.addListener("playbackStatusUpdate", (status) => {
    if (status.didJustFinish) finish();
    else if (status.playbackState === "failed") finish(new Error("Audio playback failed"));
  });
  player.play();

  return { promise, stop: () => finish() };
}

/**
 * Faz 8 Step 66 — desktop's voice loop state machine on the mobile stack:
 * listening → transcribing → confirming → waiting_for_ai → synthesizing →
 * playing → listening. Mobile deltas: tap-to-interrupt (stops speech, jumps to
 * listening; the text stream finishes silently into the transcript), resume
 * lands on listening instead of waiting for a stream that will never come, and
 * the audio session is configured for silent-switch playback + recording while
 * the loop runs (Step 68).
 */
export function useVoiceConversation({ onTranscriptionReady, onAIError }: UseVoiceConversationOptions) {
  const [status, setStatus] = useState<VoiceLoopStatus>("idle");
  const [error, setError] = useState<VoiceLoopError | null>(null);
  const [currentAIText, setCurrentAIText] = useState<string | null>(null);
  const [lastUserTranscript, setLastUserTranscript] = useState<string | null>(null);
  const recorder = useVoiceRecorder();
  // The stable pieces — depending on them (not the per-render `recorder`
  // object) keeps every callback below referentially stable, so the stream
  // sink registered at voice-mode entry never holds a stale closure.
  const { startRecording, stopRecording, cancelRecording } = recorder;

  const activeRef = useRef(false);
  const statusRef = useRef<VoiceLoopStatus>("idle");
  const stopPlaybackRef = useRef<(() => void) | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sentence-by-sentence TTS streaming refs (desktop structure)
  const bufferRef = useRef("");
  const queueRef = useRef<QueueItem[]>([]);
  const playbackActiveRef = useRef(false);
  const streamDoneRef = useRef(false);
  /** Set by interrupt(): drop queued + future speech for the current turn. */
  const speechCancelledRef = useRef(false);
  const wakePlaybackRef = useRef<(() => void) | null>(null);

  const updateStatus = useCallback((s: VoiceLoopStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const flashError = useCallback((code: VoiceLoopError, ms: number) => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setError(code);
    errorTimerRef.current = setTimeout(() => setError(null), ms);
  }, []);

  const drainQueue = useCallback(() => {
    for (const item of queueRef.current) {
      item.audioPromise.then((speech) => deleteQuietly(speech.file)).catch(() => undefined);
    }
    queueRef.current = [];
  }, []);

  const resetStreamState = useCallback(() => {
    bufferRef.current = "";
    drainQueue();
    streamDoneRef.current = false;
    speechCancelledRef.current = false;
    playbackActiveRef.current = false;
    wakePlaybackRef.current = null;
  }, [drainQueue]);

  const beginListening = useCallback(async () => {
    updateStatus("listening");
    const started = await startRecording();
    if (!started) {
      flashError("mic_denied", 5000);
      updateStatus(activeRef.current ? "paused" : "idle");
    }
  }, [startRecording, updateStatus, flashError]);

  const enqueueSentence = useCallback((text: string) => {
    if (speechCancelledRef.current) return;
    queueRef.current.push({ text, audioPromise: speak(text) });
    wakePlaybackRef.current?.();
  }, []);

  const startPlaybackLoop = useCallback(async () => {
    if (playbackActiveRef.current) return;
    playbackActiveRef.current = true;

    while (activeRef.current && !speechCancelledRef.current) {
      const item = queueRef.current.shift();

      if (!item) {
        if (streamDoneRef.current) break; // All sentences played
        await new Promise<void>((resolve) => {
          wakePlaybackRef.current = resolve;
        });
        wakePlaybackRef.current = null;
        continue;
      }

      try {
        if (statusRef.current === "waiting_for_ai") {
          updateStatus("synthesizing");
        }
        // Voice-mode entry can race the greeting: the loop lands on listening
        // a beat before the stream opens. Speaking preempts the (un-sent)
        // recording — mic off so playback never bleeds into the next turn.
        if (statusRef.current === "listening") {
          await cancelRecording();
        }

        const speech = await item.audioPromise;
        void trackVoiceUsage("tts");

        if (!activeRef.current || speechCancelledRef.current) {
          deleteQuietly(speech.file);
          return;
        }

        updateStatus("playing");
        setLastUserTranscript(null);
        setCurrentAIText((prev) => (prev ? prev + " " + item.text : item.text));

        const playback = playSpeechFile(speech);
        stopPlaybackRef.current = playback.stop;
        await playback.promise;
        stopPlaybackRef.current = null;

        if (!activeRef.current || speechCancelledRef.current) return;
      } catch (err) {
        stopPlaybackRef.current = null;
        if (!activeRef.current || speechCancelledRef.current) return;
        console.error("TTS sentence error:", err);
        flashError("tts_failed", 4000);
        onAIError(err);
        continue; // Skip failed sentence, keep the loop alive
      }
    }

    playbackActiveRef.current = false;

    if (activeRef.current && !speechCancelledRef.current) {
      await beginListening();
    }
  }, [beginListening, cancelRecording, updateStatus, flashError, onAIError]);

  const feedStreamChunk = useCallback(
    (chunk: string) => {
      if (!activeRef.current || speechCancelledRef.current) return;
      bufferRef.current += chunk;

      let result = extractSentence(bufferRef.current);
      while (result) {
        enqueueSentence(result.sentence);
        bufferRef.current = result.remaining;
        result = extractSentence(bufferRef.current);
      }

      if (!playbackActiveRef.current && queueRef.current.length > 0) {
        void startPlaybackLoop();
      }
    },
    [enqueueSentence, startPlaybackLoop],
  );

  const flushStream = useCallback(() => {
    if (!activeRef.current) return;
    const remaining = bufferRef.current.trim();
    if (remaining && !speechCancelledRef.current) {
      enqueueSentence(remaining);
      bufferRef.current = "";
    }
    streamDoneRef.current = true;
    wakePlaybackRef.current?.();

    if (!playbackActiveRef.current && queueRef.current.length > 0 && !speechCancelledRef.current) {
      void startPlaybackLoop();
    }
  }, [enqueueSentence, startPlaybackLoop]);

  /**
   * Step 68: while the loop runs, therapy speech must survive the silent
   * switch, the mic stays claimable, and other audio does not mix in.
   */
  const configureAudioSession = useCallback(async (voiceActive: boolean) => {
    await (voiceActive ? setRecordingAudioMode() : resetAudioMode());
  }, []);

  /**
   * Entry point for both directions of the in-session switch (Step 67): with a
   * stream in flight, pass the text streamed so far and the loop speaks the
   * message from its beginning; otherwise it goes straight to listening.
   */
  const startLoop = useCallback(
    (streamedSoFar?: string | null) => {
      activeRef.current = true;
      resetStreamState();
      setError(null);
      setCurrentAIText(null);
      setLastUserTranscript(null);
      void configureAudioSession(true);
      if (typeof streamedSoFar === "string") {
        updateStatus("waiting_for_ai");
        if (streamedSoFar) feedStreamChunk(streamedSoFar);
      } else {
        void beginListening();
      }
    },
    [resetStreamState, configureAudioSession, updateStatus, feedStreamChunk, beginListening],
  );

  const haltActivity = useCallback(() => {
    stopPlaybackRef.current?.();
    stopPlaybackRef.current = null;
    resetStreamState();
    wakePlaybackRef.current?.(); // Wake the playback loop so it can exit
    void cancelRecording();
  }, [cancelRecording, resetStreamState]);

  const stopLoop = useCallback(() => {
    activeRef.current = false;
    haltActivity();
    updateStatus("idle");
    setCurrentAIText(null);
    setLastUserTranscript(null);
    void configureAudioSession(false);
  }, [haltActivity, updateStatus, configureAudioSession]);

  const pauseLoop = useCallback(() => {
    activeRef.current = false;
    haltActivity();
    updateStatus("paused");
  }, [haltActivity, updateStatus]);

  /** Mobile delta: resume means "I want to talk", so it lands on listening. */
  const resumeLoop = useCallback(() => {
    activeRef.current = true;
    resetStreamState();
    setError(null);
    void beginListening();
  }, [resetStreamState, beginListening]);

  /**
   * Tap-to-interrupt (Step 66): kill current + queued speech and listen. The
   * underlying chat stream keeps writing into the transcript unspoken.
   */
  const interrupt = useCallback(() => {
    if (statusRef.current !== "playing" && statusRef.current !== "synthesizing") return;
    speechCancelledRef.current = true;
    stopPlaybackRef.current?.();
    stopPlaybackRef.current = null;
    drainQueue();
    wakePlaybackRef.current?.();
    playbackActiveRef.current = false;
    void beginListening();
  }, [drainQueue, beginListening]);

  const handleRecordingStop = useCallback(async () => {
    let recording: File | null = null;
    try {
      recording = await stopRecording();
      updateStatus("transcribing");

      const result = await transcribe(recording, getCurrentLanguage());
      void trackVoiceUsage("stt");

      if (result.text.trim()) {
        setLastUserTranscript(result.text.trim());
        updateStatus("confirming_transcript");
      } else {
        flashError("empty_transcription", 3000);
        if (activeRef.current) {
          await beginListening();
        } else {
          updateStatus("paused");
        }
      }
    } catch (err) {
      console.error("Voice loop STT error:", err);
      flashError("stt_failed", 5000);
      onAIError(err);
      updateStatus(activeRef.current ? "paused" : "idle");
    } finally {
      deleteQuietly(recording);
    }
  }, [stopRecording, updateStatus, flashError, beginListening, onAIError]);

  const confirmTranscript = useCallback(
    (overrideText?: string) => {
      const override = typeof overrideText === "string" ? overrideText.trim() : "";
      const text = override || lastUserTranscript;
      if (!text) return;
      setLastUserTranscript(text);
      resetStreamState();
      setCurrentAIText(null);
      updateStatus("waiting_for_ai");
      onTranscriptionReady(text);
    },
    [lastUserTranscript, onTranscriptionReady, resetStreamState, updateStatus],
  );

  const retryRecording = useCallback(async () => {
    setLastUserTranscript(null);
    setError(null);
    if (activeRef.current) {
      await beginListening();
    }
  }, [beginListening]);

  // Step 68: backgrounding cannot keep recording or conversing — pause
  // explicitly so the return is a deliberate resume, never a half-dead loop.
  // (In-app interruptions — calls, Siri — are pause/resumed natively by
  // expo-audio's session observer.)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" && activeRef.current && statusRef.current !== "idle") {
        pauseLoop();
      }
    });
    return () => subscription.remove();
  }, [pauseLoop]);

  // Leaving the surface entirely must release the mic and the audio session.
  useEffect(() => {
    return () => {
      if (activeRef.current || statusRef.current !== "idle") {
        activeRef.current = false;
        haltActivity();
        void configureAudioSession(false);
      }
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    error,
    currentAIText,
    lastUserTranscript,
    recorder,
    startLoop,
    stopLoop,
    pauseLoop,
    resumeLoop,
    interrupt,
    feedStreamChunk,
    flushStream,
    handleRecordingStop,
    confirmTranscript,
    retryRecording,
  };
}
