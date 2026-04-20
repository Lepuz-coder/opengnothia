import type { MoodEntry } from "@/types";

interface MoodChartProps {
  entries: MoodEntry[];
  daysInMonth: number;
  noDataText: string;
}

export function MoodChart({ entries, daysInMonth, noDataText }: MoodChartProps) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-[160px] text-sm text-[var(--text-muted)]">
        {noDataText}
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 30, left: 30 };
  const width = 600;
  const height = 200;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = entries.map((e) => {
    const day = parseInt(e.date.split("-")[2], 10);
    const x = padding.left + ((day - 1) / Math.max(daysInMonth - 1, 1)) * chartW;
    const y = padding.top + chartH - ((e.mood - 1) / 9) * chartH;
    return { x, y, mood: e.mood, day };
  });

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  const xLabels = [1, 5, 10, 15, 20, 25, daysInMonth].filter(
    (d, i, arr) => d <= daysInMonth && arr.indexOf(d) === i
  );

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto mt-4">
      {[2, 4, 6, 8, 10].map((v) => {
        const y = padding.top + chartH - ((v - 1) / 9) * chartH;
        return (
          <g key={v}>
            <line
              x1={padding.left} y1={y} x2={width - padding.right} y2={y}
              stroke="var(--border-color)" strokeDasharray="4 4"
            />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fill="var(--text-muted)" fontSize="10">
              {v}
            </text>
          </g>
        );
      })}

      {points.length > 1 && (
        <polygon
          points={`${points[0].x},${padding.top + chartH} ${linePoints} ${points[points.length - 1].x},${padding.top + chartH}`}
          fill="var(--color-primary-500)" opacity="0.1"
        />
      )}

      {points.length > 1 && (
        <polyline
          points={linePoints} fill="none"
          stroke="var(--color-primary-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
      )}

      {points.map((p) => (
        <circle key={p.day} cx={p.x} cy={p.y} r={4} fill="var(--color-primary-400)" />
      ))}

      {xLabels.map((d) => {
        const x = padding.left + ((d - 1) / Math.max(daysInMonth - 1, 1)) * chartW;
        return (
          <text key={d} x={x} y={height - 5} textAnchor="middle" fill="var(--text-muted)" fontSize="10">
            {d}
          </text>
        );
      })}
    </svg>
  );
}
