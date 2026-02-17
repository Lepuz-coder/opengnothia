import { useReducer, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n";
import type { BreathingTechnique } from "@/constants/breathingTechniques";

interface BreathingExerciseProps {
  technique: BreathingTechnique;
  totalDuration: number;
  onStop: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function BreathingExercise({
  technique,
  totalDuration,
  onStop,
}: BreathingExerciseProps) {
  const { t } = useTranslation();
  const [elapsed, tick] = useReducer((s: number) => s + 1, 0);

  const remaining = Math.max(0, totalDuration - elapsed);
  const isFinished = elapsed >= totalDuration;

  // Phase derivation
  const elapsedInCycle = elapsed % technique.cycleDuration;
  const cycleNumber = Math.floor(elapsed / technique.cycleDuration) + 1;

  let accumulated = 0;
  let currentPhaseIdx = 0;
  let phaseElapsed = 0;
  for (let i = 0; i < technique.phases.length; i++) {
    if (elapsedInCycle < accumulated + technique.phases[i].duration) {
      currentPhaseIdx = i;
      phaseElapsed = elapsedInCycle - accumulated;
      break;
    }
    accumulated += technique.phases[i].duration;
  }

  const currentPhase = technique.phases[currentPhaseIdx];
  const phaseRemaining = currentPhase.duration - phaseElapsed;
  const progressPercent = (elapsed / totalDuration) * 100;
  const targetScale =
    currentPhase.type === "inhale" || currentPhase.type === "hold" ? 1.0 : 0.6;

  // Timer: dispatch tick every second
  useEffect(() => {
    if (isFinished) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isFinished, tick]);

  if (isFinished) {
    return (
      <div className="fixed inset-0 z-40 bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 breathing-circle flex items-center justify-center">
          <span className="text-3xl">&#10003;</span>
        </div>
        <div className="text-center space-y-2">
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {t.breathing.congratulations}
          </p>
          <p className="text-[var(--text-muted)]">{t.breathing.completed}</p>
          <p className="text-sm text-[var(--text-muted)]">
            {cycleNumber - 1} {t.breathing.cyclesCompleted}
          </p>
        </div>
        <Button onClick={onStop} variant="primary" size="lg">
          {t.common.close}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-[var(--bg-primary)] flex flex-col items-center justify-center">
      {/* Exit button */}
      <button
        onClick={onStop}
        className="absolute top-6 right-6 p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Technique name */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-sm text-[var(--text-muted)]">
        {technique.name}
      </div>

      {/* Center: breathing circle + phase text */}
      <div className="relative flex flex-col items-center gap-10">
        {/* Breathing circle container */}
        <div className="relative flex items-center justify-center w-48 h-48">
          {/* Decorative rings */}
          <div className="breathing-ring absolute w-40 h-40 rounded-full border border-primary-500/20" />
          <div
            className="breathing-ring absolute w-40 h-40 rounded-full border border-primary-500/15"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="breathing-ring absolute w-40 h-40 rounded-full border border-primary-500/10"
            style={{ animationDelay: "2s" }}
          />

          {/* Main breathing circle */}
          <div
            className="breathing-circle w-40 h-40 rounded-full bg-gradient-to-br from-primary-400 to-primary-700"
            style={{
              transform: `scale(${targetScale})`,
              transition: `transform ${currentPhase.duration}s ease-in-out`,
            }}
          />
        </div>

        {/* Phase text */}
        <div
          key={`${currentPhaseIdx}-${cycleNumber}`}
          className="phase-text-enter text-center"
        >
          <p className="text-3xl font-bold text-[var(--text-primary)]">
            {currentPhase.name}
          </p>
          <p className="text-5xl font-bold text-primary-400 mt-3 tabular-nums">
            {phaseRemaining}
          </p>
        </div>
      </div>

      {/* Bottom: progress + time */}
      <div className="absolute bottom-10 flex flex-col items-center gap-3">
        
        <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
          <span key={`t-${elapsed}`}>{formatTime(remaining)}</span>
        </div>
      </div>
    </div>
  );
}
