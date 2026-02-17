import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation, getDayNames, getDateLocale } from "@/i18n";
import { streamMessage } from "@/services/ai/aiService";
import { AIError } from "@/services/ai/AIError";
import { getErrorDisplayInfo, type ErrorDisplayInfo } from "@/services/ai/errorMessages";
import { calculateCost } from "@/services/ai/costCalculator";
import { buildJournalAnalysisPrompt, buildPatientNotesUpdatePrompt, JOURNAL_ANALYSIS_TRIGGER, journalPatientNotesMessage } from "@/services/ai/promptBuilder";
import { takeBackgroundNotes } from "@/services/ai/backgroundNotes";
import {
  createJournalEntry,
  getJournalEntriesByDateRange,
  getJournalEntryById,
  updateJournalAnalysis,
  updateJournalEntryContent,
  deleteJournalEntry,
  getUserProfile,
  getPatientNotes,
  getPatientNotesUpdatedAt,
  saveTokenUsage,
} from "@/services/db/queries";
import { ErrorModal } from "@/components/ui/ErrorModal";
import { Plus, ArrowLeft, Trash2, Sparkles, Loader2, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { JournalEntry, AIProvider, TokenUsage } from "@/types";

type View = "calendar" | "write" | "detail";

// DAY_NAMES moved to component level using getDayNames(language)

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

async function trackUsage(
  provider: AIProvider,
  model: string,
  callType: string,
  usage: TokenUsage | null,
) {
  if (!usage) return;
  const cost = calculateCost(provider, model, usage.inputTokens, usage.outputTokens);
  await saveTokenUsage({
    session_id: null,
    provider,
    model,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    cost,
    call_type: callType,
  });
}

export default function JournalPage() {
  const settings = useSettingsStore();
  const setSidebarHidden = useAppStore((s) => s.setSidebarHidden);
  const { t, language } = useTranslation();
  const DAY_NAMES = getDayNames(language);
  const locale = getDateLocale(language);

  // View state
  const [view, setView] = useState<View>("calendar");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);

  // Calendar state
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Write form state
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorModalInfo, setErrorModalInfo] = useState<ErrorDisplayInfo | null>(null);

  // Edit state
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  // Delete state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);

  // Calendar computed values
  const calendarDays = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth]);
  const todayStr = useMemo(() => formatYMD(new Date()), []);
  const entriesByDate = useMemo(() => {
    const map = new Map<string, JournalEntry>();
    for (const entry of entries) {
      if (!map.has(entry.date)) {
        map.set(entry.date, entry);
      }
    }
    return map;
  }, [entries]);

  // Hide sidebar in write view
  useEffect(() => {
    if (view === "write") {
      setSidebarHidden(true);
    } else {
      setSidebarHidden(false);
    }
    return () => setSidebarHidden(false);
  }, [view, setSidebarHidden]);

  // Load entries for visible calendar range
  const loadEntries = useCallback(async () => {
    const days = getCalendarDays(currentYear, currentMonth);
    const startDate = formatYMD(days[0]);
    const endDate = formatYMD(days[days.length - 1]);
    const data = await getJournalEntriesByDateRange(startDate, endDate);
    setEntries(data);
    setLoading(false);
  }, [currentYear, currentMonth]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

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

  // Day click handler
  const handleDayClick = async (dateStr: string) => {
    const existingEntry = entriesByDate.get(dateStr);
    if (existingEntry) {
      await handleViewEntry(existingEntry.id);
    } else {
      setSelectedDate(dateStr);
      setContent("");
      setEditingEntryId(null);
      setView("write");
    }
  };

  // Save entry
  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      if (editingEntryId) {
        await updateJournalEntryContent(editingEntryId, content.trim());
        const updated = await getJournalEntryById(editingEntryId);
        if (updated) setSelectedEntry(updated);
        setEditingEntryId(null);
      } else {
        const entry = await createJournalEntry({
          content: content.trim(),
          mood: null,
          tags: [],
          date: selectedDate ?? undefined,
        });
        setSelectedEntry(entry);
      }
      setView("detail");
      setContent("");
      setSelectedDate(null);
      await loadEntries();
    } finally {
      setSaving(false);
    }
  };

  // View detail
  const handleViewEntry = async (id: string) => {
    const entry = await getJournalEntryById(id);
    if (entry) {
      setSelectedEntry(entry);
      setErrorModalInfo(null);
      setView("detail");
    }
  };

  // Delete entry
  const handleDelete = async () => {
    if (!selectedEntry) return;
    await deleteJournalEntry(selectedEntry.id);
    setSelectedEntry(null);
    setDeleteModalOpen(false);
    setView("calendar");
    await loadEntries();
  };

  // AI Analysis
  const handleAnalyze = async () => {
    if (!selectedEntry || isAnalyzing) return;
    setIsAnalyzing(true);
    setErrorModalInfo(null);
    setAnalysisModalOpen(true);

    try {
      const [profile, patientNotes] = await Promise.all([
        getUserProfile(),
        getPatientNotes(),
      ]);

      const analysisPrompt = buildJournalAnalysisPrompt({
        journalContent: selectedEntry.content,
        mood: selectedEntry.mood,
        tags: selectedEntry.tags,
        patientNotes,
        profile,
        therapySchool: settings.therapySchool,
        language,
      });

      let fullAnalysis = "";
      let streamUsage: TokenUsage | null = null;
      let streamError: Error | null = null;

      await streamMessage({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: [{ id: "journal-analysis", role: "user", content: JOURNAL_ANALYSIS_TRIGGER, timestamp: new Date().toISOString() }],
        systemPrompt: analysisPrompt,
        customBaseUrl: settings.customBaseUrl || undefined,
        thinkingEnabled: settings.thinkingEnabled,
        thinkingLevel: settings.thinkingLevel,
        abortSignal: new AbortController().signal,
        onThinking: () => {},
        onContent: (chunk) => {
          fullAnalysis += chunk;
          setSelectedEntry((prev) =>
            prev ? { ...prev, ai_analysis: fullAnalysis } : prev,
          );
        },
        onDone: () => {},
        onError: (err) => {
          streamError = err;
        },
        onUsage: (usage) => {
          streamUsage = usage;
        },
      });

      if (streamError) {
        throw streamError;
      }

      // Save analysis to DB
      await updateJournalAnalysis(selectedEntry.id, fullAnalysis);
      await trackUsage(settings.provider, settings.model, "journal_analysis", streamUsage);

      // Update patient notes in background
      const [existingNotes, notesUpdatedAt] = await Promise.all([getPatientNotes(), getPatientNotesUpdatedAt()]);
      const notesPrompt = buildPatientNotesUpdatePrompt(existingNotes, notesUpdatedAt);
      takeBackgroundNotes({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.memoryModel,
        messages: [{ id: "journal-notes", role: "user", content: journalPatientNotesMessage(selectedEntry.content, fullAnalysis), timestamp: new Date().toISOString() }],
        systemPrompt: notesPrompt,
        customBaseUrl: settings.customBaseUrl || undefined,
        callType: "patient_notes",
      });

      // Refresh data
      const updated = await getJournalEntryById(selectedEntry.id);
      if (updated) setSelectedEntry(updated);
      await loadEntries();
    } catch (err) {
      const statusCode = err instanceof AIError ? err.statusCode : undefined;
      setErrorModalInfo(getErrorDisplayInfo(t, statusCode, settings.provider));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ─── Loading ───
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{t.journal.title}</h1>
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{t.common.loading}</span>
        </div>
      </div>
    );
  }

  // ─── Write View ───
  if (view === "write") {
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const dateLabel = (() => {
      const d = selectedDate ? new Date(selectedDate + "T00:00:00") : new Date();
      return d.toLocaleDateString(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    })();

    return (
      <div className="flex flex-col h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <button
            onClick={() => { if (editingEntryId) { setEditingEntryId(null); setContent(""); setView("detail"); } else { setSelectedDate(null); setView("calendar"); } }}
            className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.common.back}
          </button>
          <span className="text-sm text-[var(--text-muted)] capitalize">{dateLabel}</span>
          <Button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            size="sm"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.common.saving}
              </span>
            ) : (
              t.common.save
            )}
          </Button>
        </div>

        {/* Writing area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-10">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.journal.placeholder}
              autoFocus
              className="w-full bg-transparent text-[var(--text-primary)] text-lg leading-relaxed placeholder:text-[var(--text-muted)]/40 resize-none focus:outline-none"
              style={{ minHeight: "calc(100vh - 180px)" }}
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-[var(--border-color)]">
          <span className="text-xs text-[var(--text-muted)]">
            {wordCount} {t.common.words}
          </span>
        </div>
      </div>
    );
  }

  // ─── Detail View ───
  if (view === "detail" && selectedEntry) {
    const isBusy = isAnalyzing;

    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => { if (!isBusy) { setView("calendar"); setSelectedEntry(null); setErrorModalInfo(null); } }}
          disabled={isBusy}
          className={`flex items-center gap-1.5 text-sm transition-colors mb-6 ${isBusy ? "text-[var(--text-muted)] opacity-50 cursor-not-allowed" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
        >
          <ArrowLeft className="w-4 h-4" />
          {t.common.back}
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t.journal.detail}</h1>
            <p className="text-sm text-[var(--text-muted)]">
              {new Date(selectedEntry.created_at.includes("T") ? selectedEntry.created_at : selectedEntry.created_at + "Z").toLocaleString(locale, {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setContent(selectedEntry.content); setEditingEntryId(selectedEntry.id); setView("write"); }}
              disabled={isBusy}
            >
              <Pencil className="w-4 h-4" />
              {t.common.edit}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (selectedEntry.ai_analysis) {
                  setAnalysisModalOpen(true);
                } else {
                  handleAnalyze();
                }
              }}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.journal.analyzing}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {selectedEntry.ai_analysis ? t.journal.showAnalysis : t.journal.analyze}
                </span>
              )}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
              disabled={isBusy}
            >
              <Trash2 className="w-4 h-4" />
              {t.common.delete}
            </Button>
          </div>
        </div>

        {/* Entry content */}
        <Card>
          {(selectedEntry.mood !== null || selectedEntry.tags.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {selectedEntry.mood !== null && (
                <Badge variant="default">{t.journal.mood}: {selectedEntry.mood}/10</Badge>
              )}
              {selectedEntry.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <p className="text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{selectedEntry.content}</p>
        </Card>

        {/* Analysis modal */}
        <Modal
          isOpen={analysisModalOpen}
          onClose={() => { if (!isBusy) setAnalysisModalOpen(false); }}
          title={t.journal.aiAnalysis}
          className="max-w-2xl max-h-[80vh] flex flex-col"
        >
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            {selectedEntry.ai_analysis ? (
              <div
                className="prose prose-invert prose-sm max-w-none text-[var(--text-primary)] [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-semibold [&_h3]:font-medium [&_strong]:text-[var(--text-primary)] [&_p]:text-[var(--text-secondary)] [&_li]:text-[var(--text-secondary)] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedEntry.ai_analysis}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
              </div>
            )}
          </div>

        </Modal>

        {/* API Error Modal */}
        <ErrorModal
          isOpen={errorModalInfo !== null}
          onClose={() => setErrorModalInfo(null)}
          title={errorModalInfo?.title ?? ""}
          message={errorModalInfo?.message ?? ""}
          showSettingsLink={errorModalInfo?.showSettingsLink ?? false}
          onGoToSettings={() => { setErrorModalInfo(null); setView("calendar"); }}
        />

        {/* Delete confirmation modal */}
        <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title={t.journal.deleteEntry}>
          <p className="text-[var(--text-secondary)] mb-6">
            {t.journal.deleteEntryConfirm}
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              {t.journal.yesDelete}
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  // ─── Calendar View (default) ───
  const isNextDisabled = currentYear === new Date().getFullYear() && currentMonth >= new Date().getMonth();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t.journal.title}</h1>
          <p className="text-sm text-[var(--text-muted)]">{t.journal.description}</p>
        </div>
        <Button onClick={() => handleDayClick(todayStr)}>
          <Plus className="w-4 h-4" />
          {t.journal.writeToday}
        </Button>
      </div>

      {/* Month navigation */}
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
          {formatMonthYear(currentYear, currentMonth, locale)}
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

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-center text-xs font-medium text-[var(--text-muted)] py-2">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map((day) => {
          const dateStr = formatYMD(day);
          const isCurrentMonth = day.getMonth() === currentMonth;
          const isToday = dateStr === todayStr;
          const isFuture = dateStr > todayStr;
          const entry = entriesByDate.get(dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => !isFuture && isCurrentMonth && handleDayClick(dateStr)}
              disabled={isFuture || !isCurrentMonth}
              className={cn(
                "relative min-h-[100px] p-2 rounded-xl border text-left transition-all duration-200 flex flex-col",
                isCurrentMonth
                  ? "bg-[var(--bg-secondary)] border-[var(--border-color)]"
                  : "bg-[var(--bg-primary)] border-transparent opacity-30",
                isToday && "ring-2 ring-primary-500/50 border-primary-500/30",
                !isFuture && isCurrentMonth && "hover:border-[var(--text-muted)] cursor-pointer",
                isFuture && isCurrentMonth && "opacity-40 cursor-not-allowed",
              )}
            >
              {/* Date number */}
              <span className={cn(
                "text-xs font-bold",
                isToday ? "text-primary-400" : isCurrentMonth ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
              )}>
                {day.getDate()}
              </span>

              {/* Entry preview */}
              {entry && (
                <div className="mt-1 flex-1 min-w-0">
                  <p className="text-[10px] text-[var(--text-secondary)] line-clamp-3 leading-tight">
                    {entry.content.length > 60 ? entry.content.slice(0, 60) + "..." : entry.content}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {entry.mood !== null && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                        {entry.mood}/10
                      </span>
                    )}
                    {entry.ai_analysis && (
                      <Sparkles className="w-3 h-3 text-primary-400" />
                    )}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
