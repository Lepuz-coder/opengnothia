import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { BookOpen, ChevronLeft, ChevronRight, Flame, Heart, Meh, Moon, Pencil } from "lucide-react-native";
import { getDateLocale, useTranslation } from "@opengnothia/shared/i18n";
import type { Dream, JournalEntry, MoodEntry, Session, UserProfile } from "@opengnothia/shared/types";
import { cn } from "@opengnothia/shared/lib/cn";
import { getQueries } from "@/db";
import { formatMonthYear, formatYMD, getCalendarDays } from "@/lib/date";
import { useSessionStore } from "@/stores/useSessionStore";
import { useThemeColors } from "@/theme/useAppTheme";
import { Card } from "@/ui";
import { JourneyCard } from "@/features/dashboard/JourneyCard";
import { MoodChart } from "@/features/dashboard/MoodChart";
import { getMoodBandLabel, MoodIcon, MoodPickerSheet } from "@/features/dashboard/MoodPicker";
import { RitualCard } from "@/features/dashboard/RitualCard";
import { TodaySessionHero } from "@/features/dashboard/TodaySessionHero";

/**
 * Desktop's streak helper, verbatim: today (or yesterday, so an unlogged
 * today doesn't break it) anchors a walk backwards over logged dates.
 */
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

const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n).trim() + "..." : s);

/**
 * Dashboard (M1 scope): mood entry + chart, RitualCards, TodaySessionHero with
 * a passive CTA, and the journey card in place of desktop's stats tiles —
 * M1 enumerates the mobile dashboard without them, and the ritual/journey
 * cards already carry the same counts. Expenses surfaces don't exist here.
 */
