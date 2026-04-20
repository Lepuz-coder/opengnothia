import { DollarSign } from "lucide-react";
import type { TokenUsageRecord } from "@/types";
import type { Translations } from "@/i18n";

interface SpendingStripProps {
  records: TokenUsageRecord[];
  t: Translations;
}

function ymd(ts: string): string {
  return new Date(ts + "Z").toISOString().slice(0, 10);
}

export function SpendingStrip({ records, t }: SpendingStripProps) {
  if (records.length === 0) return null;

  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const todayRecs = records.filter((r) => ymd(r.created_at) === today);
  const weekRecs = records.filter((r) => ymd(r.created_at) >= sevenDaysAgo);

  const todayCost = todayRecs.reduce((s, r) => s + r.cost, 0);
  const weekAvg = weekRecs.reduce((s, r) => s + r.cost, 0) / 7;
  const todayCalls = todayRecs.length;

  const hasToday = todayCalls > 0;
  const weeklyAvgText = t.dashboard.weeklyAvgSpending.replace("{amount}", `$${weekAvg.toFixed(4)}`);

  return (
    <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border-color)] bg-gradient-to-r from-accent-500/10 via-[var(--bg-secondary)]/50 to-[var(--bg-secondary)]/50">
      <div className="w-9 h-9 rounded-xl bg-accent-500/20 text-accent-400 flex items-center justify-center shrink-0">
        <DollarSign className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        {hasToday ? (
          <>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xs text-[var(--text-muted)]">{t.dashboard.todaySpending}</span>
              <span className="text-lg font-bold text-[var(--text-primary)] tabular-nums">
                ${todayCost.toFixed(4)}
              </span>
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">
              {weeklyAvgText} · {todayCalls} {t.common.call}
            </div>
          </>
        ) : (
          <>
            <div className="text-sm font-medium text-[var(--text-primary)]">
              {t.dashboard.noSpendingToday}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">{weeklyAvgText}</div>
          </>
        )}
      </div>
    </div>
  );
}
