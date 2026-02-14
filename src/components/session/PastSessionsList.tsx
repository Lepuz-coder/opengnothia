import { useEffect, useState } from "react";
import { Clock, Calendar, MessageCircle } from "lucide-react";
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
                  {" · "}
                  {startDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </div>
                {durationMin != null && (
                  <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <Clock className="w-3 h-3" />
                    {durationMin} dk
                  </div>
                )}
              </div>
              {s.summary_narrative && (
                <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                  {s.summary_narrative}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
