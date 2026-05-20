import type { BreathingTechnique } from "@/constants/breathingTechniques";

export const jaBreathingTechniques: BreathingTechnique[] = [
  {
    id: "4-7-8",
    name: "4-7-8 呼吸法",
    description:
      "リラックスと睡眠に最適。4秒吸って、7秒止めて、8秒吐く。",
    phases: [
      { name: "吸う", duration: 4, type: "inhale" },
      { name: "止める", duration: 7, type: "hold" },
      { name: "吐く", duration: 8, type: "exhale" },
    ],
    cycleDuration: 19,
  },
  {
    id: "box",
    name: "ボックス呼吸",
    description:
      "ストレス管理と集中力向上に。各フェーズ4秒。",
    phases: [
      { name: "吸う", duration: 4, type: "inhale" },
      { name: "止める", duration: 4, type: "hold" },
      { name: "吐く", duration: 4, type: "exhale" },
      { name: "待つ", duration: 4, type: "holdAfterExhale" },
    ],
    cycleDuration: 16,
  },
  {
    id: "4-2-6",
    name: "4-2-6 リラクゼーション",
    description: "全般的なリラックスに。短い保持、長い呼気。",
    phases: [
      { name: "吸う", duration: 4, type: "inhale" },
      { name: "止める", duration: 2, type: "hold" },
      { name: "吐く", duration: 6, type: "exhale" },
    ],
    cycleDuration: 12,
  },
  {
    id: "simple",
    name: "シンプル呼吸",
    description: "初心者向け。吸って吐くだけ。",
    phases: [
      { name: "吸う", duration: 4, type: "inhale" },
      { name: "吐く", duration: 4, type: "exhale" },
    ],
    cycleDuration: 8,
  },
];

export const jaDurationOptions = [
  { value: "60", label: "1 分" },
  { value: "120", label: "2 分" },
  { value: "180", label: "3 分" },
  { value: "300", label: "5 分" },
  { value: "600", label: "10 分" },
];
