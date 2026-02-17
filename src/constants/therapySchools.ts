import type { TherapySchool } from "@/types";
import type { Language } from "@/types";
import {
  getLocalizedTherapySchools,
  getLocalizedTherapySchool,
  getLocalizedTherapySchoolName,
} from "@/i18n/therapySchools";

export interface TherapySchoolDef {
  id: TherapySchool;
  name: string;
  shortName: string;
  description: string;
  promptInstructions: string;
}

export function getTherapySchools(lang?: Language): TherapySchoolDef[] {
  return getLocalizedTherapySchools(lang);
}

export function getTherapySchool(
  id: TherapySchool,
  lang?: Language,
): TherapySchoolDef | undefined {
  return getLocalizedTherapySchool(id, lang);
}

export function getTherapySchoolName(
  id: TherapySchool,
  lang?: Language,
): string {
  return getLocalizedTherapySchoolName(id, lang);
}
