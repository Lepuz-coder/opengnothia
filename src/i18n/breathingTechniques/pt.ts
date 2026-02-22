import type { BreathingTechnique } from "@/constants/breathingTechniques";

export const ptBreathingTechniques: BreathingTechnique[] = [
  {
    id: "4-7-8",
    name: "Técnica 4-7-8",
    description:
      "Ideal para relaxar e dormir. Inspire por 4s, segure por 7s, expire por 8s.",
    phases: [
      { name: "Inspirar", duration: 4, type: "inhale" },
      { name: "Segurar", duration: 7, type: "hold" },
      { name: "Expirar", duration: 8, type: "exhale" },
    ],
    cycleDuration: 19,
  },
  {
    id: "box",
    name: "Respiração Quadrada",
    description:
      "Para gerenciar o estresse e manter o foco. 4 segundos por fase.",
    phases: [
      { name: "Inspirar", duration: 4, type: "inhale" },
      { name: "Segurar", duration: 4, type: "hold" },
      { name: "Expirar", duration: 4, type: "exhale" },
      { name: "Esperar", duration: 4, type: "holdAfterExhale" },
    ],
    cycleDuration: 16,
  },
  {
    id: "4-2-6",
    name: "Relaxamento 4-2-6",
    description: "Para relaxamento geral. Retenção curta, expiração longa.",
    phases: [
      { name: "Inspirar", duration: 4, type: "inhale" },
      { name: "Segurar", duration: 2, type: "hold" },
      { name: "Expirar", duration: 6, type: "exhale" },
    ],
    cycleDuration: 12,
  },
  {
    id: "simple",
    name: "Respiração Simples",
    description: "Para iniciantes. Apenas inspire e expire.",
    phases: [
      { name: "Inspirar", duration: 4, type: "inhale" },
      { name: "Expirar", duration: 4, type: "exhale" },
    ],
    cycleDuration: 8,
  },
];

export const ptDurationOptions = [
  { value: "60", label: "1 minuto" },
  { value: "120", label: "2 minutos" },
  { value: "180", label: "3 minutos" },
  { value: "300", label: "5 minutos" },
  { value: "600", label: "10 minutos" },
];
