import { create } from "zustand";
import type { ChatMessage } from "@/types";

interface CourseState {
  activeCourseId: string | null;
  activeStepIndex: number | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  isLoading: boolean;
  streamingMessageId: string | null;
  abortController: AbortController | null;
  isCompacting: boolean;
  compactedContext: string | null;
  compactedAtIndex: number;
  currentInputTokens: number;
  lessonCompleted: boolean;

  startLesson: (courseId: string, stepIndex: number, existingMessages?: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  startStreaming: () => string;
  appendStreamContent: (chunk: string) => void;
  appendStreamThinking: (chunk: string) => void;
  finishStreaming: () => void;
  cancelStreaming: () => void;
  setAbortController: (controller: AbortController | null) => void;
  removeMessage: (id: string) => void;
  setLessonCompleted: (completed: boolean) => void;
  setCurrentInputTokens: (tokens: number) => void;
  startCompaction: () => void;
  finishCompaction: () => void;
  applyCompaction: (context: string) => void;
  reset: () => void;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  activeCourseId: null,
  activeStepIndex: null,
  messages: [],
  isStreaming: false,
  isLoading: false,
  streamingMessageId: null,
  abortController: null,
  isCompacting: false,
  compactedContext: null,
  compactedAtIndex: 0,
  currentInputTokens: 0,
  lessonCompleted: false,

  startLesson: (courseId, stepIndex, existingMessages) =>
    set({
      activeCourseId: courseId,
      activeStepIndex: stepIndex,
      messages: existingMessages ?? [],
      isStreaming: false,
      isLoading: false,
      streamingMessageId: null,
      abortController: null,
      isCompacting: false,
      compactedContext: null,
      compactedAtIndex: 0,
      currentInputTokens: 0,
      lessonCompleted: false,
    }),

  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),

  setLoading: (isLoading) => set({ isLoading }),

  startStreaming: () => {
    const id = crypto.randomUUID();
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
        m.id === streamingMessageId ? { ...m, content: m.content + chunk, isThinkingActive: false } : m
      ),
    }));
  },

  appendStreamThinking: (chunk) => {
    const { streamingMessageId } = get();
    if (!streamingMessageId) return;
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === streamingMessageId ? { ...m, thinking: (m.thinking ?? "") + chunk, isThinkingActive: true } : m
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
    const { abortController, streamingMessageId } = get();
    if (abortController) abortController.abort();
    if (streamingMessageId) {
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === streamingMessageId ? { ...m, isStreaming: false, content: m.content || "" } : m
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

  removeMessage: (id) =>
    set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),

  setLessonCompleted: (lessonCompleted) => set({ lessonCompleted }),

  setCurrentInputTokens: (tokens) => set({ currentInputTokens: tokens }),

  startCompaction: () => set({ isCompacting: true }),
  finishCompaction: () => set({ isCompacting: false }),
  applyCompaction: (context) =>
    set((s) => ({ compactedContext: context, compactedAtIndex: s.messages.length, currentInputTokens: 0 })),

  reset: () =>
    set({
      activeCourseId: null,
      activeStepIndex: null,
      messages: [],
      isStreaming: false,
      isLoading: false,
      streamingMessageId: null,
      abortController: null,
      isCompacting: false,
      compactedContext: null,
      compactedAtIndex: 0,
      currentInputTokens: 0,
      lessonCompleted: false,
    }),
}));
