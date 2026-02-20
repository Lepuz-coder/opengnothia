import { load } from "@tauri-apps/plugin-store";

const STORE_DEFAULTS = {
  isOnboarded: false,
  hasSeenNoteTutorial: false,
  language: "tr",
  provider: "openai",
  apiKey: "",
  model: "gpt-4o",
  customBaseUrl: "",
  theme: "system",
  therapySchool: "psychodynamic",
  thinkingEnabled: false,
  thinkingLevel: "medium",
  thinkingType: "budget",
  providerApiKeys: {} as Record<string, string>,
  providerThinkingSettings: {} as Record<string, { enabled: boolean; level: string; type?: string }>,
  memoryModel: "gpt-4o-mini",
  memoryThinkingEnabled: false,
  memoryThinkingLevel: "medium",
  memoryThinkingType: "budget",
  providerMemoryThinkingSettings: {} as Record<string, { enabled: boolean; level: string; type?: string }>,
  lockEnabled: false,
  passwordHash: "",
  passwordSalt: "",
  passwordHint: "",
  biometricEnabled: false,
  transcriptApiKey: "",
  ttsModel: "tts-1",
  ttsVoice: "alloy",
  customSchools: [] as any[],
  promptOverrides: {} as Record<string, string>,
};

export function loadSettings() {
  return load("settings.json", {
    defaults: STORE_DEFAULTS,
    autoSave: true,
  });
}
