import { useState, useCallback, useRef } from "react";
import { useSessionStore } from "@/stores/useSessionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { synthesizeSpeech, playAudioBlob, type TTSResult } from "@/services/ai/ttsService";
import { transcribeAudio } from "@/services/ai/transcriptionService";
import { saveTokenUsage } from "@/services/db/queries";

export type VoiceLoopStatus =
  | "idle"
  | "waiting_for_ai"
  | "synthesizing"
  | "playing"
  | "listening"
  | "transcribing"
  | "confirming_transcript"
  | "paused";

interface UseVoiceConversationOptions {
  onTranscriptionReady: (text: string) => void;
  language: string;
}

type QueueItem = { text: string; audioPromise: Promise<TTSResult> };

const MIN_SENTENCE_LENGTH = 40;
const MIN_PARA_LENGTH = 15;

/**
 * Extracts a complete sentence from the buffer if one is found.
 * Returns the sentence and remaining buffer, or null if no sentence boundary yet.
 */
function extractSentence(buffer: string): { sentence: string; remaining: string } | null {
  // Sentence-ending punctuation followed by whitespace, minimum length to skip abbreviations
  const match = buffer.match(/^([\s\S]{40,}?[.!?;:])\s+([\s\S]*)$/);
  if (match) return { sentence: match[1], remaining: match[2] };
  // Paragraph break (\n\n) — can split at shorter length
  const paraMatch = buffer.match(/^([\s\S]+?)\n\n([\s\S]*)$/);
  if (paraMatch && paraMatch[1].length >= MIN_PARA_LENGTH) {
    return { sentence: paraMatch[1], remaining: paraMatch[2] };
  }
  return null;
}

