import type { BreathingTechnique } from "@/constants/breathingTechniques";

export const trBreathingTechniques: BreathingTechnique[] = [
  {
    id: "4-7-8",
    name: "4-7-8 Tekniği",
    description:
      "Sakinleşme ve uyku için ideal. Nefesi 4 sn al, 7 sn tut, 8 sn ver.",
    phases: [
      { name: "Nefes Al", duration: 4, type: "inhale" },
      { name: "Tut", duration: 7, type: "hold" },
      { name: "Nefes Ver", duration: 8, type: "exhale" },
    ],
    cycleDuration: 19,
  },
  {
    id: "box",
    name: "Kutu Nefesi",
    description:
      "Stres yönetimi ve odaklanma için. Her fazda 4'er saniye.",
    phases: [
      { name: "Nefes Al", duration: 4, type: "inhale" },
      { name: "Tut", duration: 4, type: "hold" },
      { name: "Nefes Ver", duration: 4, type: "exhale" },
      { name: "Bekle", duration: 4, type: "holdAfterExhale" },
    ],
    cycleDuration: 16,
  },
  {
    id: "4-2-6",
    name: "4-2-6 Rahatlama",
    description: "Genel rahatlama için. Kısa tutma, uzun verme.",
    phases: [
      { name: "Nefes Al", duration: 4, type: "inhale" },
      { name: "Tut", duration: 2, type: "hold" },
      { name: "Nefes Ver", duration: 6, type: "exhale" },
    ],
    cycleDuration: 12,
  },
  {
    id: "simple",
    name: "Basit Nefes",
    description: "Yeni başlayanlar için. Sadece al ve ver.",
    phases: [
      { name: "Nefes Al", duration: 4, type: "inhale" },
      { name: "Nefes Ver", duration: 4, type: "exhale" },
    ],
    cycleDuration: 8,
  },
];

export const trDurationOptions = [
  { value: "60", label: "1 dakika" },
  { value: "120", label: "2 dakika" },
  { value: "180", label: "3 dakika" },
  { value: "300", label: "5 dakika" },
  { value: "600", label: "10 dakika" },
];
