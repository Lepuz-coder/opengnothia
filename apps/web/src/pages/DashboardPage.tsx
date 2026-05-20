import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  MessageSquare, BookOpen, Moon, Pencil, Heart, Flame,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import {
  saveMoodEntry, getTodayMoodEntry, getMoodEntriesByDateRange,
  getCompletedSessionCount, getJournalEntryCount, getDreamCount,
  getTodaySession, getJournalEntryByDate, getDreamsByDateRange,
  getUserProfile,
} from "@/services/db/queries";
import { useSessionStore } from "@/stores/useSessionStore";
import { useTranslation, getDayNames, getDateLocale, type Translations } from "@/i18n";
import type { MoodEntry, Session, UserProfile, JournalEntry, Dream } from "@/types";
import { MoodChart } from "@/components/dashboard/MoodChart";
import { MoodPickerScale, MoodIcon } from "@/components/dashboard/MoodPickerScale";
import { TodaySessionHero } from "@/components/dashboard/TodaySessionHero";
import { RitualCard } from "@/components/dashboard/RitualCard";

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

function formatMonthYear(year: number, month: number, locale: string): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

function getMoodBandLabel(mood: number, t: Translations): string {
  if (mood <= 2) return t.dashboard.moodBandBad;
  if (mood <= 4) return t.dashboard.moodBandOkay;
  if (mood <= 6) return t.dashboard.moodBandNeutral;
  if (mood <= 8) return t.dashboard.moodBandGood;
  return t.dashboard.moodBandGreat;
}