export default function HomeScreen() {
  const { t, language } = useTranslation();
  const locale = getDateLocale(language);
  const { colors } = useThemeColors();
  const router = useRouter();

  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [moodSheetOpen, setMoodSheetOpen] = useState(false);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [todaySession, setTodaySession] = useState<Session | null>(null);
  const sessionStoreStatus = useSessionStore((s) => s.status);
  const [todayJournal, setTodayJournal] = useState<JournalEntry | null>(null);
  const [todayDream, setTodayDream] = useState<Dream | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [journalCount, setJournalCount] = useState(0);
  const [dreamCount, setDreamCount] = useState(0);

  const now = new Date();
  const todayStr = formatYMD(now);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());

  const loadMoodEntries = useCallback(async () => {
    const days = getCalendarDays(currentYear, currentMonth);
    const queries = await getQueries();
    const data = await queries.getMoodEntriesByDateRange(formatYMD(days[0]), formatYMD(days[days.length - 1]));
    setMoodEntries(data);
  }, [currentYear, currentMonth]);

  const loadDashboard = useCallback(async () => {
    const queries = await getQueries();
    const today = formatYMD(new Date());
    const [moodEntry, session, journal, dreams, userProfile, sessions, journals, dreams2] = await Promise.all([
      queries.getTodayMoodEntry(),
      queries.getTodaySession(),
      queries.getJournalEntryByDate(today),
      queries.getDreamsByDateRange(today, today),
      queries.getUserProfile(),
      queries.getCompletedSessionCount(),
      queries.getJournalEntryCount(),
      queries.getDreamCount(),
    ]);
    setTodayMood(moodEntry?.mood ?? null);
    setTodaySession(session);
    setTodayJournal(journal);
    setTodayDream(dreams[0] ?? null);
    setProfile(userProfile);
    setSessionCount(sessions);
    setJournalCount(journals);
    setDreamCount(dreams2);
  }, []);

  // Ritual/journey state changes in other tabs (a journal written, a session
  // completed), so everything reloads on focus, not just on mount.
  useFocusEffect(
    useCallback(() => {
      loadDashboard();
      loadMoodEntries();
    }, [loadDashboard, loadMoodEntries])
  );

  const handleMoodSelect = async (mood: number) => {
    setTodayMood(mood);
    try {
      const queries = await getQueries();
      await queries.saveMoodEntry(mood);
      await loadMoodEntries();
    } catch (err) {
      console.error("Failed to save mood:", err);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth((m) => {
      if (m === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };

  const isNextDisabled = currentYear === now.getFullYear() && currentMonth >= now.getMonth();
  const handleNextMonth = () => {
    if (isNextDisabled) return;
    setCurrentMonth((m) => {
      if (m === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const moodDates = useMemo(() => new Set(moodEntries.map((e) => e.date)), [moodEntries]);
  const streak = useMemo(() => computeStreak(moodDates, todayStr), [moodDates, todayStr]);

  // Desktop parity: a DB "active" row only counts as a live session while the
  // in-memory store is active too — an abandoned one (app killed mid-session)
  // reads as "ready".
  const heroSession = useMemo<Session | null>(() => {
    if (!todaySession) return null;
    if (todaySession.status === "active" && sessionStoreStatus !== "active") return null;
    return todaySession;
  }, [todaySession, sessionStoreStatus]);

  const currentMonthEntries = useMemo(
    () =>
      moodEntries.filter((e) => {
        const d = new Date(e.date + "T00:00:00");
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }),
    [moodEntries, currentYear, currentMonth]
  );
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Desktop hides the history card whenever the visible range is empty — which
  // strands you, since the month nav lives inside the card. Keep it visible
  // while browsing past months; hide it only in the initial no-data-yet state.
  const viewingCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth();
  const showMoodHistory = moodEntries.length > 0 || !viewingCurrentMonth;

  const firstName = profile?.name?.split(" ")[0] ?? null;
  const headerGreeting = firstName ? `${t.dashboard.greeting}, ${firstName}` : t.dashboard.greeting;
  const rawDateLabel = now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
  const dateLabel = rawDateLabel.charAt(0).toLocaleUpperCase(locale) + rawDateLabel.slice(1);

  return (
    <>
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 py-4">
        {/* Header */}
        <View className="flex-row items-end justify-between gap-3">
          <View className="flex-1">
            <Text className="text-2xl font-bold tracking-tight text-ink">{headerGreeting}</Text>
            <Text className="mt-0.5 text-sm text-ink-mute">{dateLabel}</Text>
          </View>
          {streak >= 2 && (
            <View className="flex-row items-center gap-1.5 rounded-full border border-accent-500/20 bg-accent-500/15 px-3 py-1.5">
              <Flame size={14} color="#EDB448" />
              <Text className="text-xs font-semibold text-accent-600 dark:text-accent-300">
                {streak} {t.dashboard.streakDays}
              </Text>
            </View>
          )}
        </View>

        <TodaySessionHero todaySession={heroSession} profile={profile} />

        {/* Mood */}
        {todayMood === null ? (
          <Pressable accessibilityRole="button" onPress={() => setMoodSheetOpen(true)} className="active:opacity-80">
            <Card>
              <View className="flex-row items-center gap-4">
                <View className="h-14 w-14 items-center justify-center rounded-2xl border border-primary-500/20 bg-primary-500/10">
                  <Meh size={30} color={colors.inkMute} />
                </View>
                <Text className="flex-1 text-base font-semibold text-ink">{t.dashboard.moodQuestion}</Text>
                <ChevronRight size={18} color={colors.inkMute} />
              </View>
            </Card>
          </Pressable>
        ) : (
          <Card>
            <View className="flex-row items-center gap-4">
              <View className="h-14 w-14 items-center justify-center rounded-2xl border border-primary-500/20 bg-primary-500/10">
                <MoodIcon mood={todayMood} size={32} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400">
                  {t.dashboard.moodQuestion}
                </Text>
                <View className="flex-row items-baseline gap-1.5">
                  <Text className="text-2xl font-bold text-ink">{todayMood}</Text>
                  <Text className="text-sm text-ink-mute">/ 10</Text>
                  <Text className="ml-1 shrink text-sm font-medium text-ink-soft" numberOfLines={1}>
                    · {getMoodBandLabel(todayMood, t)}
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.dashboard.changeMood}
                onPress={() => setMoodSheetOpen(true)}
                className="rounded-lg p-2 active:bg-raised"
              >
                <Pencil size={16} color={colors.inkMute} />
              </Pressable>
            </View>
          </Card>
        )}

        {/* Ritual row */}
        <RitualCard
          icon={BookOpen}
          tone="blue"
          title={t.dashboard.journalTitle}
          body={todayJournal ? truncate(todayJournal.content, 100) : t.dashboard.journalEmptyBody}
          done={todayJournal !== null}
          actionLabel={todayJournal ? t.dashboard.viewTodayJournal : t.dashboard.addTodayJournal}
          actionVariant={todayJournal ? "ghost" : "secondary"}
          onAction={() => router.push({ pathname: "/journal", params: { segment: "journal" } })}
          totalCount={journalCount}
          totalLabel={t.dashboard.totalCountSuffix}
        />
        <RitualCard
          icon={Moon}
          tone="purple"
          title={t.dashboard.dreamsTitle}
          body={todayDream ? truncate(todayDream.content, 100) : t.dashboard.dreamEmptyBody}
          done={todayDream !== null}
          actionLabel={todayDream ? t.dashboard.viewLastDream : t.dashboard.addTodayDream}
          actionVariant={todayDream ? "ghost" : "secondary"}
          onAction={() => router.push({ pathname: "/journal", params: { segment: "dreams" } })}
          totalCount={dreamCount}
          totalLabel={t.dashboard.totalCountSuffix}
        />

        {/* Mood history — chart only; the notebook tab already owns calendars (mobile adaptation) */}
        {showMoodHistory && (
          <Card>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center gap-2">
                <Heart size={16} color={colors.tint} />
                <Text className="text-sm font-semibold text-ink-soft">{t.dashboard.moodHistoryTitle}</Text>
              </View>
              <View className="flex-row items-center gap-0.5">
                <Pressable
                  accessibilityRole="button"
                  onPress={handlePrevMonth}
                  className="rounded-lg p-1.5 active:bg-raised"
                >
                  <ChevronLeft size={16} color={colors.inkMute} />
                </Pressable>
                <Pressable accessibilityRole="button" onPress={handleGoToToday} className="px-1.5 py-1">
                  <Text className="text-xs font-semibold capitalize text-ink-soft">
                    {formatMonthYear(currentYear, currentMonth, locale)}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleNextMonth}
                  disabled={isNextDisabled}
                  className={cn("rounded-lg p-1.5", isNextDisabled ? "opacity-30" : "active:bg-raised")}
                >
                  <ChevronRight size={16} color={colors.inkMute} />
                </Pressable>
              </View>
            </View>
            <MoodChart
              entries={currentMonthEntries}
              daysInMonth={daysInMonth}
              noDataText={t.dashboard.noDataThisMonth}
            />
          </Card>
        )}

        {/* Journey (M1: replaces desktop's stats tiles) */}
        <JourneyCard sessionCount={sessionCount} />
      </ScrollView>

      <MoodPickerSheet
        isOpen={moodSheetOpen}
        initialMood={todayMood}
        onSelect={handleMoodSelect}
        onClose={() => setMoodSheetOpen(false)}
      />
    </>
  );
}
