import { useEffect, useState } from "react";
import { Clock, Calendar, MessageCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getCompletedSessions } from "@/services/db/queries";
import type { Session } from "@/types";

interface PastSessionsListProps {
  onViewSession: (sessionId: string) => void;
}

export function PastSessionsList({ onViewSession }: PastSessionsListProps) {
  const [sessions, setSessions] = useState<Omit<Session, "messages">[]>([]);

  useEffect(() => {
    getCompletedSessions().then(setSessions);
  }, []);

  if (sessions.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-[var(--text-muted)]" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Henüz hiç seansın yok</h3>
        <p className="text-sm text-[var(--text-muted)] text-center max-w-xs">
          İlk seansını başlatarak kendini keşfetmeye adım at. Seansların burada listelenecek.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3">Geçmiş Seanslar</h3>
      <div className="space-y-3">
        {sessions.map((s) => {
          const startDate = new Date(s.started_at);
          const endDate = s.ended_at ? new Date(s.ended_at) : null;
          const durationMin = endDate
            ? Math.round((endDate.getTime() - startDate.getTime()) / 60000)
            : null;
          const hasMood = s.mood_before != null && s.mood_after != null;
          const moodDelta = hasMood ? s.mood_after! - s.mood_before! : 0;
          const hasFooter = hasMood;

          return (
            <Card
              key={s.id}
              padding="sm"
              className="cursor-pointer hover:border-[var(--text-muted)] hover:shadow-lg hover:shadow-black/10 transition-all duration-200"
              onClick={() => onViewSession(s.id)}
            >
              {/* Row 1: Date + Duration */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Calendar className="w-3.5 h-3.5" />
                  {startDate.toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {" · "}
                  {startDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </div>
                {durationMin != null && (
                  <Badge variant="default">
                    <Clock className="w-3 h-3 mr-1" />
                    {durationMin} dk
                  </Badge>
                )}
              </div>

              {/* Row 2: Summary narrative */}
              {s.summary_narrative && (
                <p className="text-sm text-[var(--text-muted)] line-clamp-2">
                  {s.summary_narrative.replace(/[#*_~`>]/g, "").slice(0, 200)}
                </p>
              )}

              {/* Row 3: Mood change */}
              {hasFooter && (
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border-color)]/50">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[var(--text-muted)]">{s.mood_before}</span>
                    <span className="text-[var(--text-muted)]">&rarr;</span>
                    <span className={
                      moodDelta > 0
                        ? "text-green-400"
                        : moodDelta < 0
                        ? "text-red-400"
                        : "text-[var(--text-muted)]"
                    }>
                      {s.mood_after}
                    </span>
                    {moodDelta > 0 && <TrendingUp className="w-3.5 h-3.5 text-green-400" />}
                    {moodDelta < 0 && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                    {moodDelta === 0 && <Minus className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
