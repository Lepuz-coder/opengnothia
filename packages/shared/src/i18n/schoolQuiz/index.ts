import type { Language } from "../../types";
import type { SchoolQuizSchool } from "../../constants/schoolQuiz";
import { getCurrentLanguage } from "../../i18n";
import { trSchoolQuiz } from "./tr";
import { enSchoolQuiz } from "./en";
import { zhSchoolQuiz } from "./zh";
import { esSchoolQuiz } from "./es";
import { ptSchoolQuiz } from "./pt";
import { deSchoolQuiz } from "./de";
import { frSchoolQuiz } from "./fr";
import { jaSchoolQuiz } from "./ja";

/**
 * Every user-visible string of the school quiz (M2). Question/option keys must
 * mirror constants/schoolQuiz.ts — the Faz 7 quiz check script asserts the two
 * stay in sync across all eight languages.
 */
export interface SchoolQuizTexts {
  title: string;
  intro: string;
  /** "{current}" and "{total}" placeholders. */
  progress: string;
  resultTitle: string;
  resultWhyTitle: string;
  retakeButton: string;
  takeButton: string;
  noSchoolLabel: string;
  questions: Record<string, { text: string; options: Record<string, string> }>;
  reasons: Record<SchoolQuizSchool, string>;
}

const schoolQuizByLang: Record<Language, SchoolQuizTexts> = {
  tr: trSchoolQuiz,
  en: enSchoolQuiz,
  zh: zhSchoolQuiz,
  es: esSchoolQuiz,
  pt: ptSchoolQuiz,
  de: deSchoolQuiz,
  fr: frSchoolQuiz,
  ja: jaSchoolQuiz,
};

export function getLocalizedSchoolQuiz(lang?: Language): SchoolQuizTexts {
  return schoolQuizByLang[lang ?? getCurrentLanguage()];
}
