import { useEffect, useState, useMemo } from "react";
import { Clock, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { getCompletedSessions } from "@/services/db/queries";
import type { Session } from "@/types";

interface PastSessionsListProps {
  onViewSession: (sessionId: string) => void;
}

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function getWeekMonday(weekOffset: number): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const mDay = monday.getDate();
  const mMonth = monday.toLocaleDateString("tr-TR", { month: "long" });
  const sDay = sunday.getDate();
  const sMonth = sunday.toLocaleDateString("tr-TR", { month: "long" });
  const year = sunday.getFullYear();

  if (mMonth === sMonth) {
    return `${mDay} – ${sDay} ${mMonth} ${year}`;
  }
  return `${mDay} ${mMonth} – ${sDay} ${sMonth} ${year}`;
}

export function PastSessionsList({ onViewSession }: PastSessionsListProps) {
  const [sessions, setSessions] = useState<Omit<Session, "messages">[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    getCompletedSessions().then(setSessions);
  }, []);

  const monday = useMemo(() => getWeekMonday(weekOffset), [weekOffset]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [monday]);

  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  }, []);

  const sessionsByDay = useMemo(() => {
    const sundayEnd = new Date(monday);
    sundayEnd.setDate(monday.getDate() + 7);

    const map: Record<number, Omit<Session, "messages">[]> = {};
    for (let i = 0; i < 7; i++) map[i] = [];

    for (const s of sessions) {
      const d = new Date(s.started_at);
      if (d >= monday && d < sundayEnd) {
        const jsDay = d.getDay(); // 0=Sun
        const idx = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon
        map[idx].push(s);
      }
    }

    // Sort each day's sessions by time
    for (let i = 0; i < 7; i++) {
      map[i].sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
    }

    return map;
  }, [sessions, monday]);

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

  const hasSessionsThisWeek = Object.values(sessionsByDay).some((arr) => arr.length > 0);

  return (
    <div className="mt-6">
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-[var(--text-secondary)]">
          {formatWeekRange(monday)}
        </span>
        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          disabled={weekOffset >= 0}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7 rounded-2xl border border-[var(--border-color)] overflow-hidden">
        {weekDays.map((day, i) => {
          const dayKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
          const isToday = dayKey === today;
          const daySessions = sessionsByDay[i];

          return (
            <div
              key={i}
              className={`min-h-[120px] bg-[var(--bg-secondary)]/50 ${
                i < 6 ? "border-r border-[var(--border-color)]" : ""
              }`}
            >
              {/* Day header */}
              <div
                className={`text-center py-2.5 border-b border-[var(--border-color)] ${
                  isToday
                    ? "bg-primary-500/15 text-primary-400"
                    : "bg-[var(--bg-tertiary)]/60 text-[var(--text-muted)]"
                }`}
              >
                <div className="text-xs font-medium">{DAY_NAMES[i]}</div>
                <div className={`text-lg font-bold ${isToday ? "text-primary-300" : "text-[var(--text-primary)]"}`}>
                  {day.getDate()}
                </div>
              </div>

              {/* Sessions */}
              <div className="p-1.5 space-y-1.5">
                {daySessions.map((s) => {
                  const startDate = new Date(s.started_at);
                  const endDate = s.ended_at ? new Date(s.ended_at) : null;
                  const durationMin = endDate
                    ? Math.round((endDate.getTime() - startDate.getTime()) / 60000)
                    : null;
                  const timeStr = startDate.toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <button
                      key={s.id}
                      onClick={() => onViewSession(s.id)}
                      className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--text-muted)] hover:shadow-lg hover:shadow-black/10 transition-all duration-200 text-center"
                    >
                      <div className="text-sm font-semibold">{timeStr}</div>
                      {durationMin != null && (
                        <div className="flex items-center justify-center gap-1 text-xs text-[var(--text-muted)] mt-0.5">
                          <Clock className="w-3 h-3" />
                          {durationMin} dk
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty week message */}
      {!hasSessionsThisWeek && (
        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          Bu hafta seans yok
        </p>
      )}
    </div>
  );
}
