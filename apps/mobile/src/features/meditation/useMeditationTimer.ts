import { useEffect, useMemo, useRef, useState } from "react";
import { BellSession } from "./bells";
import { buildBellSchedule, type BellPackId } from "./constants";

/**
 * A bell that came due while the app was suspended is not worth ringing — the
 * moment it marked has passed. Without this, returning after a long suspension
 * would fire every missed bell back to back. The index still advances; only the
 * sound is skipped.
 */
const LATE_BELL_GRACE = 5;

export type MeditationPhase = "prep" | "running" | "done";

export interface MeditationTimerState {
  phase: MeditationPhase;
  /** Seconds left in the preparation countdown. */
  prepRemaining: number;
  /** Seconds left until the session ends, preparation included. */
  remaining: number;
  /** Seconds sat so far, excluding preparation. */
  elapsedInSession: number;
  /** Seconds until the next interval bell, or null when none is scheduled. */
  nextBellIn: number | null;
}

interface UseMeditationTimerArgs {
  totalSeconds: number;
  prepSeconds: number;
  intervalSeconds: number;
  bell: BellPackId;
}

/**
 * The meditation clock and its bells.
 *
 * The clock is BreathingExercise's wall-clock baseline rather than a counter
 * incremented per tick: no drift over an hour, and an app that was backgrounded
 * catches up to real time on return instead of silently running long. Everything
 * the screen shows is derived from the one elapsed value.
 *
 * Because elapsed is derived rather than emitted, bell times are not events —
 * each tick walks the schedule and rings whatever just came due.
 */
export function useMeditationTimer({
  totalSeconds,
  prepSeconds,
  intervalSeconds,
  bell,
}: UseMeditationTimerArgs): MeditationTimerState {
  const cues = useMemo(
    () => buildBellSchedule(totalSeconds, prepSeconds, intervalSeconds),
    [totalSeconds, prepSeconds, intervalSeconds]
  );
  const endsAt = prepSeconds + totalSeconds;

  const [elapsed, setElapsed] = useState(0);
  const nextCueRef = useRef(0);

  useEffect(() => {
    nextCueRef.current = 0;
    const session = new BellSession(bell);
    void session.start();

    const startedAt = Date.now();
    const id = setInterval(() => {
      // raw drives the bells, capped drives the display: after a long
      // suspension raw is what tells us a bell is far too late to ring.
      const raw = Math.floor((Date.now() - startedAt) / 1000);
      const capped = Math.min(endsAt, raw);

      while (nextCueRef.current < cues.length && raw >= cues[nextCueRef.current].at) {
        const cue = cues[nextCueRef.current];
        nextCueRef.current += 1;
        if (raw - cue.at < LATE_BELL_GRACE) session.ring(cue.role);
      }

      setElapsed(capped);
      if (raw >= endsAt) clearInterval(id);
    }, 250);

    return () => {
      clearInterval(id);
      // Also what cuts the closing bell short when the finished screen is
      // dismissed, and what hands the audio session back to the rest of the app.
      void session.release();
    };
  }, [bell, cues, endsAt]);

  const phase: MeditationPhase = elapsed >= endsAt ? "done" : elapsed < prepSeconds ? "prep" : "running";
  const upcoming = cues.find((cue) => cue.role === "interval" && cue.at > elapsed);

  return {
    phase,
    prepRemaining: Math.max(0, prepSeconds - elapsed),
    remaining: Math.max(0, endsAt - elapsed),
    elapsedInSession: Math.max(0, Math.min(totalSeconds, elapsed - prepSeconds)),
    nextBellIn: upcoming ? upcoming.at - elapsed : null,
  };
}
