import { useState } from "react";
import { Angry, Frown, Meh, Smile, Laugh, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Translations } from "@/i18n";

function moodIconFor(m: number): LucideIcon {
  if (m <= 2) return Angry;
  if (m <= 4) return Frown;
  if (m <= 6) return Meh;
  if (m <= 8) return Smile;
  return Laugh;
}

function moodColorFor(m: number): string {
  if (m <= 2) return "text-red-400";
  if (m <= 4) return "text-amber-400";
  if (m <= 6) return "text-[var(--text-secondary)]";
  if (m <= 8) return "text-primary-300";
  return "text-primary-400";
}

function thumbBorderClass(m: number): string {
  if (m <= 2) return "border-red-400 shadow-red-500/30";
  if (m <= 4) return "border-amber-400 shadow-amber-500/30";
  if (m <= 6) return "border-[var(--text-secondary)] shadow-black/30";
  if (m <= 8) return "border-primary-300 shadow-primary-400/30";
  return "border-primary-500 shadow-primary-500/40";
}

export function MoodIcon({ mood, className }: { mood: number; className?: string }) {
  const Icon = moodIconFor(mood);
  return <Icon className={cn(moodColorFor(mood), className)} strokeWidth={2} />;
}

interface MoodPickerScaleProps {
  selected: number | null;
  onSelect: (mood: number) => void;
  t: Translations;
}

export function MoodPickerScale({ selected, onSelect, t }: MoodPickerScaleProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const preview = selected ?? hovered;
  const pct = (m: number) => ((m - 1) / 9) * 100;

  return (
    <div className="py-2">
      <p className="text-center text-sm text-[var(--text-secondary)] mb-6 font-medium">
        {t.dashboard.moodQuestion}
      </p>

      {/* Floating preview (icon + number) */}
      <div className="relative h-14 mb-1">
        {preview !== null && (
          <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center gap-1 phase-text-enter pointer-events-none"
            style={{ left: `${pct(preview)}%` }}
          >
            <MoodIcon mood={preview} className="w-8 h-8" />
            <span className="text-[10px] font-semibold text-[var(--text-muted)] tabular-nums">
              {preview}/10
            </span>
          </div>
        )}
      </div>

      {/* Slider track */}
      <div className="relative h-2 mx-3 rounded-full bg-[var(--bg-tertiary)]">
        {selected !== null && (
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-primary-400 transition-all duration-300 ease-out"
            style={{ width: `${pct(selected)}%` }}
          />
        )}

        {Array.from({ length: 10 }, (_, i) => i + 1).map((m) => {
          const isSelected = selected === m;
          const isHovered = hovered === m && !isSelected;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onSelect(m)}
              onMouseEnter={() => setHovered(m)}
              onMouseLeave={() => setHovered(null)}
              style={{ left: `${pct(m)}%` }}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full cursor-pointer group"
              aria-label={`Mood ${m}`}
            >
              {isSelected ? (
                <span
                  className={cn(
                    "block w-5 h-5 rounded-full bg-[var(--bg-primary)] border-[3px] shadow-lg transition-transform duration-200",
                    thumbBorderClass(m)
                  )}
                />
              ) : (
                <span
                  className={cn(
                    "block rounded-full transition-all duration-200",
                    isHovered
                      ? "w-3 h-3 bg-primary-400"
                      : "w-1.5 h-1.5 bg-[var(--text-muted)]/60 group-hover:bg-[var(--text-muted)]"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Number ticks */}
      <div className="flex justify-between mt-2 px-3 text-[10px] font-medium text-[var(--text-muted)] tabular-nums">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>

      {/* Band labels */}
      <div className="flex justify-between mt-3 px-3 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
        <span>{t.dashboard.moodBandBad}</span>
        <span>{t.dashboard.moodBandOkay}</span>
        <span>{t.dashboard.moodBandNeutral}</span>
        <span>{t.dashboard.moodBandGood}</span>
        <span>{t.dashboard.moodBandGreat}</span>
      </div>
    </div>
  );
}
