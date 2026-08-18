import type { Translations } from "../i18n";

export const MILESTONES = [7, 15, 30, 60, 120, 180, 240, 365] as const;
export type Milestone = (typeof MILESTONES)[number];

export type AnalysesKey = keyof Translations["analyses"];

export interface MilestoneDef {
  sessions: Milestone;
  emoji: string;
  nameKey: AnalysesKey;
  descKey: AnalysesKey;
}

// Milestones count completed *sessions*, not days.
export const MILESTONE_DEFS: MilestoneDef[] = [
  { sessions: 7, emoji: "🌱", nameKey: "milestone7", descKey: "milestone7Desc" },
  { sessions: 15, emoji: "🔍", nameKey: "milestone15", descKey: "milestone15Desc" },
  { sessions: 30, emoji: "🧭", nameKey: "milestone30", descKey: "milestone30Desc" },
  { sessions: 60, emoji: "🦋", nameKey: "milestone60", descKey: "milestone60Desc" },
  { sessions: 120, emoji: "🌳", nameKey: "milestone120", descKey: "milestone120Desc" },
  { sessions: 180, emoji: "🪞", nameKey: "milestone180", descKey: "milestone180Desc" },
  { sessions: 240, emoji: "✨", nameKey: "milestone240", descKey: "milestone240Desc" },
  { sessions: 365, emoji: "🏔️", nameKey: "milestone365", descKey: "milestone365Desc" },
];

export function getNextMilestone(sessionCount: number): MilestoneDef | null {
  return MILESTONE_DEFS.find((m) => sessionCount < m.sessions) ?? null;
}
