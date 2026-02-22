import type { BreathingTechnique } from "@/constants/breathingTechniques";

export const esBreathingTechniques: BreathingTechnique[] = [
  {
    id: "4-7-8",
    name: "Técnica 4-7-8",
    description:
      "Ideal para relajarse y dormir. Inhala 4s, mantén 7s, exhala 8s.",
    phases: [
      { name: "Inhalar", duration: 4, type: "inhale" },
      { name: "Mantener", duration: 7, type: "hold" },
      { name: "Exhalar", duration: 8, type: "exhale" },
    ],
    cycleDuration: 19,
  },
  {
    id: "box",
    name: "Respiración Cuadrada",
    description:
      "Para manejar el estrés y concentrarse. 4 segundos por fase.",
    phases: [
      { name: "Inhalar", duration: 4, type: "inhale" },
      { name: "Mantener", duration: 4, type: "hold" },
      { name: "Exhalar", duration: 4, type: "exhale" },
      { name: "Esperar", duration: 4, type: "holdAfterExhale" },
    ],
    cycleDuration: 16,
  },
  {
    id: "4-2-6",
    name: "Relajación 4-2-6",
    description: "Para relajación general. Retención corta, exhalación larga.",
    phases: [
      { name: "Inhalar", duration: 4, type: "inhale" },
      { name: "Mantener", duration: 2, type: "hold" },
      { name: "Exhalar", duration: 6, type: "exhale" },
    ],
    cycleDuration: 12,
  },
  {
    id: "simple",
    name: "Respiración Simple",
    description: "Para principiantes. Solo inhala y exhala.",
    phases: [
      { name: "Inhalar", duration: 4, type: "inhale" },
      { name: "Exhalar", duration: 4, type: "exhale" },
    ],
    cycleDuration: 8,
  },
];

export const esDurationOptions = [
  { value: "60", label: "1 minuto" },
  { value: "120", label: "2 minutos" },
  { value: "180", label: "3 minutos" },
  { value: "300", label: "5 minutos" },
  { value: "600", label: "10 minutos" },
];
