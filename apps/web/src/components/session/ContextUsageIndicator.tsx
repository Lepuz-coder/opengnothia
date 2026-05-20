import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/i18n";
import { formatTokenCount } from "@/lib/formatTokens";
import { getSessionTotalCost } from "@/services/db/queries";

interface ContextUsageIndicatorProps {
  modelName: string;
  currentTokens: number;
  contextWindow: number;
  sessionId: string | null;
}

const RADIUS = 7;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 43.98

function colorByPct(p: number): string {
  if (p >= 80) return "#ef4444";
  if (p >= 50) return "#eab308";
  return "#22c55e";
}

export function ContextUsageIndicator({
  modelName,
  currentTokens,
  contextWindow,
  sessionId,
}: ContextUsageIndicatorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [sessionCost, setSessionCost] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const pct = contextWindow > 0 ? Math.min((currentTokens / contextWindow) * 100, 100) : 0;
  const color = colorByPct(pct);
  const dash = (pct / 100) * CIRCUMFERENCE;

  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !sessionId) return;
    let cancelled = false;
    getSessionTotalCost(sessionId)
      .then((cost) => {
        if (!cancelled) setSessionCost(cost);
      })
      .catch(() => {
        if (!cancelled) setSessionCost(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, sessionId, currentTokens]);

  const contextLabel = contextWindow >= 1_000_000
    ? `${(contextWindow / 1_000_000).toFixed(0)}M`
    : contextWindow >= 1_000
      ? `${Math.round(contextWindow / 1_000)}K`
      : String(contextWindow);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg text-xs text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-colors"
      >
        <span className="font-medium text-[var(--text-secondary)]">{modelName}</span>
        {contextWindow > 0 && (
          <span className="opacity-70">· {contextLabel}</span>
        )}
        <svg viewBox="0 0 18 18" className="w-4 h-4 -rotate-90">
          <circle cx="9" cy="9" r={RADIUS} fill="none" stroke="var(--bg-tertiary)" strokeWidth="2" />
          <circle
            cx="9"
            cy="9"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute bottom-full right-0 mb-2 w-72 p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xl z-20 space-y-3"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-muted)]">{t.session.contextWindow}</span>
              <span className="text-xs text-[var(--text-secondary)] tabular-nums">
                {formatTokenCount(currentTokens)} / {formatTokenCount(contextWindow)} ({Math.round(pct)}%)
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]/60">
            <span className="text-xs text-[var(--text-muted)]">{t.session.sessionSpent}</span>
            <span className="text-xs text-[var(--text-secondary)] tabular-nums font-medium">
              {sessionCost === null ? "—" : `$${sessionCost.toFixed(4)}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