export function useVoiceConversation({ onTranscriptionReady, language }: UseVoiceConversationOptions) {
  const [status, setStatus] = useState<VoiceLoopStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [currentAIText, setCurrentAIText] = useState<string | null>(null);
  const [lastUserTranscript, setLastUserTranscript] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const activeRef = useRef(false);
  const recorder = useAudioRecorder();

  // Sentence-by-sentence TTS streaming refs
  const bufferRef = useRef("");
  const queueRef = useRef<QueueItem[]>([]);
  const playbackActiveRef = useRef(false);
  const streamDoneRef = useRef(false);
  const wakePlaybackRef = useRef<(() => void) | null>(null);
  const statusRef = useRef<VoiceLoopStatus>("idle");

  // Keep statusRef in sync
  const updateStatus = useCallback((s: VoiceLoopStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const resetStreamState = useCallback(() => {
    bufferRef.current = "";
    queueRef.current = [];
    streamDoneRef.current = false;
    playbackActiveRef.current = false;
    wakePlaybackRef.current = null;
  }, []);

  const enqueueSentence = useCallback((text: string) => {
    const settings = useSettingsStore.getState();
    const transcriptApiKey = settings.transcriptApiKey;
    if (!transcriptApiKey) return;

    const audioPromise = synthesizeSpeech(text, transcriptApiKey, settings.ttsModel, settings.ttsVoice);
    queueRef.current.push({ text, audioPromise });
    // Wake up the playback loop if it's waiting
    wakePlaybackRef.current?.();
  }, []);

  const trackTTSCost = useCallback(async (ttsResult: TTSResult) => {
    const settings = useSettingsStore.getState();
    const sessionId = useSessionStore.getState().sessionId;
    await saveTokenUsage({
      session_id: sessionId,
      provider: "openai",
      model: settings.ttsModel,
      input_tokens: 0,
      output_tokens: 0,
      cost: ttsResult.cost,
      call_type: "tts",
    });
  }, []);

  const startPlaybackLoop = useCallback(async () => {
    if (playbackActiveRef.current) return;
    playbackActiveRef.current = true;

    while (activeRef.current) {
      const item = queueRef.current.shift();

      if (!item) {
        if (streamDoneRef.current) break; // All sentences played
        // Wait for next queue item
        await new Promise<void>((resolve) => {
          wakePlaybackRef.current = resolve;
        });
        wakePlaybackRef.current = null;
        continue;
      }

      try {
        // Show "synthesizing" while waiting for first audio
        if (statusRef.current === "waiting_for_ai") {
          updateStatus("synthesizing");
        }

        const ttsResult = await item.audioPromise;
        trackTTSCost(ttsResult);

        if (!activeRef.current) return;

        updateStatus("playing");
        setLastUserTranscript(null);
        setCurrentAIText((prev) => prev ? prev + " " + item.text : item.text);

        const playback = playAudioBlob(ttsResult.audioBlob);
        stopRef.current = playback.stop;
        await playback.promise;
        stopRef.current = null;

        if (!activeRef.current) return;
      } catch (err) {
        if (!activeRef.current) return;
        console.error("TTS sentence error:", err);
        // Skip failed sentence, continue with next
        continue;
      }
    }

    playbackActiveRef.current = false;

    if (activeRef.current) {
      updateStatus("listening");
      await recorder.startRecording();
    }
  }, [recorder, updateStatus, trackTTSCost]);

  const feedStreamChunk = useCallback((chunk: string) => {
    if (!activeRef.current) return;
    bufferRef.current += chunk;

    // Extract complete sentences from buffer
    let result = extractSentence(bufferRef.current);
    while (result) {
      enqueueSentence(result.sentence);
      bufferRef.current = result.remaining;
      result = extractSentence(bufferRef.current);
    }

    // Start playback loop if not already running
    if (!playbackActiveRef.current && queueRef.current.length > 0) {
      startPlaybackLoop();
    }
  }, [enqueueSentence, startPlaybackLoop]);

  const flushStream = useCallback(() => {
    // Flush remaining buffer as the last sentence
    const remaining = bufferRef.current.trim();
    if (remaining) {
      enqueueSentence(remaining);
      bufferRef.current = "";
    }
    streamDoneRef.current = true;
    // Wake up the playback loop so it can finish
    wakePlaybackRef.current?.();

    // If playback never started (e.g. very short response), start it now
    if (!playbackActiveRef.current && queueRef.current.length > 0) {
      startPlaybackLoop();
    }
  }, [enqueueSentence, startPlaybackLoop]);

  const startLoop = useCallback(() => {
    activeRef.current = true;
    resetStreamState();
    updateStatus("waiting_for_ai");
    setError(null);
    setCurrentAIText(null);
    setLastUserTranscript(null);
  }, [resetStreamState, updateStatus]);

  const stopLoop = useCallback(() => {
    activeRef.current = false;
    stopRef.current?.();
    stopRef.current = null;
    resetStreamState();
    wakePlaybackRef.current?.(); // Wake to let loop exit
    recorder.cancelRecording();
    updateStatus("idle");
  }, [recorder, resetStreamState, updateStatus]);

  const pauseLoop = useCallback(() => {
    activeRef.current = false;
    stopRef.current?.();
    stopRef.current = null;
    resetStreamState();
    wakePlaybackRef.current?.();
    recorder.cancelRecording();
    updateStatus("paused");
  }, [recorder, resetStreamState, updateStatus]);

  const resumeLoop = useCallback(() => {
    activeRef.current = true;
    resetStreamState();
    updateStatus("waiting_for_ai");
    setError(null);
  }, [resetStreamState, updateStatus]);

  const handleRecordingStop = useCallback(async () => {
    try {
      const audioBlob = await recorder.stopRecording();
      updateStatus("transcribing");

      const transcriptApiKey = useSettingsStore.getState().transcriptApiKey;
      const result = await transcribeAudio(audioBlob, transcriptApiKey, language);

      // Track STT cost
      const sessionId = useSessionStore.getState().sessionId;
      await saveTokenUsage({
        session_id: sessionId,
        provider: "openai",
        model: "whisper-1",
        input_tokens: 0,
        output_tokens: 0,
        cost: result.cost,
        call_type: "stt",
      });

      if (result.text.trim()) {
        setLastUserTranscript(result.text.trim());
        updateStatus("confirming_transcript");
      } else {
        // Empty transcription -- restart recording if active
        setError("No speech detected");
        setTimeout(() => setError(null), 3000);
        if (activeRef.current) {
          updateStatus("listening");
          await recorder.startRecording();
        } else {
          updateStatus(activeRef.current ? "waiting_for_ai" : "paused");
        }
      }
    } catch (err) {
      console.error("Voice loop STT error:", err);
      setError(err instanceof Error ? err.message : "Transcription failed");
      setTimeout(() => setError(null), 5000);
      updateStatus(activeRef.current ? "waiting_for_ai" : "idle");
    }
  }, [recorder, language, resetStreamState, updateStatus]);

  const confirmTranscript = useCallback(() => {
    if (!lastUserTranscript) return;
    const text = lastUserTranscript;
    resetStreamState();
    setCurrentAIText(null);
    updateStatus("waiting_for_ai");
    onTranscriptionReady(text);
  }, [lastUserTranscript, onTranscriptionReady, resetStreamState, updateStatus]);

  const retryRecording = useCallback(async () => {
    setLastUserTranscript(null);
    setError(null);
    if (activeRef.current) {
      updateStatus("listening");
      await recorder.startRecording();
    }
  }, [recorder, updateStatus]);

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
    feedStreamChunk,
    flushStream,
    handleRecordingStop,
    confirmTranscript,
    retryRecording,
  };
}
