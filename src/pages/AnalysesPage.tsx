import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ErrorModal } from "@/components/ui/ErrorModal";
import { cn } from "@/lib/cn";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTranslation } from "@/i18n";
import { streamMessage } from "@/services/ai/aiService";
import { AIError } from "@/services/ai/AIError";
import { getErrorDisplayInfo, type ErrorDisplayInfo } from "@/services/ai/errorMessages";
import { calculateCost } from "@/services/ai/costCalculator";
import { buildMilestoneAnalysisPrompt } from "@/services/ai/promptBuilder";
import {
  getCompletedSessionCount,
  getCompletedSessions,
  getPatientNotes,
  getUserProfile,
  getDreamCount,
  getJournalEntryCount,
  getMilestoneAnalysis,
  saveMilestoneAnalysis,
  saveTokenUsage,
} from "@/services/db/queries";
import { Sparkles, Lock, CheckCircle2, Loader2, Trophy, MessageSquare, BookOpen, Moon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AIProvider, TokenUsage } from "@/types";
import type { Translations } from "@/i18n";

const MILESTONES = [7, 15, 30, 60, 120, 180, 240, 365] as const;
type Milestone = (typeof MILESTONES)[number];

type AnalysesKey = keyof Translations["analyses"];

interface MilestoneDef {
  sessions: Milestone;
  emoji: string;
  nameKey: AnalysesKey;
  descKey: AnalysesKey;
}

const MILESTONE_DEFS: MilestoneDef[] = [
  { sessions: 7, emoji: "🌱", nameKey: "milestone7", descKey: "milestone7Desc" },
  { sessions: 15, emoji: "🔍", nameKey: "milestone15", descKey: "milestone15Desc" },
  { sessions: 30, emoji: "🧭", nameKey: "milestone30", descKey: "milestone30Desc" },
  { sessions: 60, emoji: "🦋", nameKey: "milestone60", descKey: "milestone60Desc" },
  { sessions: 120, emoji: "🌳", nameKey: "milestone120", descKey: "milestone120Desc" },
  { sessions: 180, emoji: "🪞", nameKey: "milestone180", descKey: "milestone180Desc" },
  { sessions: 240, emoji: "✨", nameKey: "milestone240", descKey: "milestone240Desc" },
  { sessions: 365, emoji: "🏔️", nameKey: "milestone365", descKey: "milestone365Desc" },
];

