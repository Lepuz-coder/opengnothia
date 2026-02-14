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

  setStatus: (status: SessionStatus) => void;
  startSession: (moodBefore: number) => void;
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setSummary: (summary: SessionSummary) => void;
  setMoodAfter: (mood: number) => void;
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
    }),
}));
