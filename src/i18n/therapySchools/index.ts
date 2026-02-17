import type { Language } from "@/types";
import type { TherapySchoolDef } from "@/constants/therapySchools";
import type { TherapySchool } from "@/types";
import { getCurrentLanguage } from "@/i18n";
import { trTherapySchools } from "./tr";
import { enTherapySchools } from "./en";

const therapySchoolsByLang: Record<Language, TherapySchoolDef[]> = {
  tr: trTherapySchools,
  en: enTherapySchools,
};

export function getLocalizedTherapySchools(
  lang?: Language,
): TherapySchoolDef[] {
  return therapySchoolsByLang[lang ?? getCurrentLanguage()];
}

export function getLocalizedTherapySchool(
  id: TherapySchool,
  lang?: Language,
): TherapySchoolDef | undefined {
  return getLocalizedTherapySchools(lang).find((s) => s.id === id);
}

export function getLocalizedTherapySchoolName(
  id: TherapySchool,
  lang?: Language,
): string {
  return getLocalizedTherapySchool(id, lang)?.shortName ?? id;
}