function getAnalysesText(t: Translations, key: AnalysesKey): string {
  return t.analyses[key];
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

export default function AnalysesPage() {
  const settings = useSettingsStore();
  const { t } = useTranslation();

  const [sessionCount, setSessionCount] = useState(0);
  const [dreamCount, setDreamCount] = useState(0);
  const [journalCount, setJournalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<string>("");
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);
  const [cachedAnalyses, setCachedAnalyses] = useState<Map<number, string>>(new Map());
  const [errorModalInfo, setErrorModalInfo] = useState<ErrorDisplayInfo | null>(null);

  useEffect(() => {
    async function loadData() {
      const [sessions, dreams, journal] = await Promise.all([
        getCompletedSessionCount(),
        getDreamCount(),
        getJournalEntryCount(),
      ]);
      setSessionCount(sessions);
      setDreamCount(dreams);
      setJournalCount(journal);

      // Load cached analyses for completed milestones
      const cached = new Map<number, string>();
      for (const m of MILESTONES) {
        if (sessions >= m) {
          const existing = await getMilestoneAnalysis(m);
          if (existing) cached.set(m, existing.content);
        }
      }
      setCachedAnalyses(cached);
      setLoading(false);
    }
    loadData();
  }, []);

  const nextMilestone = useMemo(() => {
    return MILESTONE_DEFS.find((m) => sessionCount < m.sessions) ?? null;
  }, [sessionCount]);

  const handleShowAnalysis = async (milestone: Milestone) => {
    const cached = cachedAnalyses.get(milestone);
    if (cached) {
      setCurrentAnalysis(cached);
      setCurrentMilestone(milestone);
      setAnalysisModalOpen(true);
      return;
    }
    await handleGenerateAnalysis(milestone);
  };

  const handleGenerateAnalysis = async (milestone: Milestone) => {
    setAnalyzing(true);
    setCurrentMilestone(milestone);
    setCurrentAnalysis("");
    setErrorModalInfo(null);
    setAnalysisModalOpen(true);

    try {
      const [patientNotes, sessions, profile] = await Promise.all([
        getPatientNotes(),
        getCompletedSessions(),
        getUserProfile(),
      ]);

      const sessionSummaries = sessions.map((s) => ({
        date: s.started_at ? new Date(s.started_at).toLocaleDateString() : "Unknown",
        narrative: s.summary_narrative ?? null,
        summary: s.summary ?? null,
      }));

      const prompt = buildMilestoneAnalysisPrompt({
        milestone,
        patientNotes,
        sessionSummaries,
        profile,
        totalSessions: sessionCount,
        language: settings.language,
      });

      let fullAnalysis = "";
      let streamUsage: TokenUsage | null = null;
      let streamError: Error | null = null;

      await streamMessage({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: [
          {
            id: crypto.randomUUID(),
            role: "user",
            content: `Generate my ${milestone}-session milestone analysis.`,
            timestamp: new Date().toISOString(),
          },
        ],
        systemPrompt: prompt,
        customBaseUrl: settings.customBaseUrl || undefined,
        thinkingEnabled: false,
        onThinking: () => {},
        onContent: (chunk) => {
          fullAnalysis += chunk;
          setCurrentAnalysis(fullAnalysis);
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

      await saveMilestoneAnalysis(milestone, fullAnalysis);
      await trackUsage(settings.provider, settings.model, "milestone_analysis", streamUsage);

      setCachedAnalyses((prev) => {
        const next = new Map(prev);
        next.set(milestone, fullAnalysis);
        return next;
      });
    } catch (err) {
      const statusCode = err instanceof AIError ? err.statusCode : undefined;
      setErrorModalInfo(getErrorDisplayInfo(t, statusCode, settings.provider));
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{t.analyses.title}</h1>
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{t.common.loading}</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (sessionCount === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t.analyses.title}</h1>
          <p className="text-sm text-[var(--text-muted)]">{t.analyses.description}</p>
        </div>
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              {t.analyses.noSessionsYet}
            </h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md">
              {t.analyses.noSessionsDescription}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t.analyses.title}</h1>
        <p className="text-sm text-[var(--text-muted)]">{t.analyses.description}</p>
      </div>

      {/* Next Goal Card */}
      {nextMilestone && (
        <Card>
          <div className="flex items-start gap-4">
            <div className="text-3xl">{nextMilestone.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-primary-400 uppercase tracking-wide">
                  {t.analyses.nextGoal}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                {getAnalysesText(t, nextMilestone.nameKey)}
              </h3>
              <p className="text-sm text-[var(--text-muted)] mb-3">
                {nextMilestone.sessions - sessionCount} {t.analyses.sessionsToGo}
              </p>
              {/* Progress bar */}
              <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2.5">
                <div
                  className="bg-primary-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((sessionCount / nextMilestone.sessions) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-[var(--text-muted)]">
                  {sessionCount} / {nextMilestone.sessions}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {Math.round((sessionCount / nextMilestone.sessions) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-4 mb-6">
        <Card>
          <div className="flex flex-col items-center py-1">
            <MessageSquare className="w-4 h-4 text-primary-400 mb-1.5" />
            <span className="text-xl font-bold text-[var(--text-primary)]">{sessionCount}</span>
            <span className="text-xs text-[var(--text-muted)]">{t.analyses.totalSessions}</span>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col items-center py-1">
            <BookOpen className="w-4 h-4 text-primary-400 mb-1.5" />
            <span className="text-xl font-bold text-[var(--text-primary)]">{journalCount}</span>
            <span className="text-xs text-[var(--text-muted)]">{t.analyses.totalJournal}</span>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col items-center py-1">
            <Moon className="w-4 h-4 text-primary-400 mb-1.5" />
            <span className="text-xl font-bold text-[var(--text-primary)]">{dreamCount}</span>
            <span className="text-xs text-[var(--text-muted)]">{t.analyses.totalDreams}</span>
          </div>
        </Card>
      </div>

      {/* Milestones */}
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        {t.analyses.milestones}
      </h2>

      <div className="space-y-3">
        {MILESTONE_DEFS.map((m) => {
          const isCompleted = sessionCount >= m.sessions;
          const progress = Math.min((sessionCount / m.sessions) * 100, 100);
          const hasCachedAnalysis = cachedAnalyses.has(m.sessions);
          const remaining = m.sessions - sessionCount;

          return (
            <Card key={m.sessions}>
              <div className="flex items-start gap-4">
                {/* Emoji */}
                <div
                  className={cn(
                    "text-2xl transition-all",
                    !isCompleted && "grayscale opacity-50",
                  )}
                >
                  {m.emoji}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={cn(
                          "font-semibold",
                          isCompleted ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]",
                        )}
                      >
                        {getAnalysesText(t, m.nameKey)}
                      </h3>
                      {isCompleted && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                      {!isCompleted && (
                        <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isCompleted ? "text-green-500" : "text-[var(--text-muted)]",
                      )}
                    >
                      {Math.min(sessionCount, m.sessions)} / {m.sessions}
                    </span>
                  </div>

                  <p
                    className={cn(
                      "text-sm mb-3",
                      isCompleted ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]",
                    )}
                  >
                    {getAnalysesText(t, m.descKey)}
                  </p>

                  {/* Progress bar */}
                  <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all duration-500",
                        isCompleted ? "bg-green-500" : "bg-primary-500",
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Action area */}
                  <div className="mt-3">
                    {isCompleted ? (
                      <Button
                        size="sm"
                        onClick={() => handleShowAnalysis(m.sessions)}
                        disabled={analyzing}
                      >
                        {analyzing && currentMilestone === m.sessions ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t.analyses.analyzing}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            {hasCachedAnalysis ? t.analyses.showAnalysis : t.analyses.generateAnalysis}
                          </span>
                        )}
                      </Button>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                        <Lock className="w-3 h-3" />
                        {remaining} {t.analyses.sessionsToGo}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Analysis Modal */}
      <Modal
        isOpen={analysisModalOpen}
        onClose={() => {
          if (!analyzing) setAnalysisModalOpen(false);
        }}
        title={
          currentMilestone
            ? `${MILESTONE_DEFS.find((m) => m.sessions === currentMilestone)?.emoji ?? ""} ${getAnalysesText(t, MILESTONE_DEFS.find((m) => m.sessions === currentMilestone)?.nameKey ?? "milestone7")}`
            : t.analyses.aiAnalysis
        }
        className="max-w-2xl max-h-[80vh] flex flex-col"
      >
        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          {currentAnalysis ? (
            <div className="dream-analysis-content py-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentAnalysis}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
            </div>
          )}
        </div>
      </Modal>

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModalInfo !== null}
        onClose={() => setErrorModalInfo(null)}
        title={errorModalInfo?.title ?? ""}
        message={errorModalInfo?.message ?? ""}
        showSettingsLink={errorModalInfo?.showSettingsLink ?? false}
        onGoToSettings={() => setErrorModalInfo(null)}
      />
    </div>
  );
}
