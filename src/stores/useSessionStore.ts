import { create } from "zustand";
import type { ChatMessage, SessionStatus, SessionSummary, TokenUsage } from "@/types";

interface SessionState {
  status: SessionStatus;
  sessionId: string | null;
  messages: ChatMessage[];
  moodBefore: number | null;
  moodAfter: number | null;
  summary: SessionSummary | null;
  startedAt: string | null;
  isLoading: boolean;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  modelUsed: string | null;

  setStatus: (status: SessionStatus) => void;
  startSession: (moodBefore: number) => void;
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setSummary: (summary: SessionSummary) => void;
  setMoodAfter: (mood: number) => void;
  addUsage: (usage: TokenUsage, cost: number) => void;
  setModelUsed: (model: string) => void;
  endSession: () => void;
  reset: () => void;
}

function generateId() {
  return crypto.randomUUID();
}

export const useSessionStore = create<SessionState>((set) => ({
  status: "idle",
  sessionId: null,
  messages: [],
  moodBefore: null,
  moodAfter: null,
  summary: null,
  startedAt: null,
  isLoading: false,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalCost: 0,
  modelUsed: null,

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
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      modelUsed: null,
    }),

  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),

  setLoading: (isLoading) => set({ isLoading }),

  setSummary: (summary) => set({ summary, status: "post" }),

  setMoodAfter: (moodAfter) => set({ moodAfter }),

  addUsage: (usage, cost) =>
    set((s) => ({
      totalInputTokens: s.totalInputTokens + usage.inputTokens,
      totalOutputTokens: s.totalOutputTokens + usage.outputTokens,
      totalCost: s.totalCost + cost,
    })),

  setModelUsed: (model) => set({ modelUsed: model }),

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
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      modelUsed: null,
    }),
}));
