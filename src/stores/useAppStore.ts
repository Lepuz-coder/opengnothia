import { create } from "zustand";
import type { Theme } from "@/types";

interface AppState {
  isOnboarded: boolean;
  theme: Theme;
  sidebarCollapsed: boolean;
  sidebarHidden: boolean;
  setOnboarded: (value: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarHidden: (hidden: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnboarded: false,
  theme: "system",
  sidebarCollapsed: false,
  sidebarHidden: false,
  setOnboarded: (value) => set({ isOnboarded: value }),
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarHidden: (hidden) => set({ sidebarHidden: hidden }),
}));
