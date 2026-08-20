import { fetch as expoFetch } from "expo/fetch";
import { Directory, File, Paths } from "expo-file-system";
import { AIError } from "@opengnothia/shared/ai/AIError";
import { sendMessage, streamMessage } from "@opengnothia/shared/ai/aiService";
import { takeBackgroundNotes } from "@opengnothia/shared/ai/backgroundNotes";
import { transcribeAudio, type TranscriptionResult } from "@opengnothia/shared/ai/transcriptionService";
import type { ChatMessage, TokenUsage } from "@opengnothia/shared/types";
import { getQueries } from "@/db";
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

/**
 * Shared takeBackgroundNotes behind the proxy config (Faz 5 Step 45). Notes
 * are silent-failure by design, so a not-yet-ready subscription identity just
 * skips the run instead of surfacing an error.
 */
export function takeSessionNotes(params: {
  messages: ChatMessage[];
  systemPrompt: string;
  callType: string;
  sessionId?: string | null;
}): Promise<void> {
  const appUserId = getAppUserId();
  if (appUserId === null) return Promise.resolve();
  return takeBackgroundNotes({
    provider: PROXY_PROVIDER,
    apiKey: appUserId,
    model: PROXY_MODEL,
    customBaseUrl: WORKER_BASE_URL,
    getQueries,
    ...params,
  });
}

/**
 * STT (Faz 8 Step 64): the shared service does the multipart POST; the
 * expo-file-system File implements Blob (name included, so the Worker sees the
 * .m4a extension), and expo/fetch is injected because RN's fetch cannot
 * serialize Blob-backed FormData.
 */
export function transcribe(recording: File, language?: string): Promise<TranscriptionResult> {
  return transcribeAudio(
    recording,
    requireAppUserId(),
    language,
    WORKER_BASE_URL,
    expoFetch as unknown as typeof fetch,
  );
}

export interface SpeechResult {
  /** Temporary mp3 under caches/tts — the caller deletes it after playback. */
  file: File;
  characterCount: number;
}

/**
 * TTS (Faz 8 Step 65). Not the shared ttsService: that contract is web-shaped
 * (Blob out, HTMLAudio playback), while expo-audio players want a file URI —
 * so the bytes land in a temp file here. Model and voice are Worker constants
 * (D15); only `input` crosses the wire.
 */
export async function speak(text: string): Promise<SpeechResult> {
  const appUserId = requireAppUserId();
  const response = await expoFetch(`${WORKER_BASE_URL}/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${appUserId}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: text, response_format: "mp3" }),
  });
  if (!response.ok) {
    const rawBody = await response.text().catch(() => undefined);
    throw new AIError(`TTS failed (${response.status})`, response.status, rawBody);
  }
  const bytes = await response.bytes();

  const dir = new Directory(Paths.cache, "tts");
  dir.create({ intermediates: true, idempotent: true });
  const file = new File(dir, `${crypto.randomUUID()}.mp3`);
  file.write(bytes);
  return { file, characterCount: text.length };
}
