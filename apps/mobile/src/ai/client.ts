import { fetch as expoFetch } from "expo/fetch";
import { AIError } from "@opengnothia/shared/ai/AIError";
import { sendMessage, streamMessage } from "@opengnothia/shared/ai/aiService";
import { transcribeAudio, type TranscriptionResult } from "@opengnothia/shared/ai/transcriptionService";
import { synthesizeSpeech, type TTSResult } from "@opengnothia/shared/ai/ttsService";
import type { ChatMessage, TokenUsage } from "@opengnothia/shared/types";
import { getAppUserId } from "@/stores/useSubscriptionStore";

/**
 * D15/M5: every AI call goes to our Worker, authenticated with the anonymous
 * RevenueCat appUserID as the Bearer token (D14). Model, reasoning, voice and
 * limits are decided server-side — the constants here only shape the request
 * envelope, they never pick the model.
 */
const WORKER_BASE_URL = "https://opengnothia-api.ckiranli.workers.dev/v1";
const PROXY_PROVIDER = "openai" as const;
// Deliberately not a reasoning-model name: keeps the shared adapter on the
// plain chat/completions path — /responses does not exist on the Worker.
const PROXY_MODEL = "proxy";

function requireAppUserId(): string {
  const id = getAppUserId();
  if (id === null) {
    // Purchases.configure runs in the root layout; reaching this means an AI
    // call fired before startup finished — surface it as a normal AIError.
    throw new AIError("Subscription identity is not ready yet");
  }
  return id;
}

export function streamChat(params: {
  messages: ChatMessage[];
  systemPrompt: string;
  abortSignal?: AbortSignal;
  onContent: (chunk: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
  onUsage?: (usage: TokenUsage) => void;
}): Promise<void> {
  let appUserId: string;
  try {
    appUserId = requireAppUserId();
  } catch (err) {
    params.onError(err as Error);
    return Promise.resolve();
  }
  return streamMessage({
    provider: PROXY_PROVIDER,
    apiKey: appUserId,
    model: PROXY_MODEL,
    customBaseUrl: WORKER_BASE_URL,
    thinkingEnabled: false,
    // React Native's fetch cannot stream response bodies; expo/fetch can.
    fetchImpl: expoFetch as unknown as typeof fetch,
    onThinking: () => undefined,
    ...params,
  });
}

/** Non-streaming chat — for background jobs like summaries and notes (Faz 5). */
export function sendChat(params: {
  messages: ChatMessage[];
  systemPrompt: string;
  maxTokens?: number;
}): Promise<{ content: string; usage: TokenUsage | null }> {
  return sendMessage({
    provider: PROXY_PROVIDER,
    apiKey: requireAppUserId(),
    model: PROXY_MODEL,
    customBaseUrl: WORKER_BASE_URL,
    ...params,
  });
}

export function transcribe(audioBlob: Blob, language?: string): Promise<TranscriptionResult> {
  return transcribeAudio(audioBlob, requireAppUserId(), language, WORKER_BASE_URL);
}

/** Model/voice arguments are overridden by the Worker (D15) — pass the defaults. */
export function speak(text: string): Promise<TTSResult> {
  return synthesizeSpeech(text, requireAppUserId(), "tts-1", "alloy", WORKER_BASE_URL);
}
