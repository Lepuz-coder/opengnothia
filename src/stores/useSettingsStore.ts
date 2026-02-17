import { create } from "zustand";
import { getProvider } from "@/constants/providers";
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
  memoryModel: string;
  memoryThinkingEnabled: boolean;
  memoryThinkingLevel: ThinkingLevel;
  providerMemoryThinkingSettings: Record<string, { enabled: boolean; level: ThinkingLevel }>;
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
  setMemoryModel: (model: string) => void;
  setMemoryThinkingEnabled: (enabled: boolean) => void;
  setMemoryThinkingLevel: (level: ThinkingLevel) => void;
  loadFromStore: (data: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  provider: "anthropic",
  apiKey: "",
  model: "claude-opus-4-6",
  customBaseUrl: "",
  approach: "balanced",
  preferredSessionTime: "20:00",
  sessionDurationMinutes: 50,
  therapySchool: "psychodynamic",
  thinkingEnabled: true,
  thinkingLevel: "medium",
  providerApiKeys: {},
  providerThinkingSettings: {},
  memoryModel: "claude-sonnet-4-5-20250929",
  memoryThinkingEnabled: true,
  memoryThinkingLevel: "medium",
  providerMemoryThinkingSettings: {},
  setProvider: (provider) => {
    const state = get();
    const updatedKeys = { ...state.providerApiKeys, [state.provider]: state.apiKey };
    const newApiKey = updatedKeys[provider] ?? "";

    // Save current provider's chat thinking settings
    const updatedThinking = {
      ...state.providerThinkingSettings,
      [state.provider]: { enabled: state.thinkingEnabled, level: state.thinkingLevel },
    };

    // Save current provider's memory thinking settings
    const updatedMemoryThinking = {
      ...state.providerMemoryThinkingSettings,
      [state.provider]: { enabled: state.memoryThinkingEnabled, level: state.memoryThinkingLevel },
    };

    // Restore new provider's chat thinking settings (or defaults)
    const restored = updatedThinking[provider] ?? { enabled: false, level: "medium" as ThinkingLevel };
    let restoredLevel = restored.level;
    if (provider === "openai" && restoredLevel === "max") {
      restoredLevel = "high";
    }

    // Restore new provider's memory thinking settings (or defaults)
    const restoredMemory = updatedMemoryThinking[provider] ?? { enabled: false, level: "medium" as ThinkingLevel };
    let restoredMemoryLevel = restoredMemory.level;
    if (provider === "openai" && restoredMemoryLevel === "max") {
      restoredMemoryLevel = "high";
    }

    // Reset models to new provider's first model
    const newProvider = getProvider(provider);
    const newModel = newProvider?.models[0]?.id ?? state.model;
    const newMemoryModel = newProvider?.models[0]?.id ?? state.memoryModel;

    set({
      provider,
      apiKey: newApiKey,
      model: newModel,
      memoryModel: newMemoryModel,
      providerApiKeys: updatedKeys,
      thinkingEnabled: restored.enabled,
      thinkingLevel: restoredLevel,
      providerThinkingSettings: updatedThinking,
      memoryThinkingEnabled: restoredMemory.enabled,
      memoryThinkingLevel: restoredMemoryLevel,
      providerMemoryThinkingSettings: updatedMemoryThinking,
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
  setMemoryModel: (memoryModel) => set({ memoryModel }),
  setMemoryThinkingEnabled: (memoryThinkingEnabled) => set({ memoryThinkingEnabled }),
  setMemoryThinkingLevel: (memoryThinkingLevel) => set({ memoryThinkingLevel }),
  loadFromStore: (data) => set(data),
}));
