import { load } from "@tauri-apps/plugin-store";

const STORE_DEFAULTS = {
  isOnboarded: false,
  hasSeenNoteTutorial: false,
  provider: "openai",
  apiKey: "",
  model: "gpt-4o",
  customBaseUrl: "",
  theme: "system",
  therapySchool: "cbt",
  thinkingEnabled: false,
  thinkingLevel: "medium",
  providerApiKeys: {} as Record<string, string>,
};

export function loadSettings() {
  return load("settings.json", {
    defaults: STORE_DEFAULTS,
    autoSave: true,
  });
}
