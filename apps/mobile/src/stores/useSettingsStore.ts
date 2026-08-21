import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { create } from "zustand";
import { createJSONStorage, persist, type PersistStorage } from "zustand/middleware";
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
  /** Desktop's hasSeenIntakeFormPrompt: the first-session intake nudge fires once. */
  hasSeenIntakePrompt: boolean;
  /** Last intake form step, so a half-filled form reopens where it was left. */
  intakeLastStep: number;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  setSchoolId: (schoolId: TherapySchool | null) => void;
  setLockEnabled: (lockEnabled: boolean) => Promise<void>;
  setOnboarded: (onboarded: boolean) => void;
  setHasSeenIntakePrompt: (hasSeenIntakePrompt: boolean) => void;
  setIntakeLastStep: (intakeLastStep: number) => void;
}

type PersistedSettingsState = Pick<
  SettingsState,
  | "language"
  | "theme"
  | "schoolId"
  | "lockEnabled"
  | "onboarded"
  | "hasSeenIntakePrompt"
  | "intakeLastStep"
>;

const baseSettingsStorage = createJSONStorage<PersistedSettingsState>(() => AsyncStorage)!;
let latestSettingsWrite: Promise<void> = Promise.resolve();
const settingsStorage: PersistStorage<PersistedSettingsState, Promise<void>> = {
  getItem: (name) => baseSettingsStorage.getItem(name),
  setItem: (name, value) => {
    const write = Promise.resolve(baseSettingsStorage.setItem(name, value)).then(() => undefined);
    latestSettingsWrite = write;
    // Ordinary preference setters remain synchronous. Mark their persistence
    // promise handled; the security-sensitive lock setter separately awaits
    // this same promise and rolls back on failure.
    void write.catch(() => undefined);
    return write;
  },
  removeItem: (name) => Promise.resolve(baseSettingsStorage.removeItem(name)).then(() => undefined),
};

interface SettingsHydrationState {
  hasHydrated: boolean;
  hydrationError: boolean;
}

// Hydration metadata must not live in the persisted store: writing it through
// persist's setState wrapper after a read error would overwrite the unread
// lock preference with default false before a retry could recover it.
export const useSettingsHydrationStore = create<SettingsHydrationState>(() => ({
  hasHydrated: false,
  hydrationError: false,
}));

// M13: mobile keeps its own stores; only pure logic is shared. AsyncStorage is
// the mobile counterpart of desktop's Tauri store.
export const useSettingsStore = create<SettingsState>()(
  persist<SettingsState, [], [], PersistedSettingsState>(
    (set, get) => ({
      language: deviceLanguage(),
      theme: "system",
      schoolId: null,
      lockEnabled: false,
      onboarded: false,
      hasSeenIntakePrompt: false,
      intakeLastStep: 0,
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setSchoolId: (schoolId) => set({ schoolId }),
      setLockEnabled: async (lockEnabled) => {
        const previous = get().lockEnabled;
        try {
          set({ lockEnabled });
          const write = latestSettingsWrite;
          await write;
        } catch (error) {
          // The UI must never claim the lock is durable when AsyncStorage did
          // not accept it. Restore both memory and (best effort) disk state.
          set({ lockEnabled: previous });
          await latestSettingsWrite.catch(() => undefined);
          throw error;
        }
      },
      setOnboarded: (onboarded) => set({ onboarded }),
      setHasSeenIntakePrompt: (hasSeenIntakePrompt) => set({ hasSeenIntakePrompt }),
      setIntakeLastStep: (intakeLastStep) => set({ intakeLastStep }),
    }),
    {
      name: "opengnothia-settings",
      storage: settingsStorage,
      partialize: ({ language, theme, schoolId, lockEnabled, onboarded, hasSeenIntakePrompt, intakeLastStep }) => ({
        language,
        theme,
        schoolId,
        lockEnabled,
        onboarded,
        hasSeenIntakePrompt,
        intakeLastStep,
      }),
      // Missing storage is a normal first launch. A real read/parse failure is
      // different: opening with the default lockEnabled=false would fail open.
      onRehydrateStorage: () => (_state, error) =>
        useSettingsHydrationStore.setState({
          hasHydrated: true,
          hydrationError: error !== undefined,
        }),
    }
  )
);
