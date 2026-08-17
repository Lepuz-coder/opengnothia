import { create } from "zustand";

interface CheckInState {
  mood: number;
  energy: number;
  sleep: number;
  hadDream: boolean;
  dreamNote: string;
  tags: string[];
  isSubmitted: boolean;

  setMood: (mood: number) => void;
  setEnergy: (energy: number) => void;
  setSleep: (sleep: number) => void;
  setHadDream: (hadDream: boolean) => void;
  setDreamNote: (note: string) => void;
  setTags: (tags: string[]) => void;
  toggleTag: (tag: string) => void;
  submit: () => void;
  reset: () => void;
}

export const useCheckInStore = create<CheckInState>((set) => ({
  mood: 5,
  energy: 5,
  sleep: 3,
  hadDream: false,
  dreamNote: "",
  tags: [],
  isSubmitted: false,

  setMood: (mood) => set({ mood }),
  setEnergy: (energy) => set({ energy }),
  setSleep: (sleep) => set({ sleep }),
  setHadDream: (hadDream) => set({ hadDream }),
  setDreamNote: (dreamNote) => set({ dreamNote }),
  setTags: (tags) => set({ tags }),
  toggleTag: (tag) =>
    set((s) => ({
      tags: s.tags.includes(tag) ? s.tags.filter((t) => t !== tag) : [...s.tags, tag],
    })),
  submit: () => set({ isSubmitted: true }),
  reset: () =>
    set({
      mood: 5,
      energy: 5,
      sleep: 3,
      hadDream: false,
      dreamNote: "",
      tags: [],
      isSubmitted: false,
    }),
}));
