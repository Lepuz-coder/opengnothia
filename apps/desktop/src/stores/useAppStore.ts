import { create } from "zustand";
import type { Theme } from "@opengnothia/shared/types";

interface AppState {
  isOnboarded: boolean;
  hasSeenNoteTutorial: boolean;
  hasSeenIntakeFormPrompt: boolean;
  theme: Theme;
  sidebarCollapsed: boolean;
  sidebarHidden: boolean;
  isNoteTaking: boolean;
  sessionNoteTakingStartedAt: number | null;
  isLocked: boolean;
  lockEnabled: boolean;
  setOnboarded: (value: boolean) => void;
  setHasSeenNoteTutorial: (value: boolean) => void;
  setHasSeenIntakeFormPrompt: (value: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarHidden: (hidden: boolean) => void;
  setNoteTaking: (value: boolean) => void;
  startSessionNoteTaking: () => void;
  finishSessionNoteTaking: () => void;
  setLocked: (value: boolean) => void;
  setLockEnabled: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnboarded: false,
  hasSeenNoteTutorial: false,
  hasSeenIntakeFormPrompt: false,
  theme: "system",
  sidebarCollapsed: false,
  sidebarHidden: false,
  isNoteTaking: false,
  sessionNoteTakingStartedAt: null,
  isLocked: true,
  lockEnabled: false,
  setOnboarded: (value) => set({ isOnboarded: value }),
  setHasSeenNoteTutorial: (value) => set({ hasSeenNoteTutorial: value }),
  setHasSeenIntakeFormPrompt: (value) => set({ hasSeenIntakeFormPrompt: value }),
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarHidden: (hidden) => set({ sidebarHidden: hidden }),
  setNoteTaking: (value) => set({ isNoteTaking: value }),
  startSessionNoteTaking: () => set({ sessionNoteTakingStartedAt: Date.now() }),
  finishSessionNoteTaking: () => set({ sessionNoteTakingStartedAt: null }),
  setLocked: (value) => set({ isLocked: value }),
  setLockEnabled: (value) => set({ lockEnabled: value }),
}));
