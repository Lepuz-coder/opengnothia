import {
  BACKGROUND_NOTES_SYSTEM_PROMPT,
  GREETING_TRIGGER,
  SESSION_END_MARKER,
  SESSION_SUMMARY_SYSTEM_PROMPT,
  buildGreetingPrompt,
  buildPatientNotesUpdatePrompt,
  buildSummaryPrompt,
  buildSystemPrompt,
} from "@opengnothia/shared/ai/promptBuilder";
import { getCurrentLanguage } from "@opengnothia/shared/i18n";
import { createBufferedTextStream } from "@opengnothia/shared/lib/createBufferedTextStream";
import { createMarkerStrippedStream } from "@opengnothia/shared/lib/createMarkerStrippedStream";
import type { ChatMessage, TokenUsage } from "@opengnothia/shared/types";
import { streamChat, takeSessionNotes } from "@/ai/client";
import { getQueries } from "@/db";
import { useSessionStore } from "@/stores/useSessionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

/**
 * Desktop SessionPage's orchestration, rebuilt on the mobile stack: the same
 * shared prompt builders, but every AI call goes through src/ai/client.ts
 * (Worker + appUserID bearer) and there is no compaction — the Worker's model
 * has a 1M context no therapy session approaches, so the desktop 80% guard
 * would be dead code here.
 */
const CHAT_STREAM_FLUSH_DELAY_MS = 48;

/**
 * Context window of the model the Worker actually runs (CHAT_MODEL in
 * apps/backend/wrangler.toml — the client never picks a model, D15). Only the
 * usage indicator reads this; a backend model swap should update it.
 */
export const PROXY_CONTEXT_WINDOW = 1_050_000;

/**
 * Faz 8: the voice loop taps the assistant stream here — desktop's
 * voiceFeedRef/voiceFlushRef pair as a module-level registration, since this
 * orchestration lives outside any component. SessionModal registers the sink
 * while voice mode is active and clears it on exit.
 */
export interface VoiceStreamSink {
  feed: (chunk: string) => void;
  flush: () => void;
}

let voiceSink: VoiceStreamSink | null = null;

export function setVoiceSink(sink: VoiceStreamSink | null): void {
  voiceSink = sink;
}

async function trackUsage(callType: string, usage: TokenUsage | null) {
  if (!usage) return;
  const sessionId = useSessionStore.getState().sessionId;
  const queries = await getQueries();
  // Model/cost are opaque behind the proxy (M5): record the token trail with
  // the placeholder model id and zero cost.
  await queries.saveTokenUsage({
    session_id: sessionId,
    provider: "openai",
    model: "proxy",
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    cost: 0,
    call_type: callType,
  });
}

async function buildPromptParams() {
  const queries = await getQueries();
  const [profile, checkIn, recentSessions, patientNotes, sessionCount, latestIntake] = await Promise.all([
    queries.getUserProfile(),
    queries.getTodayCheckIn(),
    queries.getRecentSessions(1),
    queries.getPatientNotes(),
    queries.getCompletedSessionCount(),
    queries.getPatientIntakeForm(),
  ]);
  return {
    profile,
    todayCheckIn: checkIn,
    lastSessionSummary: recentSessions[0]?.summary ?? null,
    lastSessionNarrative: recentSessions[0]?.summary_narrative ?? null,
    therapySchool: useSettingsStore.getState().schoolId ?? undefined,
    patientNotes,
    lastSessionDate: recentSessions[0]?.started_at ?? null,
    totalSessionCount: sessionCount,
    language: getCurrentLanguage(),
    sessionStartedAt: useSessionStore.getState().startedAt,
    intakeForm: latestIntake,
  };
}

function completedMessages(): ChatMessage[] {
  return useSessionStore.getState().messages.filter((m) => !m.isStreaming);
}

/** Store bootstrap + DB row; the greeting is a separate call so its failure never orphans the row. */
export async function startSessionInDb(moodBefore: number): Promise<void> {
  const store = useSessionStore.getState();
  store.startSession(moodBefore);
  try {
    const { sessionId, startedAt } = useSessionStore.getState();
    const queries = await getQueries();
    await queries.createSession({ id: sessionId!, started_at: startedAt!, mood_before: moodBefore });
  } catch (error) {
    // startSession makes the fullscreen modal visible immediately. If the DB
    // row cannot be created, restore the idle state instead of leaving an
    // active in-memory session with nothing durable behind it.
    useSessionStore.getState().reset();
    throw error;
  }
}

interface StreamTurnParams {
  requestMessages: ChatMessage[];
  systemPrompt: string;
  callType: "greeting" | "chat";
  onAIError: (error: unknown) => void;
}

/** Shared plumbing of the greeting and every chat turn. */
async function streamAssistantTurn({ requestMessages, systemPrompt, callType, onAIError }: StreamTurnParams) {
  const store = useSessionStore.getState;
  const abortController = new AbortController();
  store().setAbortController(abortController);
  store().startStreaming();

  const contentStream = createMarkerStrippedStream(
    SESSION_END_MARKER,
    (safeChunk) => {
      store().appendStreamContent(safeChunk);
      voiceSink?.feed(safeChunk);
    },
    CHAT_STREAM_FLUSH_DELAY_MS,
  );

  await streamChat({
    messages: requestMessages,
    systemPrompt,
    abortSignal: abortController.signal,
    onContent: (chunk) => contentStream.push(chunk),
    onDone: () => {
      contentStream.flush();
      store().finishStreaming();
      const sessionId = store().sessionId;
      if (sessionId) {
        getQueries().then((q) => q.updateSessionMessages(sessionId, store().messages)).catch(() => undefined);
      }
      voiceSink?.flush();
      if (contentStream.hasMarker()) {
        store().setPendingEndPrompt(true);
      }
    },
    onUsage: (usage) => {
      void trackUsage(callType, usage);
      store().setCurrentInputTokens(usage.inputTokens);
    },
    onError: (error) => {
      contentStream.cancel();
      const s = store();
      if (s.streamingMessageId) {
        s.removeMessage(s.streamingMessageId);
      }
      s.finishStreaming();
      onAIError(error);
    },
  });

  if (abortController.signal.aborted) {
    contentStream.cancel();
  }
}