function computeStreak(moodDates: Set<string>, todayStr: string): number {
  const anchor = new Date(todayStr + "T00:00:00");
  if (!moodDates.has(formatYMD(anchor))) {
    anchor.setDate(anchor.getDate() - 1);
    if (!moodDates.has(formatYMD(anchor))) return 0;
  }
  let streak = 0;
  const d = new Date(anchor);
  while (moodDates.has(formatYMD(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const DAY_NAMES = getDayNames(language);
  const locale = getDateLocale(language);

  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [journalCount, setJournalCount] = useState(0);
  const [dreamCount, setDreamCount] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todaySession, setTodaySession] = useState<Session | null>(null);
  const [todayJournal, setTodayJournal] = useState<JournalEntry | null>(null);
  const [todayDreams, setTodayDreams] = useState<Dream[]>([]);
  const sessionStoreStatus = useSessionStore((s) => s.status);

  // DB'deki "active" satır ancak in-memory store da aktifse canlı seans sayılır.
  // Store "idle" ise seans yokmuş gibi davran.
  const heroSession = useMemo<Session | null>(() => {
    if (!todaySession) return null;
    if (todaySession.status === "active" && sessionStoreStatus !== "active") return null;
    return todaySession;
  }, [todaySession, sessionStoreStatus]);

  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);

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

  const streak = useMemo(() => {
    const moodDates = new Set(moodEntries.map((e) => e.date));
    return computeStreak(moodDates, todayStr);
  }, [moodEntries, todayStr]);

  const loadMoodEntries = useCallback(async () => {
    const days = getCalendarDays(currentYear, currentMonth);
    const startDate = formatYMD(days[0]);
    const endDate = formatYMD(days[days.length - 1]);
    const data = await getMoodEntriesByDateRange(startDate, endDate);
    setMoodEntries(data);
  }, [currentYear, currentMonth]);

  const loadTodayData = useCallback(async () => {
    const today = formatYMD(new Date());
    const [session, journal, dreams] = await Promise.all([
      getTodaySession(),
      getJournalEntryByDate(today),
      getDreamsByDateRange(today, today),
    ]);
    setTodaySession(session);
    setTodayJournal(journal);
    setTodayDreams(dreams);
  }, []);

  useEffect(() => {
    getTodayMoodEntry().then((entry) => {
      if (entry) setTodayMood(entry.mood);
    });
    getCompletedSessionCount().then(setSessionCount);
    getJournalEntryCount().then(setJournalCount);
    getDreamCount().then(setDreamCount);
    getUserProfile().then(setProfile);
    loadTodayData();
  }, [loadTodayData]);

  useEffect(() => {
    loadMoodEntries();
  }, [loadMoodEntries]);

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

  const firstName = profile?.name?.split(" ")[0] ?? null;
  const headerGreeting = firstName ? `${t.dashboard.greeting}, ${firstName}` : t.dashboard.greeting;

  const todayDreamEntry = todayDreams[0] ?? null;
  const hasTodayJournal = todayJournal !== null;
  const hasTodayDream = todayDreamEntry !== null;

  const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n).trim() + "..." : s);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{headerGreeting}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1 capitalize">
            {new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        {streak >= 2 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-500/15 text-accent-300 text-xs font-semibold border border-accent-500/20">
            <Flame className="w-3.5 h-3.5" />
            {streak} {t.dashboard.streakDays}
          </div>
        )}
      </div>

      {/* Hero: Today's Session */}
      <TodaySessionHero
        todaySession={heroSession}
        profile={profile}
        t={t}
        onStart={() => navigate("/session", { state: { openStartModal: true } })}
        onContinue={() => navigate("/session")}
      />

      {/* Mood Section */}
      {todayMood === null ? (
        <Card padding="lg">
          <MoodPickerScale selected={null} onSelect={handleMoodSelect} t={t} />
        </Card>
      ) : (
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/10 border border-primary-500/20 shrink-0">
              <MoodIcon mood={todayMood} className="w-9 h-9" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-primary-400 font-semibold mb-0.5">
                {t.dashboard.moodQuestion}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[var(--text-primary)]">{todayMood}</span>
                <span className="text-sm text-[var(--text-muted)]">/ 10</span>
                <span className="text-sm font-medium text-[var(--text-secondary)] ml-1">
                  · {getMoodBandLabel(todayMood, t)}
                </span>
              </div>
            </div>
            <button
              onClick={() => setTodayMood(null)}
              className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
              {t.dashboard.changeMood}
            </button>
          </div>
        </Card>
      )}

      {/* Ritual Row: Journal + Dream */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RitualCard
          icon={BookOpen}
          colorBg="bg-blue-900/30 text-blue-400"
          title={t.dashboard.journalTitle}
          body={hasTodayJournal ? truncate(todayJournal!.content, 100) : t.dashboard.journalEmptyBody}
          done={hasTodayJournal}
          actionLabel={hasTodayJournal ? t.dashboard.viewTodayJournal : t.dashboard.addTodayJournal}
          actionVariant={hasTodayJournal ? "ghost" : "secondary"}
          onAction={() => navigate("/journal")}
          totalCount={journalCount}
          totalLabel={t.dashboard.totalCountSuffix}
        />
        <RitualCard
          icon={Moon}
          colorBg="bg-purple-900/30 text-purple-400"
          title={t.dashboard.dreamsTitle}
          body={hasTodayDream ? truncate(todayDreamEntry!.content, 100) : t.dashboard.dreamEmptyBody}
          done={hasTodayDream}
          actionLabel={hasTodayDream ? t.dashboard.viewLastDream : t.dashboard.addTodayDream}
          actionVariant={hasTodayDream ? "ghost" : "secondary"}
          onAction={() => navigate("/dreams")}
          totalCount={dreamCount}
          totalLabel={t.dashboard.totalCountSuffix}
        />
      </div>

      {/* Mood History (Calendar + Chart) */}
      {moodEntries.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary-400" />
              <h3 className="text-sm font-semibold text-[var(--text-secondary)]">
                {t.dashboard.moodHistoryTitle}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleGoToToday}
                className="text-xs font-semibold text-[var(--text-secondary)] capitalize hover:text-[var(--text-primary)] transition-colors px-2 py-1"
              >
                {formatMonthYear(currentYear, currentMonth, locale)}
              </button>
              <button
                onClick={handleNextMonth}
                disabled={isNextDisabled}
                className={cn(
                  "p-1.5 rounded-lg transition-colors text-[var(--text-secondary)]",
                  isNextDisabled ? "opacity-30 cursor-not-allowed" : "hover:bg-[var(--bg-tertiary)]"
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_NAMES.map((name) => (
              <div key={name} className="text-center text-xs font-medium text-[var(--text-muted)] py-1">
                {name}
              </div>
            ))}
          </div>

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
                      ? "bg-[var(--bg-primary)] border-[var(--border-color)]"
                      : "bg-transparent border-transparent opacity-30",
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
                      <MoodIcon mood={moodEntry.mood} className="w-5 h-5" />
                      <span className="text-[10px] text-[var(--text-muted)]">{moodEntry.mood}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <MoodChart entries={currentMonthEntries} daysInMonth={daysInMonth} noDataText={t.dashboard.noDataThisMonth} />
        </Card>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: MessageSquare, label: t.dashboard.totalSessions, count: sessionCount, color: "bg-primary-900/30 text-primary-400" },
          { icon: BookOpen, label: t.dashboard.totalJournal, count: journalCount, color: "bg-blue-900/30 text-blue-400" },
          { icon: Moon, label: t.dashboard.totalDreams, count: dreamCount, color: "bg-purple-900/30 text-purple-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border-color)]"
          >
            <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center shrink-0`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold leading-none">{stat.count}</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1 truncate">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
