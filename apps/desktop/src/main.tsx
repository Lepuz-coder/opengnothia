import React from "react";
import ReactDOM from "react-dom/client";
import { setLanguageBindings } from "@opengnothia/shared/i18n";
import { setSchoolResolver } from "@opengnothia/shared/ai/promptBuilder";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { getSchoolById } from "@/stores/useSchoolsStore";
import App from "./App";
import "./styles.css";

setLanguageBindings({
  useLanguage: () => useSettingsStore((s) => s.language),
  getLanguage: () => useSettingsStore.getState().language,
});

// The shared prompt builders default to the built-in school list; desktop's
// lookup also carries custom schools and prompt overrides from the store.
setSchoolResolver((id) => getSchoolById(id));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
