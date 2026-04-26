import { create } from "zustand";
import type { TherapySchoolDef } from "@/constants/therapySchools";
import { getLocalizedTherapySchools } from "@/i18n/therapySchools";
import type { Language } from "@/types";

interface SchoolsState {
  customSchools: TherapySchoolDef[];
  promptOverrides: Record<string, string>;
  addSchool: (school: TherapySchoolDef) => void;
  updateSchool: (id: string, updates: Partial<Omit<TherapySchoolDef, "id">>) => void;
  deleteSchool: (id: string) => void;
  setPromptOverride: (id: string, prompt: string) => void;
  removePromptOverride: (id: string) => void;
  loadFromStore: (data: { customSchools?: TherapySchoolDef[]; promptOverrides?: Record<string, string> }) => void;
}

export const useSchoolsStore = create<SchoolsState>((set) => ({
  customSchools: [],
  promptOverrides: {},
  addSchool: (school) =>
    set((state) => ({ customSchools: [...state.customSchools, school] })),
  updateSchool: (id, updates) =>
    set((state) => ({
      customSchools: state.customSchools.map((s) =>
        s.id === id ? { ...s, ...updates } : s,
      ),
    })),
  deleteSchool: (id) =>
    set((state) => ({
      customSchools: state.customSchools.filter((s) => s.id !== id),
    })),
  setPromptOverride: (id, prompt) =>
    set((state) => ({
      promptOverrides: { ...state.promptOverrides, [id]: prompt },
    })),
  removePromptOverride: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.promptOverrides;
      return { promptOverrides: rest };
    }),
  loadFromStore: (data) => set(data),
}));

export const RECOMMENDED_SCHOOL_ID = "integrative";

const BUILTIN_IDS = new Set([
  "integrative",
  "psychodynamic",
  "cbt",
  "logotherapy",
  "act",
  "schema",
  "stoic",
  "spiritual",
]);

export function isBuiltInSchool(id: string): boolean {
  return BUILTIN_IDS.has(id);
}

export function getAllSchools(lang?: Language): TherapySchoolDef[] {
  const { customSchools, promptOverrides } = useSchoolsStore.getState();
  const builtIn = getLocalizedTherapySchools(lang).map((s) => {
    if (promptOverrides[s.id]) {
      return { ...s, promptInstructions: promptOverrides[s.id] };
    }
    return s;
  });
  const sorted = [...builtIn].sort((a, b) => {
    if (a.id === RECOMMENDED_SCHOOL_ID) return -1;
    if (b.id === RECOMMENDED_SCHOOL_ID) return 1;
    return 0;
  });
  return [...sorted, ...customSchools];
}

export function getSchoolById(id: string, lang?: Language): TherapySchoolDef | undefined {
  return getAllSchools(lang).find((s) => s.id === id);
}
