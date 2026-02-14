import { load } from "@tauri-apps/plugin-store";

const STORE_DEFAULTS = {
  isOnboarded: false,
  provider: "openai",
  apiKey: "",
  model: "gpt-4o",
  customBaseUrl: "",
  theme: "system",
};

export function loadSettings() {
  return load("settings.json", {
    defaults: STORE_DEFAULTS,
    autoSave: true,
  });
}
