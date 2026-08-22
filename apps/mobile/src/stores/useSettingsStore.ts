import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { create } from "zustand";
import { createJSONStorage, persist, type PersistStorage } from "zustand/middleware";
import type { Language, TherapySchool, Theme } from "@opengnothia/shared/types";
import { BELL_STEP, MAX_BELLS, normalizeBells, type BellPackId } from "@/features/meditation/constants";

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
  // Meditation timer setup, remembered between sessions — unlike the breathing
  // tab, whose technique/duration reset on every visit. A meditation practice is
  // a habit: re-picking 20 minutes and the same bells every morning is friction.
  // Flat fields rather than one nested object, matching the rest of this store —
  // a nested value would need a merge on rehydrate (persist merges shallowly, so
  // a later-added key would read back undefined) and a memoised selector to keep
  // zustand v5's snapshot stable.
  /** Session length in seconds, excluding the preparation countdown. */
  meditationDuration: number;
  /** Countdown before the session starts, in seconds. 0 = start immediately. */
  meditationPrep: number;
  /**
   * Moments inside the sitting when an interval bell rings, in seconds from the
   * first bell, ascending. Empty = only the start and end bells.
   */
  meditationBells: number[];
  meditationBell: BellPackId;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  setSchoolId: (schoolId: TherapySchool | null) => void;
  setLockEnabled: (lockEnabled: boolean) => Promise<void>;
  setOnboarded: (onboarded: boolean) => void;
  setHasSeenIntakePrompt: (hasSeenIntakePrompt: boolean) => void;
  setIntakeLastStep: (intakeLastStep: number) => void;
  setMeditationDuration: (meditationDuration: number) => void;
  setMeditationPrep: (meditationPrep: number) => void;
  setMeditationBells: (meditationBells: number[]) => void;
  setMeditationBell: (meditationBell: BellPackId) => void;
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
  | "meditationDuration"
  | "meditationPrep"
  | "meditationBells"
  | "meditationBell"
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
      meditationDuration: 600,
      meditationPrep: 10,
      meditationBells: [],
      meditationBell: "bowl",
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
      setMeditationDuration: (meditationDuration) => set({ meditationDuration }),
      setMeditationPrep: (meditationPrep) => set({ meditationPrep }),
      setMeditationBells: (meditationBells) => set({ meditationBells }),
      setMeditationBell: (meditationBell) => set({ meditationBell }),
    }),
    {
      name: "opengnothia-settings",
      storage: settingsStorage,
      // v1 turned the single repeating gap (`meditationInterval`) into a list of
      // moments. Expanding the old gap keeps a practice that was already set up
      // ringing at the same times instead of quietly falling silent.
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as PersistedSettingsState & { meditationInterval?: number };
        if (version >= 1) return state;

        const gap = state.meditationInterval ?? 0;
        const bells: number[] = [];
        if (gap >= BELL_STEP) {
          // A one-minute gap over an hour is fifty-nine rows, well past what the
          // list is bounded to; keep the earliest, which is the stretch of the
          // sitting the old setting was really about.
          for (let at = gap; at < state.meditationDuration && bells.length < MAX_BELLS; at += gap) bells.push(at);
        }
        return { ...state, meditationBells: normalizeBells(bells, state.meditationDuration) };
      },
      partialize: ({
        language,
        theme,
        schoolId,
        lockEnabled,
        onboarded,
        hasSeenIntakePrompt,
        intakeLastStep,
        meditationDuration,
        meditationPrep,
        meditationBells,
        meditationBell,
      }) => ({
        language,
        theme,
        schoolId,
        lockEnabled,
        onboarded,
        hasSeenIntakePrompt,
        intakeLastStep,
        meditationDuration,
        meditationPrep,
        meditationBells,
        meditationBell,
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
