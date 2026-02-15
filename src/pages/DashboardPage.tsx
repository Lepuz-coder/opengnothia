import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { MessageSquare, BookOpen, Moon, Pencil, Lightbulb, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { saveMoodEntry, getTodayMoodEntry, getMoodEntriesByDateRange, getCompletedSessionCount, getJournalEntryCount, getDreamCount } from "@/services/db/queries";
import type { MoodEntry } from "@/types";

const MOOD_EMOJIS: Record<number, string> = {
  1: "\u{1F62B}", 2: "\u{1F622}", 3: "\u{1F614}", 4: "\u{1F615}", 5: "\u{1F610}",
  6: "\u{1F642}", 7: "\u{1F60A}", 8: "\u{1F604}", 9: "\u{1F929}", 10: "\u{1F973}",
};

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function getCalendarDays(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const startDow = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1;

  const days: Date[] = [];

  for (let i = startDow - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  for (let d = 1; d <= lastOfMonth.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  while (days.length % 7 !== 0) {
    const nextDay = days.length - startDow - lastOfMonth.getDate() + 1;
    days.push(new Date(year, month + 1, nextDay));
  }

  return days;
}

function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
}

function MoodChart({ entries, daysInMonth }: { entries: MoodEntry[]; daysInMonth: number }) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-[160px] text-sm text-[var(--text-muted)]">
        {"Bu ay için veri yok"}
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
      {/* Horizontal gridlines */}
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

      {/* Area fill */}
      {points.length > 1 && (
        <polygon
          points={`${points[0].x},${padding.top + chartH} ${linePoints} ${points[points.length - 1].x},${padding.top + chartH}`}
          fill="var(--color-primary-500)" opacity="0.1"
        />
      )}

      {/* Line */}
      {points.length > 1 && (
        <polyline
          points={linePoints} fill="none"
          stroke="var(--color-primary-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
      )}

      {/* Data points */}
      {points.map((p) => (
        <circle key={p.day} cx={p.x} cy={p.y} r={4} fill="var(--color-primary-400)" />
      ))}

      {/* X-axis labels */}
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

export default function DashboardPage() {
  const navigate = useNavigate();
  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [journalCount, setJournalCount] = useState(0);
  const [dreamCount, setDreamCount] = useState(0);

  // Calendar state
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);

  // Computed
  const calendarDays = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth]);
  const todayStr = useMemo(() => formatYMD(new Date()), []);
  const moodByDate = useMemo(() => {
    const map = new Map<string, MoodEntry>();
    for (const entry of moodEntries) {
      map.set(entry.date, entry);
    }
    return map;
  }, [moodEntries]);
  const currentMonthEntries = useMemo(() => {
    return moodEntries.filter((e) => {
      const d = new Date(e.date + "T00:00:00");
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }, [moodEntries, currentYear, currentMonth]);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Load mood entries for calendar range
  const loadMoodEntries = useCallback(async () => {
    const days = getCalendarDays(currentYear, currentMonth);
    const startDate = formatYMD(days[0]);
    const endDate = formatYMD(days[days.length - 1]);
    const data = await getMoodEntriesByDateRange(startDate, endDate);
    setMoodEntries(data);
  }, [currentYear, currentMonth]);

  useEffect(() => {
    getTodayMoodEntry().then((entry) => {
      if (entry) setTodayMood(entry.mood);
    });
    getCompletedSessionCount().then(setSessionCount);
    getJournalEntryCount().then(setJournalCount);
    getDreamCount().then(setDreamCount);
  }, []);

  useEffect(() => {
    loadMoodEntries();
  }, [loadMoodEntries]);

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentMonth((m) => {
      if (m === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };

  const handleNextMonth = () => {
    const now = new Date();
    if (currentYear === now.getFullYear() && currentMonth >= now.getMonth()) return;
    setCurrentMonth((m) => {
      if (m === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  const isNextDisabled = currentYear === new Date().getFullYear() && currentMonth >= new Date().getMonth();

  async function handleMoodSelect(mood: number) {
    setTodayMood(mood);
    try {
      await saveMoodEntry(mood);
      await loadMoodEntries();
    } catch (err) {
      console.error("Failed to save mood:", err);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Merhaba</h1>
        <p className="text-[var(--text-muted)]">
          {new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: MessageSquare, label: "Seans", color: "bg-primary-900/30 text-primary-400", path: "/session" },
          { icon: BookOpen, label: "Günlük", color: "bg-blue-900/30 text-blue-400", path: "/journal" },
          { icon: Moon, label: "Rüyalar", color: "bg-purple-900/30 text-purple-400", path: "/dreams" },
          { icon: Lightbulb, label: "İçgörüler", color: "bg-amber-900/30 text-amber-400", path: "/insights" },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={() => navigate(btn.path)}
            className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border-color)] hover:border-primary-500/50 hover:bg-[var(--bg-primary)] transition-all"
          >
            <div className={`w-10 h-10 rounded-xl ${btn.color} flex items-center justify-center shrink-0`}>
              <btn.icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">{btn.label}</span>
          </button>
        ))}
      </div>

       {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: MessageSquare, label: "Toplam Seans", count: sessionCount, color: "bg-primary-900/30 text-primary-400" },
          { icon: BookOpen, label: "Toplam Günlük", count: journalCount, color: "bg-blue-900/30 text-blue-400" },
          { icon: Moon, label: "Toplam Rüya", count: dreamCount, color: "bg-purple-900/30 text-purple-400" },
        ].map((stat) => (
          <Card key={stat.label}>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold">{stat.count}</span>
              <span className="text-xs text-[var(--text-muted)]">{stat.label}</span>
            </div>
          </Card>
        ))}
      </div>


      {/* Mood Entry */}
      <Card>
        {todayMood === null ? (
          <>
            <h3 className="text-lg font-semibold mb-4">{"Bugün nasıl hissediyorsun?"}</h3>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((mood) => (
                <button
                  key={mood}
                  onClick={() => handleMoodSelect(mood)}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl border border-[var(--border-color)] hover:border-primary-500 hover:bg-primary-500/10 transition-all"
                >
                  <span className="text-2xl">{MOOD_EMOJIS[mood]}</span>
                  <span className="text-xs font-medium text-[var(--text-secondary)]">{mood}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div>
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)]"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleGoToToday}
                className="text-sm font-semibold text-[var(--text-secondary)] capitalize hover:text-[var(--text-primary)] transition-colors"
              >
                {formatMonthYear(currentYear, currentMonth)}
              </button>
              <button
                onClick={handleNextMonth}
                disabled={isNextDisabled}
                className={cn(
                  "p-2 rounded-lg transition-colors text-[var(--text-secondary)]",
                  isNextDisabled ? "opacity-30 cursor-not-allowed" : "hover:bg-[var(--bg-tertiary)]"
                )}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAY_NAMES.map((name) => (
                <div key={name} className="text-center text-xs font-medium text-[var(--text-muted)] py-1">
                  {name}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dateStr = formatYMD(day);
                const isCurrentMonth = day.getMonth() === currentMonth;
                const isToday = dateStr === todayStr;
                const isFuture = dateStr > todayStr;
                const moodEntry = moodByDate.get(dateStr);

                return (
                  <div
                    key={dateStr}
                    className={cn(
                      "min-h-[56px] p-1.5 rounded-xl border text-center transition-all duration-200 flex flex-col items-center gap-0.5",
                      isCurrentMonth
                        ? "bg-[var(--bg-secondary)] border-[var(--border-color)]"
                        : "bg-[var(--bg-primary)] border-transparent opacity-30",
                      isToday && "ring-2 ring-primary-500/50 border-primary-500/30",
                      isFuture && isCurrentMonth && "opacity-40",
                    )}
                  >
                    <span className={cn(
                      "text-[10px] font-bold self-start",
                      isToday ? "text-primary-400" : isCurrentMonth ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                    )}>
                      {day.getDate()}
                    </span>
                    {moodEntry && (
                      <>
                        <span className="text-lg leading-none">{MOOD_EMOJIS[moodEntry.mood]}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">{moodEntry.mood}</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mood Trend Chart */}
            <MoodChart entries={currentMonthEntries} daysInMonth={daysInMonth} />

            {/* Edit today's mood */}
            <div className="flex justify-center mt-3">
              <button
                onClick={() => setTodayMood(null)}
                className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                {"Bugünkü ruh halini değiştir"}
              </button>
            </div>
          </div>
        )}
      </Card>

     
    </div>
  );
}
