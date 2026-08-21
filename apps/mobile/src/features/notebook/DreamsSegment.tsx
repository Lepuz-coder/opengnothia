import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { ArrowLeft, Pencil, Plus, Sparkles, Trash2 } from "lucide-react-native";
import { getDateLocale, getDayNames, useTranslation } from "@opengnothia/shared/i18n";
import { buildDreamAnalysisPrompt, dreamPatientNotesMessage } from "@opengnothia/shared/ai/promptBuilder";
import type { Dream } from "@opengnothia/shared/types";
import { useAIErrorHandler } from "@/ai/useAIErrorHandler";
import { getQueries } from "@/db";
import { useProGate } from "@/hooks/useProGate";
import { formatDayLabel, formatTimestamp, formatYMD, getCalendarDays } from "@/lib/date";
import { showToast } from "@/stores/useToastStore";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, Card, ConfirmSheet, DataLoadError, LockBadge } from "@/ui";
import { AnalysisSheet } from "@/features/analyses/AnalysisSheet";
import { kickOffAnalysisNotes, streamAnalysisContent } from "@/features/analyses/analysisActions";
import { CalendarMonth } from "./CalendarMonth";
import { EntryComposer } from "./EntryComposer";

type SegmentView = "calendar" | "detail";

/**
 * Same shape as JournalSegment, over the dreams table — desktop keeps the two
 * pages as parallel copies too, and their analysis flows differ (dream prompt
 * takes no profile/school and the dream text itself is the user message), so
 * they are not force-merged here. Shared pieces live in CalendarMonth,
 * EntryComposer and AnalysisSheet.
 */
export function DreamsSegment() {
  const { t, language } = useTranslation();
  const locale = getDateLocale(language);
  const dayNames = getDayNames(language);
  const { colors } = useThemeColors();
  const { isPro, gate } = useProGate();
  // The analysis streams inside the pageSheet — errors there toast in place
  // instead of pushing the paywall route underneath it.
  const handleAIError = useAIErrorHandler({ modalHosted: true });

  const [view, setView] = useState<SegmentView>("calendar");
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [selected, setSelected] = useState<Dream | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());

  const [composerOpen, setComposerOpen] = useState(false);
  const [composerDate, setComposerDate] = useState<string>(formatYMD(now));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [streamContent, setStreamContent] = useState("");

  const dreamsByDate = useMemo(() => {
    const map = new Map<string, Dream>();
    for (const dream of dreams) {
      if (dream.date && !map.has(dream.date)) map.set(dream.date, dream);
    }
    return map;
  }, [dreams]);
  const markedDates = useMemo(() => new Set(dreamsByDate.keys()), [dreamsByDate]);

  const loadDreams = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const days = getCalendarDays(currentYear, currentMonth);
      const queries = await getQueries();
      const data = await queries.getDreamsByDateRange(formatYMD(days[0]), formatYMD(days[days.length - 1]));
      setDreams(data);
    } catch (err) {
      console.error("Failed to load dreams:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    void loadDreams();
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
    if (!content || saving) return;
    setSaving(true);
    try {
      const queries = await getQueries();
      if (editingId) {
        await queries.updateDreamContent(editingId, content);
        setSelected((dream) => (dream?.id === editingId ? { ...dream, content } : dream));
      } else {
        const id = await queries.saveDream(content, composerDate);
        setSelected({ id, date: composerDate, content, analysis: null, created_at: new Date().toISOString() });
      }
      setComposerOpen(false);
      setEditingId(null);
      setView("detail");
      await loadDreams();
    } catch (err) {
      console.error("Failed to save dream:", err);
      showToast(t.errors.generic, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected || deleting) return;
    setDeleting(true);
    try {
      const queries = await getQueries();
      await queries.deleteDream(selected.id);
      setDeleteOpen(false);
      setSelected(null);
      setView("calendar");
      await loadDreams();
    } catch (err) {
      console.error("Failed to delete dream:", err);
      showToast(t.errors.generic, "error");
    } finally {
      setDeleting(false);
    }
  };

  // Step 50: desktop DreamsPage's handleAnalyze over the mobile AI plumbing.
  const handleAnalyze = async (dream: Dream) => {
    if (analyzing) return;
    setAnalyzing(true);
    setStreamContent("");
    setAnalysisOpen(true);
    try {
      const queries = await getQueries();
      const patientNotes = await queries.getPatientNotes();

      const full = await streamAnalysisContent({
        messages: [
          { id: crypto.randomUUID(), role: "user", content: dream.content, timestamp: new Date().toISOString() },
        ],
        systemPrompt: buildDreamAnalysisPrompt(patientNotes, language),
        callType: "dream_analysis",
        onChunk: (chunk) => setStreamContent((prev) => prev + chunk),
        onAIError: handleAIError,
      });

      if (full !== null && full.trim().length > 0) {
        await queries.updateDreamAnalysis(dream.id, full);
        setSelected((prev) => (prev && prev.id === dream.id ? { ...prev, analysis: full } : prev));
        setDreams((current) => current.map((item) => (
          item.id === dream.id ? { ...item, analysis: full } : item
        )));
        kickOffAnalysisNotes(dreamPatientNotesMessage(dream.content, full));
      }
    } catch (err) {
      handleAIError(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzePress = () => {
    if (!selected) return;
    if (selected.analysis) {
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

  if (loadError) {
    return <DataLoadError onRetry={() => void loadDreams()} />;
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
              {selected.analysis ? t.dreams.showAnalysis : t.dreams.analyze}
            </Button>
            {!selected.analysis && <LockBadge />}
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
          confirming={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteOpen(false)}
        />

        <AnalysisSheet
          visible={analysisOpen}
          title={t.dreams.aiAnalysis}
          content={selected.analysis}
          generating={analyzing}
          streamContent={streamContent}
          generatingLabel={t.dreams.analyzing}
          generateLabel={t.dreams.analyze}
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
