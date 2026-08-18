import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react-native";
import { getDateLocale, getDayNames, useTranslation } from "@opengnothia/shared/i18n";
import type { JournalEntry } from "@opengnothia/shared/types";
import { getQueries } from "@/db";
import { formatDayLabel, formatTimestamp, formatYMD, getCalendarDays } from "@/lib/date";
import { useThemeColors } from "@/theme/useAppTheme";
import { Badge, Button, Card, ConfirmSheet } from "@/ui";
import { CalendarMonth } from "./CalendarMonth";
import { EntryComposer } from "./EntryComposer";

type SegmentView = "calendar" | "detail";

/**
 * RN re-interpretation of desktop's JournalPage manual flows: calendar →
 * write (page sheet) → detail, plus edit and delete. The AI analysis button
 * deliberately does not exist yet — Faz 6 adds it with its LockBadge (M3).
 */
export function JournalSegment() {
  const { t, language } = useTranslation();
  const locale = getDateLocale(language);
  const dayNames = getDayNames(language);
  const { colors } = useThemeColors();

  const [view, setView] = useState<SegmentView>("calendar");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selected, setSelected] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());

  const [composerOpen, setComposerOpen] = useState(false);
  const [composerDate, setComposerDate] = useState<string>(formatYMD(now));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, JournalEntry>();
    for (const entry of entries) {
      if (!map.has(entry.date)) map.set(entry.date, entry);
    }
    return map;
  }, [entries]);
  const markedDates = useMemo(() => new Set(entriesByDate.keys()), [entriesByDate]);

  const loadEntries = useCallback(async () => {
    const days = getCalendarDays(currentYear, currentMonth);
    const queries = await getQueries();
    const data = await queries.getJournalEntriesByDateRange(formatYMD(days[0]), formatYMD(days[days.length - 1]));
    setEntries(data);
    setLoading(false);
  }, [currentYear, currentMonth]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

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
    const today = new Date();
    if (currentYear === today.getFullYear() && currentMonth >= today.getMonth()) return;
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

  const handleDayPress = (dateStr: string) => {
    const existing = entriesByDate.get(dateStr);
    if (existing) {
      setSelected(existing);
      setView("detail");
    } else {
      setComposerDate(dateStr);
      setEditingId(null);
      setComposerOpen(true);
    }
  };

  const handleSave = async (content: string) => {
    if (!content) return;
    setSaving(true);
    try {
      const queries = await getQueries();
      if (editingId) {
        await queries.updateJournalEntryContent(editingId, content);
        const updated = await queries.getJournalEntryById(editingId);
        if (updated) setSelected(updated);
      } else {
        const entry = await queries.createJournalEntry({ content, mood: null, tags: [], date: composerDate });
        setSelected(entry);
      }
      setComposerOpen(false);
      setEditingId(null);
      setView("detail");
      await loadEntries();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    const queries = await getQueries();
    await queries.deleteJournalEntry(selected.id);
    setDeleteOpen(false);
    setSelected(null);
    setView("calendar");
    await loadEntries();
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  // ─── Detail ───
  if (view === "detail" && selected) {
    return (
      <>
        <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 py-4">
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setView("calendar");
              setSelected(null);
            }}
            className="flex-row items-center gap-1.5 self-start rounded-lg py-1 pr-2 active:opacity-60"
          >
            <ArrowLeft size={16} color={colors.inkMute} />
            <Text className="text-sm text-ink-mute">{t.common.back}</Text>
          </Pressable>

          <View>
            <Text className="text-xl font-bold text-ink">{t.journal.detail}</Text>
            <Text className="mt-0.5 text-sm text-ink-mute">{formatTimestamp(selected.created_at, locale)}</Text>
          </View>

          <View className="flex-row gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Pencil size={16} color={colors.ink} />}
              onPress={() => {
                setComposerDate(selected.date);
                setEditingId(selected.id);
                setComposerOpen(true);
              }}
            >
              {t.common.edit}
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={16} color="#fff" />}
              onPress={() => setDeleteOpen(true)}
            >
              {t.common.delete}
            </Button>
          </View>

          <Card>
            {(selected.mood !== null || selected.tags.length > 0) && (
              <View className="mb-3 flex-row flex-wrap items-center gap-2">
                {selected.mood !== null && <Badge label={`${t.journal.mood}: ${selected.mood}/10`} />}
                {selected.tags.map((tag) => (
                  <Badge key={tag} label={tag} />
                ))}
              </View>
            )}
            <Text className="text-base leading-relaxed text-ink">{selected.content}</Text>
          </Card>
        </ScrollView>

        <EntryComposer
          visible={composerOpen}
          dateLabel={formatDayLabel(composerDate, locale)}
          placeholder={t.journal.placeholder}
          initialContent={editingId ? selected.content : ""}
          saving={saving}
          onClose={() => {
            setComposerOpen(false);
            setEditingId(null);
          }}
          onSave={handleSave}
        />

        <ConfirmSheet
          isOpen={deleteOpen}
          title={t.journal.deleteEntry}
          message={t.journal.deleteEntryConfirm}
          confirmLabel={t.journal.yesDelete}
          onConfirm={handleDelete}
          onClose={() => setDeleteOpen(false)}
        />
      </>
    );
  }

  // ─── Calendar (default) ───
  return (
    <>
      <ScrollView className="flex-1" contentContainerClassName="px-4 py-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="flex-1 pr-3 text-sm text-ink-mute" numberOfLines={1}>
            {t.journal.description}
          </Text>
          <Button size="sm" icon={<Plus size={16} color="#fff" />} onPress={() => handleDayPress(formatYMD(new Date()))}>
            {t.journal.writeToday}
          </Button>
        </View>

        <CalendarMonth
          year={currentYear}
          month={currentMonth}
          dayNames={dayNames}
          locale={locale}
          markedDates={markedDates}
          onDayPress={handleDayPress}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onGoToToday={handleGoToToday}
        />
      </ScrollView>

      <EntryComposer
        visible={composerOpen}
        dateLabel={formatDayLabel(composerDate, locale)}
        placeholder={t.journal.placeholder}
        initialContent=""
        saving={saving}
        onClose={() => {
          setComposerOpen(false);
          setEditingId(null);
        }}
        onSave={handleSave}
      />
    </>
  );
}
