import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { ArrowLeft, Pencil, Plus, Sparkles, Trash2 } from "lucide-react-native";
import { getDateLocale, getDayNames, useTranslation } from "@opengnothia/shared/i18n";
import {
  JOURNAL_ANALYSIS_TRIGGER,
  buildJournalAnalysisPrompt,
  journalPatientNotesMessage,
} from "@opengnothia/shared/ai/promptBuilder";
import type { JournalEntry } from "@opengnothia/shared/types";
import { useAIErrorHandler } from "@/ai/useAIErrorHandler";
import { getQueries } from "@/db";
import { useProGate } from "@/hooks/useProGate";
import { formatDayLabel, formatTimestamp, formatYMD, getCalendarDays } from "@/lib/date";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useThemeColors } from "@/theme/useAppTheme";
import { Badge, Button, Card, ConfirmSheet, LockBadge } from "@/ui";
import { AnalysisSheet } from "@/features/analyses/AnalysisSheet";
import { kickOffAnalysisNotes, streamAnalysisContent } from "@/features/analyses/analysisActions";
import { CalendarMonth } from "./CalendarMonth";
import { EntryComposer } from "./EntryComposer";

type SegmentView = "calendar" | "detail";

/**
 * RN re-interpretation of desktop's JournalPage: calendar → write (page
 * sheet) → detail with edit/delete, plus the Faz 6 AI analysis — badged for
 * free users (M3), streamed into the analysis sheet, then kept readable
 * without a subscription (M4).
 */
export function JournalSegment() {
  const { t, language } = useTranslation();
  const locale = getDateLocale(language);
  const dayNames = getDayNames(language);
  const { colors } = useThemeColors();
  const { isPro, gate } = useProGate();
  // The analysis streams inside the pageSheet — errors there toast in place
  // instead of pushing the paywall route underneath it.
  const handleAIError = useAIErrorHandler({ modalHosted: true });

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

  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [streamContent, setStreamContent] = useState("");

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

  // Step 49: desktop JournalPage's handleAnalyze over the mobile AI plumbing.
  const handleAnalyze = async (entry: JournalEntry) => {
    if (analyzing) return;
    setAnalyzing(true);
    setStreamContent("");
    setAnalysisOpen(true);
    try {
      const queries = await getQueries();
      const [profile, patientNotes] = await Promise.all([queries.getUserProfile(), queries.getPatientNotes()]);
      const analysisPrompt = buildJournalAnalysisPrompt({
        journalContent: entry.content,
        mood: entry.mood,
        tags: entry.tags,
        patientNotes,
        profile,
        therapySchool: useSettingsStore.getState().schoolId ?? undefined,
        language,
      });

      const full = await streamAnalysisContent({
        messages: [
          { id: "journal-analysis", role: "user", content: JOURNAL_ANALYSIS_TRIGGER, timestamp: new Date().toISOString() },
        ],
        systemPrompt: analysisPrompt,
        callType: "journal_analysis",
        onChunk: (chunk) => setStreamContent((prev) => prev + chunk),
        onAIError: handleAIError,
      });

      if (full !== null && full.trim().length > 0) {
        await queries.updateJournalAnalysis(entry.id, full);
        setSelected((prev) => (prev && prev.id === entry.id ? { ...prev, ai_analysis: full } : prev));
        kickOffAnalysisNotes(journalPatientNotesMessage(entry.content, full));
        // Refresh the calendar cache so re-opening this day carries the analysis.
        await loadEntries();
      }
    } catch (err) {
      handleAIError(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzePress = () => {
    if (!selected) return;
    if (selected.ai_analysis) {
      // Reading an existing analysis is free (M4).
      setAnalysisOpen(true);
      return;
    }
    gate(() => void handleAnalyze(selected));
  };

  // The sheet's retry (only reachable after a failed run): same gate, but a
  // paywall route would present below the open sheet — close it first.
  const handleSheetGeneratePress = () => {
    if (!selected) return;
    if (isPro) {
      void handleAnalyze(selected);
      return;
    }
    setAnalysisOpen(false);
    setTimeout(() => gate(() => undefined), 400);
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

          <View className="flex-row flex-wrap items-center gap-2">
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
            <Button size="sm" icon={<Sparkles size={16} color="#fff" />} onPress={handleAnalyzePress}>
              {selected.ai_analysis ? t.journal.showAnalysis : t.journal.analyze}
            </Button>
            {!selected.ai_analysis && <LockBadge />}
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
          label={formatDayLabel(composerDate, locale)}
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

        <AnalysisSheet
          visible={analysisOpen}
          title={t.journal.aiAnalysis}
          content={selected.ai_analysis}
          generating={analyzing}
          streamContent={streamContent}
          generatingLabel={t.journal.analyzing}
          generateLabel={t.journal.analyze}
          onGeneratePress={handleSheetGeneratePress}
          onClose={() => setAnalysisOpen(false)}
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
        label={formatDayLabel(composerDate, locale)}
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
