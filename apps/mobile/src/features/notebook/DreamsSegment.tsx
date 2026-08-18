import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react-native";
import { getDateLocale, getDayNames, useTranslation } from "@opengnothia/shared/i18n";
import type { Dream } from "@opengnothia/shared/types";
import { getQueries } from "@/db";
import { formatDayLabel, formatTimestamp, formatYMD, getCalendarDays } from "@/lib/date";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, Card, ConfirmSheet } from "@/ui";
import { CalendarMonth } from "./CalendarMonth";
import { EntryComposer } from "./EntryComposer";

type SegmentView = "calendar" | "detail";

/**
 * Same shape as JournalSegment, over the dreams table — desktop keeps the two
 * pages as parallel copies too, and Faz 6 grows them apart (different
 * analysis flows), so they are not force-merged here. Shared pieces live in
 * CalendarMonth and EntryComposer.
 */
export function DreamsSegment() {
  const { t, language } = useTranslation();
  const locale = getDateLocale(language);
  const dayNames = getDayNames(language);
  const { colors } = useThemeColors();

  const [view, setView] = useState<SegmentView>("calendar");
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [selected, setSelected] = useState<Dream | null>(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());

  const [composerOpen, setComposerOpen] = useState(false);
  const [composerDate, setComposerDate] = useState<string>(formatYMD(now));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const dreamsByDate = useMemo(() => {
    const map = new Map<string, Dream>();
    for (const dream of dreams) {
      if (dream.date && !map.has(dream.date)) map.set(dream.date, dream);
    }
    return map;
  }, [dreams]);
  const markedDates = useMemo(() => new Set(dreamsByDate.keys()), [dreamsByDate]);

  const loadDreams = useCallback(async () => {
    const days = getCalendarDays(currentYear, currentMonth);
    const queries = await getQueries();
    const data = await queries.getDreamsByDateRange(formatYMD(days[0]), formatYMD(days[days.length - 1]));
    setDreams(data);
    setLoading(false);
  }, [currentYear, currentMonth]);

  useEffect(() => {
    loadDreams();
  }, [loadDreams]);

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
    const existing = dreamsByDate.get(dateStr);
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
        await queries.updateDreamContent(editingId, content);
        const updated = await queries.getDreamById(editingId);
        if (updated) setSelected(updated);
      } else {
        const id = await queries.saveDream(content, composerDate);
        const dream = await queries.getDreamById(id);
        if (dream) setSelected(dream);
      }
      setComposerOpen(false);
      setEditingId(null);
      setView("detail");
      await loadDreams();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    const queries = await getQueries();
    await queries.deleteDream(selected.id);
    setDeleteOpen(false);
    setSelected(null);
    setView("calendar");
    await loadDreams();
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
            <Text className="text-xl font-bold text-ink">{t.dreams.detail}</Text>
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
            <Text className="text-base leading-relaxed text-ink">{selected.content}</Text>
          </Card>
        </ScrollView>

        <EntryComposer
          visible={composerOpen}
          label={formatDayLabel(composerDate, locale)}
          placeholder={t.dreams.placeholder}
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
          title={t.dreams.deleteDream}
          message={t.dreams.deleteDreamConfirm}
          confirmLabel={t.dreams.yesDelete}
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
            {t.dreams.description}
          </Text>
          <Button size="sm" icon={<Plus size={16} color="#fff" />} onPress={() => handleDayPress(formatYMD(new Date()))}>
            {t.dreams.writeToday}
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
        label={formatDayLabel(composerDate, locale)}
        placeholder={t.dreams.placeholder}
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
