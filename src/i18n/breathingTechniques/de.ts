import type { BreathingTechnique } from "@/constants/breathingTechniques";

export const deBreathingTechniques: BreathingTechnique[] = [
  {
    id: "4-7-8",
    name: "4-7-8-Technik",
    description:
      "Ideal zum Beruhigen und Einschlafen. 4s einatmen, 7s halten, 8s ausatmen.",
    phases: [
      { name: "Einatmen", duration: 4, type: "inhale" },
      { name: "Halten", duration: 7, type: "hold" },
      { name: "Ausatmen", duration: 8, type: "exhale" },
    ],
    cycleDuration: 19,
  },
  {
    id: "box",
    name: "Box-Atmung",
    description:
      "Für Stressbewältigung und Konzentration. 4 Sekunden pro Phase.",
    phases: [
      { name: "Einatmen", duration: 4, type: "inhale" },
      { name: "Halten", duration: 4, type: "hold" },
      { name: "Ausatmen", duration: 4, type: "exhale" },
      { name: "Warten", duration: 4, type: "holdAfterExhale" },
    ],
    cycleDuration: 16,
  },
  {
    id: "4-2-6",
    name: "4-2-6 Entspannung",
    description: "Zur allgemeinen Entspannung. Kurzes Halten, langes Ausatmen.",
    phases: [
      { name: "Einatmen", duration: 4, type: "inhale" },
      { name: "Halten", duration: 2, type: "hold" },
      { name: "Ausatmen", duration: 6, type: "exhale" },
    ],
    cycleDuration: 12,
  },
  {
    id: "simple",
    name: "Einfache Atmung",
    description: "Für Anfänger. Einfach ein- und ausatmen.",
    phases: [
      { name: "Einatmen", duration: 4, type: "inhale" },
      { name: "Ausatmen", duration: 4, type: "exhale" },
    ],
    cycleDuration: 8,
  },
];

export const deDurationOptions = [
  { value: "60", label: "1 Minute" },
  { value: "120", label: "2 Minuten" },
  { value: "180", label: "3 Minuten" },
  { value: "300", label: "5 Minuten" },
  { value: "600", label: "10 Minuten" },
];
