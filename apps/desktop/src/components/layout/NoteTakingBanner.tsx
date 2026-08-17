import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "@opengnothia/shared/i18n";

const NOTE_TAKING_PROGRESS_DURATION_MS = 60_000;
const NOTE_TAKING_PROGRESS_INTERVAL_MS = 250;

export function NoteTakingBanner() {
  const startedAt = useAppStore((s) => s.sessionNoteTakingStartedAt);
  const { t } = useTranslation();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (startedAt === null) return;
    const intervalId = window.setInterval(
      () => setTick((v) => v + 1),
      NOTE_TAKING_PROGRESS_INTERVAL_MS,
    );
    return () => window.clearInterval(intervalId);
  }, [startedAt]);

  if (startedAt === null) return null;

  const elapsed = Date.now() - startedAt;
  const progress = Math.min((elapsed / NOTE_TAKING_PROGRESS_DURATION_MS) * 100, 100);

  return (
    <div
      role="status"
      className="shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2.5"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary-500/15 text-primary-400 flex items-center justify-center shrink-0">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{t.session.noteTakingModalTitle}</p>
          <p className="text-xs text-[var(--text-muted)] truncate">{t.session.noteTakingModalWarning}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:inline text-xs text-[var(--text-muted)]">
            {t.session.noteTakingModalProgress}
          </span>
          <div className="w-32 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
            <div
              className="h-full rounded-full bg-primary-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-[var(--text-muted)] tabular-nums w-8 text-right">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </div>
  );
}
