import { load } from "@tauri-apps/plugin-store";

const STORE_DEFAULTS = {
  isOnboarded: false,
  hasSeenNoteTutorial: false,
  provider: "openai",
  apiKey: "",
  model: "gpt-4o",
  customBaseUrl: "",
  theme: "system",
  therapySchool: "psychodynamic",
  thinkingEnabled: false,
  thinkingLevel: "medium",
  providerApiKeys: {} as Record<string, string>,
  providerThinkingSettings: {} as Record<string, { enabled: boolean; level: string }>,
  memoryModel: "gpt-4o-mini",
  memoryThinkingEnabled: false,
  memoryThinkingLevel: "medium",
  providerMemoryThinkingSettings: {} as Record<string, { enabled: boolean; level: string }>,
};

export function loadSettings() {
  return load("settings.json", {
    defaults: STORE_DEFAULTS,
    autoSave: true,
  });
}