export async function streamGreeting(onAIError: (error: unknown) => void): Promise<void> {
  try {
    const params = await buildPromptParams();
    const greetingPrompt = buildGreetingPrompt(params);
    await streamAssistantTurn({
      requestMessages: [
        { id: "greeting-trigger", role: "user", content: GREETING_TRIGGER, timestamp: new Date().toISOString() },
      ],
      systemPrompt: greetingPrompt,
      callType: "greeting",
      onAIError,
    });
  } catch (err) {
    useSessionStore.getState().finishStreaming();
    onAIError(err);
  }
}

export async function sendUserMessage(content: string, onAIError: (error: unknown) => void): Promise<void> {
  const store = useSessionStore.getState();
  if (store.isStreaming) return;

  store.addMessage({
    id: crypto.randomUUID(),
    role: "user",
    content,
    timestamp: new Date().toISOString(),
  });

  try {
    const params = await buildPromptParams();
    const systemPrompt = buildSystemPrompt(params);
    await streamAssistantTurn({
      requestMessages: completedMessages(),
      systemPrompt,
      callType: "chat",
      onAIError,
    });
  } catch (err) {
    useSessionStore.getState().finishStreaming();
    onAIError(err);
  }
}

/**
 * Step 45: post-session async note generation — the memory of the next
 * session (M9). Fire-and-forget with silent failure, exactly like desktop;
 * the store flag drives the banner and blocks a premature next session.
 */
function kickOffBackgroundNotes(messages: ChatMessage[]): void {
  const store = useSessionStore.getState();
  const runStartedAt = store.startNoteTaking();
  const sessionId = store.sessionId;

  getQueries()
    .then((queries) => Promise.all([queries.getPatientNotes(), queries.getPatientNotesUpdatedAt()]))
    .then(([existingNotes, notesUpdatedAt]) => {
      const notesPrompt = buildPatientNotesUpdatePrompt(existingNotes, notesUpdatedAt, getCurrentLanguage());
      const conversationForNotes: ChatMessage[] = [
        ...messages,
        { id: "notes-request", role: "user", content: notesPrompt, timestamp: new Date().toISOString() },
      ];
      return takeSessionNotes({
        messages: conversationForNotes,
        systemPrompt: BACKGROUND_NOTES_SYSTEM_PROMPT,
        callType: "patient_notes",
        sessionId,
      });
    })
    .catch(() => {
      // Silent failure for background notes
    })
    .finally(() => {
      useSessionStore.getState().finishNoteTaking(runStartedAt);
    });
}

/**
 * The end-confirmation's action. A session with fewer than two user turns is
 * discarded (desktop rule); a real one flips to the end screen and starts the
 * background notes immediately.
 */
export async function finishSession(): Promise<"busy" | "deleted" | "post"> {
  const store = useSessionStore.getState();
  if (store.isStreaming) return "busy";

  const messages = completedMessages();
  const userMessageCount = messages.filter((m) => m.role === "user").length;

  if (userMessageCount < 2) {
    if (store.sessionId) {
      const queries = await getQueries();
      await queries.deleteSession(store.sessionId);
    }
    store.reset();
    return "deleted";
  }

  store.endSession();
  kickOffBackgroundNotes(messages);
  return "post";
}

export async function generateSummary(onAIError: (error: unknown) => void): Promise<void> {
  const store = useSessionStore.getState;
  if (store().isSummaryStreaming) return;
  store().startSummaryStream();

  const summaryStream = createBufferedTextStream((chunk) => store().appendSummaryNarrative(chunk));
  let streamFailed = false;

  try {
    const queries = await getQueries();
    const patientNotes = await queries.getPatientNotes();
    const summaryPrompt = buildSummaryPrompt(patientNotes, getCurrentLanguage());
    const conversationForSummary: ChatMessage[] = [
      ...completedMessages(),
      { id: "summary-request", role: "user", content: summaryPrompt, timestamp: new Date().toISOString() },
    ];

    await streamChat({
      messages: conversationForSummary,
      systemPrompt: SESSION_SUMMARY_SYSTEM_PROMPT,
      onContent: (chunk) => summaryStream.push(chunk),
      onDone: () => {
        summaryStream.flush();
        store().finishSummaryStream();
      },
      onUsage: (usage) => {
        void trackUsage("summary", usage);
      },
      onError: (error) => {
        streamFailed = true;
        summaryStream.cancel();
        store().failSummaryStream();
        onAIError(error);
      },
    });
  } catch (err) {
    summaryStream.cancel();
    store().failSummaryStream();
    if (!streamFailed) onAIError(err);
  }
}

/** Persist the completed session and return the store to idle. */
export async function saveAndCloseSession(): Promise<void> {
  const state = useSessionStore.getState();
  if (state.sessionId) {
    const queries = await getQueries();
    await queries.completeSession(state.sessionId, {
      mood_after: state.moodAfter ?? state.moodBefore ?? 5,
      summary: state.summaryNarrative
        ? { themes: [], defenses: [], insights: [], homework: [] }
        : null,
      summary_narrative: state.summaryNarrative || undefined,
    });
  }
  useSessionStore.getState().reset();
}
