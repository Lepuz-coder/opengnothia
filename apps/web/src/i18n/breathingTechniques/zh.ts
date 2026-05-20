import type { BreathingTechnique } from "@/constants/breathingTechniques";

export const zhBreathingTechniques: BreathingTechnique[] = [
  {
    id: "4-7-8",
    name: "4-7-8 呼吸法",
    description:
      "适合放松和助眠。吸气4秒，屏息7秒，呼气8秒。",
    phases: [
      { name: "吸气", duration: 4, type: "inhale" },
      { name: "屏息", duration: 7, type: "hold" },
      { name: "呼气", duration: 8, type: "exhale" },
    ],
    cycleDuration: 19,
  },
  {
    id: "box",
    name: "箱式呼吸",
    description:
      "适合压力管理和集中注意力。每个阶段4秒。",
    phases: [
      { name: "吸气", duration: 4, type: "inhale" },
      { name: "屏息", duration: 4, type: "hold" },
      { name: "呼气", duration: 4, type: "exhale" },
      { name: "等待", duration: 4, type: "holdAfterExhale" },
    ],
    cycleDuration: 16,
  },
  {
    id: "4-2-6",
    name: "4-2-6 放松法",
    description: "适合日常放松。短暂屏息，延长呼气。",
    phases: [
      { name: "吸气", duration: 4, type: "inhale" },
      { name: "屏息", duration: 2, type: "hold" },
      { name: "呼气", duration: 6, type: "exhale" },
    ],
    cycleDuration: 12,
  },
  {
    id: "simple",
    name: "简单呼吸",
    description: "适合初学者。只需吸气和呼气。",
    phases: [
      { name: "吸气", duration: 4, type: "inhale" },
      { name: "呼气", duration: 4, type: "exhale" },
    ],
    cycleDuration: 8,
  },
];

export const zhDurationOptions = [
  { value: "60", label: "1 分钟" },
  { value: "120", label: "2 分钟" },
  { value: "180", label: "3 分钟" },
  { value: "300", label: "5 分钟" },
  { value: "600", label: "10 分钟" },
];
