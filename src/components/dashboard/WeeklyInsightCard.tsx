import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getRecentCheckIns } from "@/services/db/queries";

export function WeeklyInsightCard() {
  const [avgMood, setAvgMood] = useState<number | null>(null);
  const [trend, setTrend] = useState<"up" | "down" | "stable">("stable");

  useEffect(() => {
    getRecentCheckIns(7).then((checkins) => {
      if (checkins.length === 0) return;
      const avg = checkins.reduce((sum, c) => sum + c.mood, 0) / checkins.length;
      setAvgMood(Math.round(avg * 10) / 10);

      if (checkins.length >= 3) {
        const recent = checkins.slice(0, 3).reduce((s, c) => s + c.mood, 0) / 3;
        const older = checkins.slice(-3).reduce((s, c) => s + c.mood, 0) / Math.min(3, checkins.length);
        if (recent - older > 0.5) setTrend("up");
        else if (older - recent > 0.5) setTrend("down");
      }
    });
  }, []);

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-[var(--text-muted)]";

  return (
    <Card>
      <h3 className="font-semibold mb-3">Haftalık Özet</h3>
      {avgMood !== null ? (
        <div className="flex items-center gap-4">
          <div>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{avgMood}</p>
            <p className="text-xs text-[var(--text-muted)]">Ort. ruh hali</p>
          </div>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-5 h-5" />
            <span className="text-sm font-medium">
              {trend === "up" ? "Yükseliyor" : trend === "down" ? "Düşüyor" : "Stabil"}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">Henüz yeterli veri yok. Günlük check-in yapmaya devam et.</p>
      )}
    </Card>
  );
}
