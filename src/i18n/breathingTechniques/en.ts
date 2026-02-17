import type { BreathingTechnique } from "@/constants/breathingTechniques";

export const enBreathingTechniques: BreathingTechnique[] = [
  {
    id: "4-7-8",
    name: "4-7-8 Technique",
    description:
      "Ideal for calming and sleep. Breathe in 4s, hold 7s, exhale 8s.",
    phases: [
      { name: "Breathe In", duration: 4, type: "inhale" },
      { name: "Hold", duration: 7, type: "hold" },
      { name: "Breathe Out", duration: 8, type: "exhale" },
    ],
    cycleDuration: 19,
  },
  {
    id: "box",
    name: "Box Breathing",
    description:
      "For stress management and focus. 4 seconds per phase.",
    phases: [
      { name: "Breathe In", duration: 4, type: "inhale" },
      { name: "Hold", duration: 4, type: "hold" },
      { name: "Breathe Out", duration: 4, type: "exhale" },
      { name: "Wait", duration: 4, type: "holdAfterExhale" },
    ],
    cycleDuration: 16,
  },
  {
    id: "4-2-6",
    name: "4-2-6 Relaxation",
    description: "For general relaxation. Short hold, long exhale.",
    phases: [
      { name: "Breathe In", duration: 4, type: "inhale" },
      { name: "Hold", duration: 2, type: "hold" },
      { name: "Breathe Out", duration: 6, type: "exhale" },
    ],
    cycleDuration: 12,
  },
  {
    id: "simple",
    name: "Simple Breathing",
    description: "For beginners. Just breathe in and out.",
    phases: [
      { name: "Breathe In", duration: 4, type: "inhale" },
      { name: "Breathe Out", duration: 4, type: "exhale" },
    ],
    cycleDuration: 8,
  },
];

export const enDurationOptions = [
  { value: "60", label: "1 minute" },
  { value: "120", label: "2 minutes" },
  { value: "180", label: "3 minutes" },
  { value: "300", label: "5 minutes" },
  { value: "600", label: "10 minutes" },
];
