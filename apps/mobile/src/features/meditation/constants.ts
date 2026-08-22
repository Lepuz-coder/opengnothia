/**
 * Meditation timer options and bell scheduling.
 *
 * These live in the feature rather than in packages/shared because meditation is
 * mobile-only — desktop's Tools page keeps the breathing exercise and nothing
 * else. Same reasoning as the stores ("M13: mobile keeps its own stores; only
 * pure logic is shared").
 *
 * Option labels are not per-language data the way getDurationOptions() is for
 * breathing: a duration is a number plus a unit, so the screens compose them
 * from t.common.minutesShort / t.meditation.secondsShort instead of duplicating
 * seven labels across eight locale files.
 */

/** Session length in seconds, 5 minutes to an hour. */
export const MEDITATION_DURATIONS = [300, 600, 900, 1200, 1800, 2700, 3600] as const;

/** Countdown before the session begins — time to put the phone down and sit. */
export const MEDITATION_PREPS = [0, 10, 30] as const;

/** Gap between interval bells. 0 = only the start and end bells ring. */
export const MEDITATION_INTERVALS = [0, 60, 120, 300, 600, 900] as const;

export const BELL_PACK_IDS = ["bowl", "gong"] as const;
export type BellPackId = (typeof BELL_PACK_IDS)[number];

export type BellRole = "start" | "interval" | "end";

export interface BellCue {
  /** Seconds since the user pressed start — preparation included. */
  at: number;
  role: BellRole;
}

/**
 * The full bell schedule for one session, ascending by time.
 *
 * `at` is measured from the moment start was pressed, so the preparation
 * countdown is simply an offset: the start bell marks the end of preparation,
 * and everything after it shifts by the same amount. The timer can then compare
 * a single elapsed counter against this list.
 */
export function buildBellSchedule(
  totalSeconds: number,
  prepSeconds: number,
  intervalSeconds: number
): BellCue[] {
  const cues: BellCue[] = [{ at: prepSeconds, role: "start" }];
  const endsAt = prepSeconds + totalSeconds;

  if (intervalSeconds > 0) {
    // Strictly inside the session: a bell landing exactly on the end would ring
    // twice over the closing bell.
    for (let at = prepSeconds + intervalSeconds; at < endsAt; at += intervalSeconds) {
      cues.push({ at, role: "interval" });
    }
  }

  cues.push({ at: endsAt, role: "end" });
  return cues;
}
