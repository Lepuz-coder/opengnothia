import { load } from "@tauri-apps/plugin-store";
import { DEFAULT_MEMORY_MODEL_ID, DEFAULT_MODEL_ID, DEFAULT_PROVIDER_ID } from "@/constants/providers";

const STORE_DEFAULTS = {
  isOnboarded: false,
  hasSeenNoteTutorial: false,
  hasSeenIntakeFormPrompt: false,
  intakeFormLastStep: 0,
  language: "tr",
  provider: DEFAULT_PROVIDER_ID,
  apiKey: "",
  model: DEFAULT_MODEL_ID,
  customBaseUrl: "",
  theme: "system",
  therapySchool: "integrative",
  thinkingEnabled: false,
  thinkingLevel: "medium",
  thinkingType: "budget",
  providerApiKeys: {} as Record<string, string>,
  providerThinkingSettings: {} as Record<string, { enabled: boolean; level: string; type?: string }>,
  memoryModel: DEFAULT_MEMORY_MODEL_ID,
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
