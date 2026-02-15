import { useEffect, useState } from "react";
import { Lightbulb, Coins, Calendar, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getRecentSessions } from "@/services/db/queries";
import type { Session } from "@/types";

function formatCost(cost: number): string {
  if (cost === 0) return "-";
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

function formatTokens(tokens: number): string {
  if (tokens === 0) return "-";
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
  return tokens.toString();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function InsightsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    getRecentSessions(20).then(setSessions);
  }, []);

  const completedSessions = sessions.filter((s) => s.status === "completed");
  const totalSpent = completedSessions.reduce((sum, s) => sum + (s.total_cost ?? 0), 0);
  const totalTokens = completedSessions.reduce(
    (sum, s) => sum + (s.total_input_tokens ?? 0) + (s.total_output_tokens ?? 0),
    0
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Lightbulb className="w-6 h-6" />
          İçgörüler
        </h1>
        <p className="text-[var(--text-muted)] mt-1">Seans geçmişin ve harcama detayların</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{completedSessions.length}</p>
              <p className="text-xs text-[var(--text-muted)]">Tamamlanan seans</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCost(totalSpent)}</p>
              <p className="text-xs text-[var(--text-muted)]">Toplam harcama</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatTokens(totalTokens)}</p>
              <p className="text-xs text-[var(--text-muted)]">Toplam token</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Session history */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Seans Geçmişi</h2>
        {completedSessions.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--text-muted)] text-center py-4">
              Henüz tamamlanmış seans yok. İlk seansını başlat!
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {completedSessions.map((s) => (
              <Card key={s.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{formatDate(s.started_at)}</p>
                      {s.model_used && (
                        <Badge variant="default">{s.model_used}</Badge>
                      )}
                    </div>
                    {s.summary && s.summary.themes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {s.summary.themes.map((t) => (
                          <Badge key={t} variant="primary">{t}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                      {s.mood_before != null && (
                        <span>Ruh hali: {s.mood_before} → {s.mood_after ?? "?"}</span>
                      )}
                      <span>{s.messages.length} mesaj</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {formatCost(s.total_cost ?? 0)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {formatTokens((s.total_input_tokens ?? 0) + (s.total_output_tokens ?? 0))} token
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
