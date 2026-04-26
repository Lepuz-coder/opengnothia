import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { getDateLocale } from "@/i18n";
import type { Translations } from "@/i18n";
import type { TokenUsageRecord, Language } from "@/types";

type Period = "daily" | "weekly" | "monthly";

interface SpendingChartProps {
  records: TokenUsageRecord[];
  t: Translations;
  language: Language;
}

interface Bucket {
  key: string;
  label: string;
  total: number;
}

function toUtcDate(ts: string): Date {
  return new Date(ts + "Z");
}

function ymdUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function ymUtc(d: Date): string {
  return d.toISOString().slice(0, 7);
}

function mondayOfUtc(d: Date): Date {
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
}

function buildBuckets(
  records: TokenUsageRecord[],
  period: Period,
  locale: string
): Bucket[] {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (period === "daily") {
    const totals = new Map<string, number>();
    for (const r of records) {
      const key = ymdUtc(toUtcDate(r.created_at));
      totals.set(key, (totals.get(key) ?? 0) + r.cost);
    }
    const buckets: Bucket[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
      const key = ymdUtc(d);
      const label = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(d);
      buckets.push({ key, label, total: totals.get(key) ?? 0 });
    }
    return buckets;
  }

  if (period === "weekly") {
    const totals = new Map<string, number>();
    for (const r of records) {
      const monday = mondayOfUtc(toUtcDate(r.created_at));
      const key = ymdUtc(monday);
      totals.set(key, (totals.get(key) ?? 0) + r.cost);
    }
    const todayMonday = mondayOfUtc(today);
    const buckets: Bucket[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(Date.UTC(
        todayMonday.getUTCFullYear(),
        todayMonday.getUTCMonth(),
        todayMonday.getUTCDate() - i * 7
      ));
      const key = ymdUtc(d);
      const label = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", timeZone: "UTC" }).format(d);
      buckets.push({ key, label, total: totals.get(key) ?? 0 });
    }
    return buckets;
  }

  const totals = new Map<string, number>();
  for (const r of records) {
    const key = ymUtc(toUtcDate(r.created_at));
    totals.set(key, (totals.get(key) ?? 0) + r.cost);
  }
  const buckets: Bucket[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
    const key = ymUtc(d);
    const label = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(d);
    buckets.push({ key, label, total: totals.get(key) ?? 0 });
  }
  return buckets;
}

function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const mantissa = value / base;
  let nice: number;
  if (mantissa <= 1) nice = 1;
  else if (mantissa <= 2) nice = 2;
  else if (mantissa <= 5) nice = 5;
  else nice = 10;
  return nice * base;
}

function formatTickCost(v: number): string {
  if (v === 0) return "$0";
  if (v < 1) return `$${v.toFixed(2)}`;
  return `$${v.toFixed(2)}`;
}

export function SpendingChart({ records, t, language }: SpendingChartProps) {
  const [period, setPeriod] = useState<Period>("daily");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const locale = getDateLocale(language);

  const buckets = useMemo(
    () => buildBuckets(records, period, locale),
    [records, period, locale]
  );

  const tabs = [
    { id: "daily", label: t.expenses.daily },
    { id: "weekly", label: t.expenses.weekly },
    { id: "monthly", label: t.expenses.monthly },
  ];

  const maxTotal = buckets.reduce((m, b) => Math.max(m, b.total), 0);
  const allZero = maxTotal === 0;

  const width = 600;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const yMax = allZero ? 1 : niceCeil(maxTotal);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => yMax * f);

  const slot = chartW / Math.max(buckets.length, 1);
  const barW = slot * 0.6;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">{t.expenses.spendingTrend}</h2>
      </div>
      <Tabs
        tabs={tabs}
        activeTab={period}
        onChange={(id) => setPeriod(id as Period)}
        className="mb-4"
      />

      {allZero ? (
        <div className="flex items-center justify-center h-[180px] text-sm text-[var(--text-muted)]">
          {t.expenses.noChartData}
        </div>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {ticks.map((v, i) => {
            const y = padding.top + chartH - (v / yMax) * chartH;
            return (
              <g key={i}>
                <line
                  x1={padding.left} y1={y} x2={width - padding.right} y2={y}
                  stroke="var(--border-color)" strokeDasharray="4 4"
                />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fill="var(--text-muted)" fontSize="10">
                  {formatTickCost(v)}
                </text>
              </g>
            );
          })}

          {buckets.map((b, i) => {
            const slotX = padding.left + i * slot;
            const x = slotX + (slot - barW) / 2;
            const h = (b.total / yMax) * chartH;
            const y = padding.top + chartH - h;
            const isHover = hoverIdx === i;
            return (
              <g
                key={b.key}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={slotX} y={padding.top}
                  width={slot} height={chartH}
                  fill="transparent"
                />
                <rect
                  x={x} y={y} width={barW} height={Math.max(h, 0)}
                  fill={isHover ? "var(--color-primary-400)" : "var(--color-primary-500)"}
                  rx={4} ry={4}
                />
                <text
                  x={slotX + slot / 2}
                  y={height - 8}
                  textAnchor="middle"
                  fill={isHover ? "var(--text-secondary)" : "var(--text-muted)"}
                  fontSize="10"
                >
                  {b.label}
                </text>
              </g>
            );
          })}

          {hoverIdx !== null && (() => {
            const b = buckets[hoverIdx];
            const slotX = padding.left + hoverIdx * slot;
            const cx = slotX + slot / 2;
            const barTopY = padding.top + chartH - (b.total / yMax) * chartH;
            const tooltipW = 96;
            const tooltipH = 38;
            let tx = cx - tooltipW / 2;
            if (tx < padding.left - 4) tx = padding.left - 4;
            if (tx + tooltipW > width - padding.right + 4) tx = width - padding.right + 4 - tooltipW;
            let ty = barTopY - tooltipH - 8;
            if (ty < padding.top - 4) ty = barTopY + 8;
            return (
              <g pointerEvents="none">
                <line
                  x1={cx} y1={padding.top}
                  x2={cx} y2={padding.top + chartH}
                  stroke="var(--color-primary-400)"
                  strokeOpacity="0.25"
                  strokeDasharray="2 3"
                />
                <rect
                  x={tx} y={ty} width={tooltipW} height={tooltipH}
                  rx={6} ry={6}
                  fill="var(--bg-tertiary)"
                  stroke="var(--border-color)"
                  strokeWidth="1"
                />
                <text
                  x={tx + tooltipW / 2} y={ty + 15}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="10"
                >
                  {b.label}
                </text>
                <text
                  x={tx + tooltipW / 2} y={ty + 30}
                  textAnchor="middle"
                  fill="var(--text-primary)"
                  fontSize="12"
                  fontWeight="600"
                >
                  {`$${b.total.toFixed(4)}`}
                </text>
              </g>
            );
          })()}
        </svg>
      )}
    </Card>
  );
}
