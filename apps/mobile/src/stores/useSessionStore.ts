import { create } from "zustand";
import type { ChatMessage } from "@opengnothia/shared/types";

/**
 * M13: mobile writes its own session store rather than copying desktop's.
 * Differences from desktop's are deliberate: no thinking stream (the Worker
 * pins thinking off), no compaction (the proxied model's 1M context is
 * unreachable in a therapy session), no AI insight-extraction state (not in
 * the M9 parity list) — and the desktop "pre" status collapses into "idle"
 * because the mobile start flow is a pair of sheets, not a separate screen.
 */
type SessionStatus = "idle" | "active" | "post";

interface SessionState {
  status: SessionStatus;
  sessionId: string | null;
  startedAt: string | null;
  messages: ChatMessage[];
  /** True from send until the stream finishes (drives the typing dots). */
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessageId: string | null;
  abortController: AbortController | null;
  /** Input tokens of the last request — the context usage indicator's source. */
  currentInputTokens: number;
  /** SESSION_END_MARKER arrived: the closing prompt replaces the input bar. */
  pendingEndPrompt: boolean;
  summaryNarrative: string;
  isSummaryStreaming: boolean;
  /** Insights saved during this session (Step 43) — shown on the end screen. */
  sessionInsightIds: string[];
  /**
   * Background notes in-flight marker (desktop keeps this in useAppStore).
   * Deliberately NOT cleared by reset(): notes outlive the session they
   * describe, and a new session must not start while they run.
   */
  noteTakingStartedAt: number | null;

  startSession: () => void;
  addMessage: (message: ChatMessage) => void;
  startStreaming: () => string;
  appendStreamContent: (chunk: string) => void;
  finishStreaming: () => void;
  removeMessage: (id: string) => void;
  setAbortController: (controller: AbortController | null) => void;
  setCurrentInputTokens: (tokens: number) => void;
  setPendingEndPrompt: (pending: boolean) => void;
  endSession: () => void;
  startSummaryStream: () => void;
  appendSummaryNarrative: (chunk: string) => void;
  finishSummaryStream: () => void;
  failSummaryStream: () => void;
  addSessionInsightId: (id: string) => void;
  removeSessionInsightId: (id: string) => void;
  startNoteTaking: () => number;
  finishNoteTaking: (runStartedAt: number) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  status: "idle",
  sessionId: null,
  startedAt: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingMessageId: null,
  abortController: null,
  currentInputTokens: 0,
  pendingEndPrompt: false,
  summaryNarrative: "",
  isSummaryStreaming: false,
  sessionInsightIds: [],
  noteTakingStartedAt: null,

  startSession: () =>
    set({
      status: "active",
      sessionId: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      messages: [],
      isLoading: false,
      isStreaming: false,
      streamingMessageId: null,
      abortController: null,
      currentInputTokens: 0,
      pendingEndPrompt: false,
      summaryNarrative: "",
      isSummaryStreaming: false,
      sessionInsightIds: [],
    }),

  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),

  startStreaming: () => {
    const id = crypto.randomUUID();
    const msg: ChatMessage = {
      id,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };
    set((s) => ({
      messages: [...s.messages, msg],
      isStreaming: true,
      streamingMessageId: id,
      isLoading: true,
    }));
    return id;
  },

  appendStreamContent: (chunk) => {
    const { streamingMessageId } = get();
    if (!streamingMessageId) return;
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === streamingMessageId ? { ...m, content: m.content + chunk } : m
      ),
    }));
  },

  finishStreaming: () => {
    const { streamingMessageId } = get();
    set((s) => ({
      messages: streamingMessageId
        ? s.messages.map((m) => (m.id === streamingMessageId ? { ...m, isStreaming: false } : m))
        : s.messages,
      isStreaming: false,
      streamingMessageId: null,
      abortController: null,
      isLoading: false,
    }));
  },

  removeMessage: (id) => set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),

  setAbortController: (abortController) => set({ abortController }),

  setCurrentInputTokens: (currentInputTokens) => set({ currentInputTokens }),

  setPendingEndPrompt: (pendingEndPrompt) => set({ pendingEndPrompt }),

  endSession: () => set({ status: "post", pendingEndPrompt: false }),


  startSummaryStream: () => set({ summaryNarrative: "", isSummaryStreaming: true }),

  appendSummaryNarrative: (chunk) =>
    set((s) => ({ summaryNarrative: s.summaryNarrative + chunk })),

  finishSummaryStream: () => set({ isSummaryStreaming: false }),

  // A partial AI stream is not a valid summary and must remain retryable.
  failSummaryStream: () => set({ summaryNarrative: "", isSummaryStreaming: false }),

  addSessionInsightId: (id) =>
    set((s) => ({ sessionInsightIds: [...s.sessionInsightIds, id] })),

  removeSessionInsightId: (id) =>
    set((s) => ({ sessionInsightIds: s.sessionInsightIds.filter((x) => x !== id) })),

  startNoteTaking: () => {
    const runStartedAt = Date.now();
    set({ noteTakingStartedAt: runStartedAt });
    return runStartedAt;
  },

  // Guarded like desktop's finishSessionNoteTaking: a stale finish (from a run
  // that was superseded) must not clear a newer run's flag.
  finishNoteTaking: (runStartedAt) => {
    if (get().noteTakingStartedAt === runStartedAt) {
      set({ noteTakingStartedAt: null });
    }
  },

  reset: () =>
    set({
      status: "idle",
      sessionId: null,
      startedAt: null,
      messages: [],
      isLoading: false,
      isStreaming: false,
      streamingMessageId: null,
      abortController: null,
      currentInputTokens: 0,
      pendingEndPrompt: false,
      summaryNarrative: "",
      isSummaryStreaming: false,
      sessionInsightIds: [],
    }),
}));
