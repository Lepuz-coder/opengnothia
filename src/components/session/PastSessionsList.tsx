import { useEffect, useState, useMemo, useCallback, forwardRef, useImperativeHandle } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Clock, ChevronLeft, ChevronRight, MessageCircle, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { streamMessage } from "@/services/ai/aiService";
import { calculateCost } from "@/services/ai/costCalculator";
import { buildWeeklySummaryPrompt } from "@/services/ai/promptBuilder";
import { getCompletedSessions, getWeeklySummary, saveWeeklySummary, getUserProfile, getPatientNotes, saveTokenUsage } from "@/services/db/queries";
import type { Session, AIProvider, TokenUsage, WeeklySummary } from "@/types";

export interface WeekSummaryInfo {
  weekSessionCount: number;
  hasWeeklySummary: boolean;
  summaryLoading: boolean;
  generating: boolean;
}

export interface PastSessionsListHandle {
  generateSummary: () => void;
  showSummary: () => void;
}

interface PastSessionsListProps {
  onViewSession: (sessionId: string) => void;
  onWeekSummaryInfoChange?: (info: WeekSummaryInfo) => void;
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

function formatDateYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function trackWeeklySummaryUsage(
  provider: AIProvider,
  model: string,
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
    call_type: "weekly_summary",
  });
}

export const PastSessionsList = forwardRef<PastSessionsListHandle, PastSessionsListProps>(
  function PastSessionsList({ onViewSession, onWeekSummaryInfoChange }, ref) {
    const [sessions, setSessions] = useState<Omit<Session, "messages">[]>([]);
    const [weekOffset, setWeekOffset] = useState(0);
    const settings = useSettingsStore();

    // Weekly summary state
    const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [streamContent, setStreamContent] = useState("");
    const [summaryModalOpen, setSummaryModalOpen] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);

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

    const weekMondayStr = useMemo(() => formatDateYMD(monday), [monday]);

    const weekSessionCount = useMemo(() => {
      return Object.values(sessionsByDay).reduce((sum, arr) => sum + arr.length, 0);
    }, [sessionsByDay]);

    // Load existing weekly summary when week changes
    useEffect(() => {
      setSummaryLoading(true);
      setWeeklySummary(null);
      setSummaryError(null);
      setStreamContent("");
      getWeeklySummary(weekMondayStr).then((s) => {
        setWeeklySummary(s);
        setSummaryLoading(false);
      });
    }, [weekMondayStr]);

    // Notify parent of week summary info changes
    useEffect(() => {
      onWeekSummaryInfoChange?.({
        weekSessionCount,
        hasWeeklySummary: !!weeklySummary,
        summaryLoading,
        generating,
      });
    }, [weekSessionCount, weeklySummary, summaryLoading, generating, onWeekSummaryInfoChange]);

    const handleGenerateSummary = useCallback(async () => {
      if (generating) return;
      setGenerating(true);
      setSummaryError(null);
      setStreamContent("");
      setSummaryModalOpen(true);

      try {
        const [profile, patientNotes] = await Promise.all([
          getUserProfile(),
          getPatientNotes(),
        ]);

        // Collect all session summaries for this week
        const allWeekSessions: { date: string; summary: any; summaryNarrative: string | null }[] = [];
        for (let i = 0; i < 7; i++) {
          for (const s of sessionsByDay[i]) {
            const sessionDate = new Date(s.started_at);
            allWeekSessions.push({
              date: sessionDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" }),
              summary: s.summary,
              summaryNarrative: s.summary_narrative ?? null,
            });
          }
        }

        const weekRange = formatWeekRange(monday);
        const prompt = buildWeeklySummaryPrompt({
          weekRange,
          sessions: allWeekSessions,
          patientNotes,
          profile,
        });

        let fullContent = "";
        const abortController = new AbortController();

        await streamMessage({
          provider: settings.provider,
          apiKey: settings.apiKey,
          model: settings.model,
          messages: [
            {
              id: crypto.randomUUID(),
              role: "user",
              content: "Haftalık özet oluştur.",
              timestamp: new Date().toISOString(),
            },
          ],
          systemPrompt: prompt,
          customBaseUrl: settings.customBaseUrl || undefined,
          thinkingEnabled: false,
          abortSignal: abortController.signal,
          onThinking: () => {},
          onContent: (chunk) => {
            fullContent += chunk;
            setStreamContent(fullContent);
          },
          onDone: () => {},
          onError: (err) => {
            setSummaryError(err.message);
          },
          onUsage: (usage) => {
            trackWeeklySummaryUsage(settings.provider, settings.model, usage);
          },
        });

        if (fullContent.trim().length > 0) {
          await saveWeeklySummary(weekMondayStr, fullContent, weekSessionCount);
          setWeeklySummary({
            id: "",
            week_start: weekMondayStr,
            content: fullContent,
            session_count: weekSessionCount,
            created_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        setSummaryError(err instanceof Error ? err.message : "Bir hata oluştu. Lütfen API ayarlarını kontrol et.");
      } finally {
        setGenerating(false);
      }
    }, [generating, sessionsByDay, monday, weekMondayStr, weekSessionCount, settings]);

    const handleShowSummary = useCallback(() => {
      if (weeklySummary) {
        setStreamContent(weeklySummary.content);
        setSummaryModalOpen(true);
      }
    }, [weeklySummary]);

    // Expose actions to parent via ref
    useImperativeHandle(ref, () => ({
      generateSummary: handleGenerateSummary,
      showSummary: handleShowSummary,
    }), [handleGenerateSummary, handleShowSummary]);

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

        {/* Weekly Summary Modal */}
        <Modal
          isOpen={summaryModalOpen}
          onClose={() => { if (!generating) setSummaryModalOpen(false); }}
          title={`Haftalık Özet — ${formatWeekRange(monday)}`}
        >
          <div className="max-h-[60vh] overflow-y-auto">
            {streamContent ? (
              <div className="text-sm text-[var(--text-secondary)] leading-relaxed markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {streamContent}
                </ReactMarkdown>
                {generating && (
                  <span className="inline-block w-1.5 h-3.5 bg-[var(--text-primary)] ml-0.5 animate-pulse" />
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
              </div>
            )}
          </div>
          {summaryError && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{summaryError}</p>
            </div>
          )}
        </Modal>
      </div>
    );
  }
);
