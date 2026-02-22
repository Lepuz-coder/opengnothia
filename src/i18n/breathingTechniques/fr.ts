import type { BreathingTechnique } from "@/constants/breathingTechniques";

export const frBreathingTechniques: BreathingTechnique[] = [
  {
    id: "4-7-8",
    name: "Technique 4-7-8",
    description:
      "Idéale pour se calmer et s'endormir. Inspirez 4s, retenez 7s, expirez 8s.",
    phases: [
      { name: "Inspirer", duration: 4, type: "inhale" },
      { name: "Retenir", duration: 7, type: "hold" },
      { name: "Expirer", duration: 8, type: "exhale" },
    ],
    cycleDuration: 19,
  },
  {
    id: "box",
    name: "Respiration Carrée",
    description:
      "Pour la gestion du stress et la concentration. 4 secondes par phase.",
    phases: [
      { name: "Inspirer", duration: 4, type: "inhale" },
      { name: "Retenir", duration: 4, type: "hold" },
      { name: "Expirer", duration: 4, type: "exhale" },
      { name: "Attendre", duration: 4, type: "holdAfterExhale" },
    ],
    cycleDuration: 16,
  },
  {
    id: "4-2-6",
    name: "Relaxation 4-2-6",
    description: "Pour la relaxation générale. Rétention courte, expiration longue.",
    phases: [
      { name: "Inspirer", duration: 4, type: "inhale" },
      { name: "Retenir", duration: 2, type: "hold" },
      { name: "Expirer", duration: 6, type: "exhale" },
    ],
    cycleDuration: 12,
  },
  {
    id: "simple",
    name: "Respiration Simple",
    description: "Pour les débutants. Inspirez et expirez simplement.",
    phases: [
      { name: "Inspirer", duration: 4, type: "inhale" },
      { name: "Expirer", duration: 4, type: "exhale" },
    ],
    cycleDuration: 8,
  },
];

export const frDurationOptions = [
  { value: "60", label: "1 minute" },
  { value: "120", label: "2 minutes" },
  { value: "180", label: "3 minutes" },
  { value: "300", label: "5 minutes" },
  { value: "600", label: "10 minutes" },
];
