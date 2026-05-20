import type { Language } from "@/types";
import { getCurrentLanguage } from "@/i18n";
import { trBreathingTechniques, trDurationOptions } from "@/i18n/breathingTechniques/tr";
import { enBreathingTechniques, enDurationOptions } from "@/i18n/breathingTechniques/en";
import { zhBreathingTechniques, zhDurationOptions } from "@/i18n/breathingTechniques/zh";
import { esBreathingTechniques, esDurationOptions } from "@/i18n/breathingTechniques/es";
import { ptBreathingTechniques, ptDurationOptions } from "@/i18n/breathingTechniques/pt";
import { deBreathingTechniques, deDurationOptions } from "@/i18n/breathingTechniques/de";
import { frBreathingTechniques, frDurationOptions } from "@/i18n/breathingTechniques/fr";
import { jaBreathingTechniques, jaDurationOptions } from "@/i18n/breathingTechniques/ja";

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
  zh: zhBreathingTechniques,
  es: esBreathingTechniques,
  pt: ptBreathingTechniques,
  de: deBreathingTechniques,
  fr: frBreathingTechniques,
  ja: jaBreathingTechniques,
};

const durationOptionsByLang: Record<Language, { value: string; label: string }[]> = {
  tr: trDurationOptions,
  en: enDurationOptions,
  zh: zhDurationOptions,
  es: esDurationOptions,
  pt: ptDurationOptions,
  de: deDurationOptions,
  fr: frDurationOptions,
  ja: jaDurationOptions,
};

export function getBreathingTechniques(lang?: Language): BreathingTechnique[] {
  return breathingTechniquesByLang[lang ?? getCurrentLanguage()];
}

export function getDurationOptions(lang?: Language): { value: string; label: string }[] {
  return durationOptionsByLang[lang ?? getCurrentLanguage()];
}
