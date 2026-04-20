import { load } from "@tauri-apps/plugin-store";

const STORE_DEFAULTS = {
  isOnboarded: false,
  hasSeenNoteTutorial: false,
  language: "tr",
  provider: "anthropic",
  apiKey: "",
  model: "claude-opus-4-7",
  customBaseUrl: "",
  theme: "system",
  therapySchool: "psychodynamic",
  thinkingEnabled: false,
  thinkingLevel: "medium",
  thinkingType: "budget",
  providerApiKeys: {} as Record<string, string>,
  providerThinkingSettings: {} as Record<string, { enabled: boolean; level: string; type?: string }>,
  memoryModel: "claude-sonnet-4-6",
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
  preferredSessionMode: "chat",
  customSchools: [] as any[],
  promptOverrides: {} as Record<string, string>,
};

export function loadSettings() {
  return load("settings.json", {
    defaults: STORE_DEFAULTS,
    autoSave: true,
  });
}
