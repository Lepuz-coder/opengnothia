import type { Language } from "@opengnothia/shared/types";

// Endonyms: a language picker is the one place where labels must not be
// translated — a user looking for their language reads its own name.
export const LANGUAGE_OPTIONS: { id: Language; label: string }[] = [
  { id: "tr", label: "Türkçe" },
  { id: "en", label: "English" },
  { id: "de", label: "Deutsch" },
  { id: "fr", label: "Français" },
  { id: "es", label: "Español" },
  { id: "pt", label: "Português" },
  { id: "zh", label: "中文" },
  { id: "ja", label: "日本語" },
];
