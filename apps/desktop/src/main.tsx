import React from "react";
import ReactDOM from "react-dom/client";
import { setLanguageBindings } from "@opengnothia/shared/i18n";
import { useSettingsStore } from "@/stores/useSettingsStore";
import App from "./App";
import "./styles.css";

setLanguageBindings({
  useLanguage: () => useSettingsStore((s) => s.language),
  getLanguage: () => useSettingsStore.getState().language,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
