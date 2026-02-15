import { create } from "zustand";
import type { Theme } from "@/types";

interface AppState {
  isOnboarded: boolean;
  hasSeenNoteTutorial: boolean;
  theme: Theme;
  sidebarCollapsed: boolean;
  sidebarHidden: boolean;
  isNoteTaking: boolean;
  setOnboarded: (value: boolean) => void;
  setHasSeenNoteTutorial: (value: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarHidden: (hidden: boolean) => void;
  setNoteTaking: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnboarded: false,
  hasSeenNoteTutorial: false,
  theme: "system",
  sidebarCollapsed: false,
  sidebarHidden: false,
  isNoteTaking: false,
  setOnboarded: (value) => set({ isOnboarded: value }),
  setHasSeenNoteTutorial: (value) => set({ hasSeenNoteTutorial: value }),
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarHidden: (hidden) => set({ sidebarHidden: hidden }),
  setNoteTaking: (value) => set({ isNoteTaking: value }),
}));
