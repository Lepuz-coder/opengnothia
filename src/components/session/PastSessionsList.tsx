import { useEffect, useState } from "react";
import { Clock, Calendar } from "lucide-react";
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

  if (sessions.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3">Geçmiş Seanslar</h3>
      <div className="space-y-2">
        {sessions.map((s) => {
          const startDate = new Date(s.started_at);
          const endDate = s.ended_at ? new Date(s.ended_at) : null;
          const durationMin = endDate
            ? Math.round((endDate.getTime() - startDate.getTime()) / 60000)
            : null;

          return (
            <button
              key={s.id}
              onClick={() => onViewSession(s.id)}
              className="w-full text-left p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--text-muted)] transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Calendar className="w-3.5 h-3.5" />
                  {startDate.toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                {durationMin != null && (
                  <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <Clock className="w-3 h-3" />
                    {durationMin} dk
                  </div>
                )}
              </div>
              {s.summary && s.summary.themes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {s.summary.themes.map((t) => (
                    <Badge key={t} variant="primary">{t}</Badge>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
