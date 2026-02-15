import { create } from "zustand";
import type { ChatMessage, SessionStatus, SessionSummary } from "@/types";

interface SessionState {
  status: SessionStatus;
  sessionId: string | null;
  messages: ChatMessage[];
  moodBefore: number | null;
  moodAfter: number | null;
  summary: SessionSummary | null;
  startedAt: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessageId: string | null;
  abortController: AbortController | null;
  summaryNarrative: string;
  isSummaryStreaming: boolean;
  isSummaryParsing: boolean;
  currentInputTokens: number;
  isCompacting: boolean;
  compactedContext: string | null;
  compactedAtIndex: number;

  setStatus: (status: SessionStatus) => void;
  startSession: (moodBefore: number) => void;
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setSummary: (summary: SessionSummary) => void;
  setMoodAfter: (mood: number) => void;
  endSession: () => void;
  reset: () => void;

  startStreaming: () => string;
  appendStreamContent: (chunk: string) => void;
  appendStreamThinking: (chunk: string) => void;
  finishStreaming: () => void;
  cancelStreaming: () => void;
  setAbortController: (controller: AbortController | null) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;

  startSummaryStream: () => void;
  appendSummaryNarrative: (chunk: string) => void;
  finishSummaryStream: () => void;
  setSummaryParsing: (parsing: boolean) => void;

  setCurrentInputTokens: (tokens: number) => void;
  startCompaction: () => void;
  finishCompaction: () => void;
  applyCompaction: (context: string) => void;
}

function generateId() {
  return crypto.randomUUID();
}

export const useSessionStore = create<SessionState>((set, get) => ({
  status: "idle",
  sessionId: null,
  messages: [],
  moodBefore: null,
  moodAfter: null,
  summary: null,
  startedAt: null,
  isLoading: false,
  isStreaming: false,
  streamingMessageId: null,
  abortController: null,
  summaryNarrative: "",
  isSummaryStreaming: false,
  isSummaryParsing: false,
  currentInputTokens: 0,
  isCompacting: false,
  compactedContext: null,
  compactedAtIndex: 0,

  setStatus: (status) => set({ status }),

  startSession: (moodBefore) =>
    set({
      status: "active",
      sessionId: generateId(),
      messages: [],
      moodBefore,
      moodAfter: null,
      summary: null,
      startedAt: new Date().toISOString(),
      isLoading: false,
      isStreaming: false,
      streamingMessageId: null,
      abortController: null,
      currentInputTokens: 0,
      isCompacting: false,
      compactedContext: null,
      compactedAtIndex: 0,
    }),

  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),

  setLoading: (isLoading) => set({ isLoading }),

  setSummary: (summary) => set({ summary, status: "post" }),

  setMoodAfter: (moodAfter) => set({ moodAfter }),

  endSession: () => set({ status: "post" }),

  reset: () =>
    set({
      status: "idle",
      sessionId: null,
      messages: [],
      moodBefore: null,
      moodAfter: null,
      summary: null,
      startedAt: null,
      isLoading: false,
      isStreaming: false,
      streamingMessageId: null,
      abortController: null,
      summaryNarrative: "",
      isSummaryStreaming: false,
      isSummaryParsing: false,
      currentInputTokens: 0,
      isCompacting: false,
      compactedContext: null,
      compactedAtIndex: 0,
    }),

  startStreaming: () => {
    const id = generateId();
    const msg: ChatMessage = {
      id,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      thinking: "",
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

  appendStreamThinking: (chunk) => {
    const { streamingMessageId } = get();
    if (!streamingMessageId) return;
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === streamingMessageId ? { ...m, thinking: (m.thinking ?? "") + chunk } : m
      ),
    }));
  },

  finishStreaming: () => {
    const { streamingMessageId } = get();
    if (streamingMessageId) {
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === streamingMessageId ? { ...m, isStreaming: false } : m
        ),
        isStreaming: false,
        streamingMessageId: null,
        abortController: null,
        isLoading: false,
      }));
    } else {
      set({ isStreaming: false, streamingMessageId: null, abortController: null, isLoading: false });
    }
  },

  cancelStreaming: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    const { streamingMessageId } = get();
    if (streamingMessageId) {
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === streamingMessageId ? { ...m, isStreaming: false, content: m.content || "İptal edildi." } : m
        ),
        isStreaming: false,
        streamingMessageId: null,
        abortController: null,
        isLoading: false,
      }));
    } else {
      set({ isStreaming: false, streamingMessageId: null, abortController: null, isLoading: false });
    }
  },

  setAbortController: (controller) => set({ abortController: controller }),

  updateMessage: (id, updates) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),

  startSummaryStream: () =>
    set({
      status: "post",
      summaryNarrative: "",
      isSummaryStreaming: true,
      summary: null,
    }),

  appendSummaryNarrative: (chunk) =>
    set((s) => ({
      summaryNarrative: s.summaryNarrative + chunk,
    })),

  finishSummaryStream: () => set({ isSummaryStreaming: false }),

  setSummaryParsing: (parsing) => set({ isSummaryParsing: parsing }),

  setCurrentInputTokens: (tokens) => set({ currentInputTokens: tokens }),

  startCompaction: () => set({ isCompacting: true }),

  finishCompaction: () => set({ isCompacting: false }),

  applyCompaction: (context) =>
    set((s) => ({ compactedContext: context, compactedAtIndex: s.messages.length, currentInputTokens: 0 })),
}));
