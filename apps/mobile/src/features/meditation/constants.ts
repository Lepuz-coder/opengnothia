/**
 * Meditation timer ranges and bell scheduling.
 *
 * These live in the feature rather than in packages/shared because meditation is
 * mobile-only — desktop's Tools page keeps the breathing exercise and nothing
 * else. Same reasoning as the stores ("M13: mobile keeps its own stores; only
 * pure logic is shared").
 *
 * The setup screen drives sliders, not chip rows, so what it needs from here is
 * a range and a step rather than a list of blessed values. Labels are still
 * composed at the call site from t.common.minutesShort / t.meditation.secondsShort
 * instead of duplicating them across eight locale files.
 */

/** Session length, excluding preparation. One minute to an hour, by the minute. */
export const DURATION_MIN = 60;
export const DURATION_MAX = 3600;
export const DURATION_STEP = 60;

/** Countdown before the session begins — time to put the phone down and sit. */
export const PREP_MIN = 0;
export const PREP_MAX = 60;
export const PREP_STEP = 5;

/**
 * Interval bells are points inside the sitting ("ring at 15:00, ring at 18:00"),
 * not a repeating gap. A repeating series cannot express two bells three minutes
 * apart, and stacking several series produces a rhythm nobody can picture.
 */
export const BELL_STEP = 60;
/** Room for the whole hour at five-minute spacing, and a bound on the row list. */
export const MAX_BELLS = 12;

export const BELL_PACK_IDS = ["bowl", "gong"] as const;
export type BellPackId = (typeof BELL_PACK_IDS)[number];

export type BellRole = "start" | "interval" | "end";

export interface BellCue {
  /** Seconds since the user pressed start — preparation included. */
  at: number;
  role: BellRole;
}

/**
 * The last moment an interval bell can ring without colliding with the closing
 * bell. Below one step there is no room for an interval bell at all.
 */
export function lastBellSlot(durationSeconds: number): number {
  return durationSeconds - BELL_STEP;
}

/**
 * Where "add a bell" should drop the next one: halfway between the last bell and
 * the end, so a fresh row lands somewhere plausible and only needs nudging.
 * Returns null when the session has no free minute left to put one in.
 */
export function nextBellSlot(bells: number[], durationSeconds: number): number | null {
  const limit = lastBellSlot(durationSeconds);
  if (limit < BELL_STEP) return null;

  const last = bells.length > 0 ? Math.max(...bells) : 0;
  const midpoint = Math.round((last + durationSeconds) / 2 / BELL_STEP) * BELL_STEP;
  const start = Math.min(limit, Math.max(BELL_STEP, midpoint));

  for (let at = start; at <= limit; at += BELL_STEP) if (!bells.includes(at)) return at;
  for (let at = limit; at >= BELL_STEP; at -= BELL_STEP) if (!bells.includes(at)) return at;
  return null;
}

/**
 * The list put back in order: ascending, inside the session, one bell per minute.
 *
 * Both editing gestures end here, and only on release rather than on every step
 * of a drag — a length drag that passes through five minutes on its way to fifty
 * would otherwise flatten every bell in passing. A bell that no longer fits, or
 * that was dragged onto a minute already taken, walks down to the nearest free
 * one instead of collapsing onto its neighbour, so a row moves rather than
 * silently disappearing.
 */
export function normalizeBells(bells: number[], durationSeconds: number): number[] {
  const limit = lastBellSlot(durationSeconds);
  if (limit < BELL_STEP) return [];

  const kept: number[] = [];
  for (const bell of [...bells].sort((a, b) => b - a)) {
    let slot = Math.min(bell, limit);
    while (slot >= BELL_STEP && kept.includes(slot)) slot -= BELL_STEP;
    if (slot >= BELL_STEP) kept.push(slot);
  }
  return kept.sort((a, b) => a - b);
}

/**
 * The full bell schedule for one session, ascending by time.
 *
 * `at` is measured from the moment start was pressed, so the preparation
 * countdown is simply an offset: the start bell marks the end of preparation,
 * and everything after it shifts by the same amount. The timer can then compare
 * a single elapsed counter against this list.
 *
 * `bellsAt` are offsets into the sitting itself — "the fifteenth minute" means
 * fifteen minutes of sitting, not fifteen minutes after the phone was put down.
 */
export function buildBellSchedule(
  totalSeconds: number,
  prepSeconds: number,
  bellsAt: readonly number[]
): BellCue[] {
  const endsAt = prepSeconds + totalSeconds;
  const cues: BellCue[] = [{ at: prepSeconds, role: "start" }];

  // Strictly inside the session, and each second at most once: a bell landing on
  // the end would ring twice over the closing bell, and two bells sharing a
  // second would fire the same sample on top of itself.
  const seen = new Set<number>();
  for (const offset of bellsAt) {
    const at = prepSeconds + offset;
    if (offset <= 0 || at >= endsAt || seen.has(at)) continue;
    seen.add(at);
    cues.push({ at, role: "interval" });
  }

  cues.sort((a, b) => a.at - b.at);
  cues.push({ at: endsAt, role: "end" });
  return cues;
}
