import type { Language } from "@/types";
import { getCurrentLanguage } from "@/i18n";
import { trBreathingTechniques, trDurationOptions } from "@/i18n/breathingTechniques/tr";
import { enBreathingTechniques, enDurationOptions } from "@/i18n/breathingTechniques/en";

export interface BreathingPhase {
  name: string;
  duration: number;
  type: "inhale" | "hold" | "exhale" | "holdAfterExhale";
}

export interface BreathingTechnique {
  id: string;
  name: string;
  description: string;
  phases: BreathingPhase[];
  cycleDuration: number;
}

const breathingTechniquesByLang: Record<Language, BreathingTechnique[]> = {
  tr: trBreathingTechniques,
  en: enBreathingTechniques,
};

const durationOptionsByLang: Record<Language, { value: string; label: string }[]> = {
  tr: trDurationOptions,
  en: enDurationOptions,
};

export function getBreathingTechniques(lang?: Language): BreathingTechnique[] {
  return breathingTechniquesByLang[lang ?? getCurrentLanguage()];
}

export function getDurationOptions(lang?: Language): { value: string; label: string }[] {
  return durationOptionsByLang[lang ?? getCurrentLanguage()];
}
