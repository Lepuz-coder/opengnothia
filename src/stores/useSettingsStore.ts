import { create } from "zustand";
import type { AIProvider, Approach, ThinkingLevel } from "@/types";

interface SettingsState {
  provider: AIProvider;
  apiKey: string;
  model: string;
  customBaseUrl: string;
  approach: Approach;
  preferredSessionTime: string;
  sessionDurationMinutes: number;
  thinkingEnabled: boolean;
  thinkingLevel: ThinkingLevel;
  setProvider: (provider: AIProvider) => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setCustomBaseUrl: (url: string) => void;
  setApproach: (approach: Approach) => void;
  setPreferredSessionTime: (time: string) => void;
  setSessionDurationMinutes: (minutes: number) => void;
  setThinkingEnabled: (enabled: boolean) => void;
  setThinkingLevel: (level: ThinkingLevel) => void;
  loadFromStore: (data: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  provider: "openai",
  apiKey: "",
  model: "gpt-4o",
  customBaseUrl: "",
  approach: "balanced",
  preferredSessionTime: "20:00",
  sessionDurationMinutes: 50,
  thinkingEnabled: false,
  thinkingLevel: "medium",
  setProvider: (provider) => set({ provider }),
  setApiKey: (apiKey) => set({ apiKey }),
  setModel: (model) => set({ model }),
  setCustomBaseUrl: (customBaseUrl) => set({ customBaseUrl }),
  setApproach: (approach) => set({ approach }),
  setPreferredSessionTime: (preferredSessionTime) => set({ preferredSessionTime }),
  setSessionDurationMinutes: (sessionDurationMinutes) => set({ sessionDurationMinutes }),
  setThinkingEnabled: (thinkingEnabled) => set({ thinkingEnabled }),
  setThinkingLevel: (thinkingLevel) => set({ thinkingLevel }),
  loadFromStore: (data) => set(data),
}));
