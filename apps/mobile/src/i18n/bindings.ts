import { setLanguageBindings } from "@opengnothia/shared/i18n";
import { useSettingsStore } from "@/stores/useSettingsStore";

// Imported for its side effect by app/_layout.tsx, before any shared module
// calls useTranslation(). Zustand selectors are hooks, so `useLanguage`
// re-renders every consumer the moment the setting changes (Step 11).
setLanguageBindings({
  useLanguage: () => useSettingsStore((s) => s.language),
  getLanguage: () => useSettingsStore.getState().language,
});
