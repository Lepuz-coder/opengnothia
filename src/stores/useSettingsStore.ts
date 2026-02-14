import { create } from "zustand";
import type { AIProvider, Approach, TherapySchool, ThinkingLevel } from "@/types";

interface SettingsState {
  provider: AIProvider;
  apiKey: string;
  model: string;
  customBaseUrl: string;
  approach: Approach;
  preferredSessionTime: string;
  sessionDurationMinutes: number;
  therapySchool: TherapySchool;
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
  setTherapySchool: (school: TherapySchool) => void;
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
  therapySchool: "general",
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
  setTherapySchool: (therapySchool) => set({ therapySchool }),
  setThinkingLevel: (thinkingLevel) => set({ thinkingLevel }),
  loadFromStore: (data) => set(data),
}));
