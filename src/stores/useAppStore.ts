import { create } from "zustand";
import type { Theme } from "@/types";

interface AppState {
  isOnboarded: boolean;
  theme: Theme;
  sidebarCollapsed: boolean;
  setOnboarded: (value: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnboarded: false,
  theme: "system",
  sidebarCollapsed: false,
  setOnboarded: (value) => set({ isOnboarded: value }),
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
