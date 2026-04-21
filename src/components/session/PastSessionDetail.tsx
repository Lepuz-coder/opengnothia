import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Loader2, Trash2, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { useTranslation, getDateLocale } from "@/i18n";
import { getSessionById, deleteSession, getSessionTotalCost, getPatientNotes, updateSessionNarrative, saveTokenUsage } from "@/services/db/queries";
import { streamMessage } from "@/services/ai/aiService";
import { buildSummaryPrompt, SESSION_SUMMARY_SYSTEM_PROMPT } from "@/services/ai/promptBuilder";
import { calculateCost } from "@/services/ai/costCalculator";
import { createBufferedTextStream } from "@/lib/createBufferedTextStream";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { ChatMessage, Session } from "@/types";

interface PastSessionDetailProps {
  sessionId: string;
  onBack: () => void;
}

export function PastSessionDetail({ sessionId, onBack }: PastSessionDetailProps) {
  const { t, language } = useTranslation();
  const locale = getDateLocale(language);
  const settings = useSettingsStore();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [sessionCost, setSessionCost] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([getSessionById(sessionId), getSessionTotalCost(sessionId)]).then(
      ([s, cost]) => {
        setSession(s);
        setSessionCost(cost);
        setLoading(false);
      }
    );
  }, [sessionId]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    await deleteSession(sessionId);
    setDeleting(false);
    setDeleteConfirmOpen(false);
    onBack();
  };

  const handleGenerateSummary = async () => {
    if (generating || !session) return;
    cancelledRef.current = false;
    setGenerating(true);
    setSummaryError(null);
    setStreamContent("");

    try {
      const patientNotes = await getPatientNotes();
      const summaryPrompt = buildSummaryPrompt(patientNotes, language);
      const conversationForSummary: ChatMessage[] = [
        ...session.messages,
        {
          id: "summary-request",
          role: "user",
          content: summaryPrompt,
          timestamp: new Date().toISOString(),
        },
      ];

      let fullContent = "";
      const abortController = new AbortController();
      const buffered = createBufferedTextStream((chunk) => {
        if (cancelledRef.current) return;
        setStreamContent((prev) => prev + chunk);
      });

      await streamMessage({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: conversationForSummary,
        systemPrompt: SESSION_SUMMARY_SYSTEM_PROMPT,
        customBaseUrl: settings.customBaseUrl || undefined,
        thinkingEnabled: false,
        abortSignal: abortController.signal,
        onThinking: () => {},
        onContent: (chunk) => {
          fullContent += chunk;
          buffered.push(chunk);
        },
        onUsage: (usage) => {
          if (!usage) return;
          const cost = calculateCost(settings.provider, settings.model, usage.inputTokens, usage.outputTokens);
          saveTokenUsage({
            session_id: sessionId,
            provider: settings.provider,
            model: settings.model,
            input_tokens: usage.inputTokens,
            output_tokens: usage.outputTokens,
            cost,
            call_type: "summary",
          });
        },
        onDone: () => {
          buffered.flush();
        },
        onError: (err) => {
          buffered.cancel();
          if (!cancelledRef.current) setSummaryError(err.message);
        },
      });

      if (fullContent.trim().length > 0) {
        await updateSessionNarrative(sessionId, fullContent);
        if (!cancelledRef.current) {
          setSession((prev) => (prev ? { ...prev, summary_narrative: fullContent } : prev));
        }
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setSummaryError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (!cancelledRef.current) setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-muted)]">{t.session.sessionNotFound}</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">
          {t.session.goBack}
        </Button>
      </div>
    );
  }

  const startDate = new Date(session.started_at);
  const endDate = session.ended_at ? new Date(session.ended_at) : null;
  const durationMin = endDate
    ? Math.round((endDate.getTime() - startDate.getTime()) / 60000)
    : null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          {t.common.back}
        </Button>
        <div className="flex-1">
          <div className="text-sm font-semibold">
            {startDate.toLocaleDateString(locale, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {" — "}
            {startDate.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            {durationMin != null && <span>{durationMin} {t.common.minutes}</span>}
            {sessionCost > 0 && (
              <>
                <span>·</span>
                <span>${sessionCost.toFixed(4)}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSummaryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            {t.session.sessionSummary}
          </button>
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t.session.deleteSession}
          </button>
        </div>
      </div>

      {/* Messages - read only */}
      <ChatContainer messages={session.messages} isLoading={false} />

      {/* Summary full-screen modal */}
      <Modal
        isOpen={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        title={t.session.sessionSummary}
        className="!max-w-none !w-full !h-full !mx-0 !rounded-none !flex !flex-col"
      >
        {session.summary_narrative ? (
          <div className="flex-1 overflow-y-auto text-sm text-[var(--text-secondary)] leading-relaxed markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {session.summary_narrative}
            </ReactMarkdown>
          </div>
        ) : generating ? (
          <div className="flex-1 overflow-y-auto text-sm text-[var(--text-secondary)] leading-relaxed markdown-content">
            <div className="flex items-center gap-2 text-[var(--text-muted)] mb-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t.session.preparingSummary}
            </div>
            {streamContent && (
              <>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {streamContent}
                </ReactMarkdown>
                <span className="inline-block w-1.5 h-3.5 bg-[var(--text-primary)] ml-0.5 animate-pulse" />
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-[var(--text-muted)] max-w-md">
              {t.session.summaryNotGeneratedYet}
            </p>
            <Button onClick={handleGenerateSummary}>
              <Sparkles className="w-4 h-4" />
              {t.session.generateSummary}
            </Button>
            {summaryError && (
              <p className="text-xs text-red-400 max-w-md">{summaryError}</p>
            )}
          </div>
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title={t.session.deleteSession}>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          {t.session.deleteSessionConfirm}
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleDelete} disabled={deleting} className="!bg-red-500 hover:!bg-red-600 !border-red-500">
            {deleting ? t.session.deleting : t.common.delete}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
