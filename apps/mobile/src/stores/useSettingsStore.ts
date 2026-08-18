import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Language, TherapySchool, Theme } from "@opengnothia/shared/types";

const SUPPORTED_LANGUAGES: Language[] = ["tr", "en", "zh", "es", "pt", "de", "fr", "ja"];

// First launch only: follow the device. An unsupported device language falls
// back to English rather than the desktop app's Turkish default — desktop has
// no locale detection at all, so there is no behaviour to stay aligned with.
function deviceLanguage(): Language {
  for (const locale of Localization.getLocales()) {
    const code = locale.languageCode?.toLowerCase();
    if (code && (SUPPORTED_LANGUAGES as string[]).includes(code)) return code as Language;
  }
  return "en";
}

interface SettingsState {
  language: Language;
  theme: Theme;
  schoolId: TherapySchool | null;
  lockEnabled: boolean;
  onboarded: boolean;
  /** False until AsyncStorage has been read; the root layout waits on it. */
  hasHydrated: boolean;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  setSchoolId: (schoolId: TherapySchool | null) => void;
  setLockEnabled: (lockEnabled: boolean) => void;
  setOnboarded: (onboarded: boolean) => void;
}

// M13: mobile keeps its own stores; only pure logic is shared. AsyncStorage is
// the mobile counterpart of desktop's Tauri store.
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: deviceLanguage(),
      theme: "system",
      schoolId: null,
      lockEnabled: false,
      onboarded: false,
      hasHydrated: false,
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setSchoolId: (schoolId) => set({ schoolId }),
      setLockEnabled: (lockEnabled) => set({ lockEnabled }),
      setOnboarded: (onboarded) => set({ onboarded }),
    }),
    {
      name: "opengnothia-settings",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ language, theme, schoolId, lockEnabled, onboarded }) => ({
        language,
        theme,
        schoolId,
        lockEnabled,
        onboarded,
      }),
      // Runs whether or not stored state was found, so the gate always opens.
      onRehydrateStorage: () => () => useSettingsStore.setState({ hasHydrated: true }),
    }
  )
);
