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
  providerApiKeys: Record<string, string>;
  providerThinkingSettings: Record<string, { enabled: boolean; level: ThinkingLevel }>;
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

export const useSettingsStore = create<SettingsState>((set, get) => ({
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
  providerApiKeys: {},
  providerThinkingSettings: {},
  setProvider: (provider) => {
    const state = get();
    const updatedKeys = { ...state.providerApiKeys, [state.provider]: state.apiKey };
    const newApiKey = updatedKeys[provider] ?? "";

    // Save current provider's thinking settings
    const updatedThinking = {
      ...state.providerThinkingSettings,
      [state.provider]: { enabled: state.thinkingEnabled, level: state.thinkingLevel },
    };

    // Restore new provider's thinking settings (or defaults)
    const restored = updatedThinking[provider] ?? { enabled: false, level: "medium" as ThinkingLevel };
    let restoredLevel = restored.level;
    // OpenAI doesn't support "max" thinking level
    if (provider === "openai" && restoredLevel === "max") {
      restoredLevel = "high";
    }

    set({
      provider,
      apiKey: newApiKey,
      providerApiKeys: updatedKeys,
      thinkingEnabled: restored.enabled,
      thinkingLevel: restoredLevel,
      providerThinkingSettings: updatedThinking,
    });
  },
  setApiKey: (apiKey) => {
    const state = get();
    set({
      apiKey,
      providerApiKeys: { ...state.providerApiKeys, [state.provider]: apiKey },
    });
  },
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
