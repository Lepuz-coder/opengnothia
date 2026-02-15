import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { useSessionStore } from "@/stores/useSessionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useAppStore } from "@/stores/useAppStore";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { SessionTimer } from "@/components/chat/SessionTimer";
import { SessionEndSummary } from "@/components/session/SessionEndSummary";
import { PastSessionsList } from "@/components/session/PastSessionsList";
import { PastSessionDetail } from "@/components/session/PastSessionDetail";
import { sendMessage, streamMessage, testApiKey } from "@/services/ai/aiService";
import { calculateCost } from "@/services/ai/costCalculator";
import { buildSystemPrompt, buildSummaryPrompt, buildGreetingPrompt, buildRecommendationPrompt, buildPatientNotesUpdatePrompt } from "@/services/ai/promptBuilder";
import { createSession, updateSessionMessages, completeSession, deleteSession, getUserProfile, getTodayCheckIn, getRecentSessions, getPatientNotes, upsertPatientNotes, saveTokenUsage } from "@/services/db/queries";
import { therapySchools, getTherapySchool, getTherapySchoolName } from "@/constants/therapySchools";
import { Square, Loader2 } from "lucide-react";
import type { AIProvider, ChatMessage, SessionSummary, TokenUsage } from "@/types";

async function trackUsage(
  provider: AIProvider,
  model: string,
  sessionId: string | null,
  callType: string,
  usage: TokenUsage | null,
) {
  if (!usage) return;
  const cost = calculateCost(provider, model, usage.inputTokens, usage.outputTokens);
  await saveTokenUsage({
    session_id: sessionId,
    provider,
    model,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    cost,
    call_type: callType,
  });
}

export default function SessionPage() {
  const navigate = useNavigate();
  const session = useSessionStore();
  const settings = useSettingsStore();
  const setSidebarHidden = useAppStore((s) => s.setSidebarHidden);
  const [preMood, setPreMood] = useState(5);
  const [saving, setSaving] = useState(false);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [schoolPickerOpen, setSchoolPickerOpen] = useState(false);
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [apiTesting, setApiTesting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Restore sidebar when leaving session page
  useEffect(() => {
    return () => {
      useAppStore.getState().setSidebarHidden(false);
    };
  }, []);

  const handleStartSession = useCallback(async () => {
    setSidebarHidden(true);
    session.startSession(preMood);
    const id = useSessionStore.getState().sessionId!;
    const startedAt = useSessionStore.getState().startedAt!;
    await createSession({ id, started_at: startedAt, mood_before: preMood });
  }, [preMood, setSidebarHidden]);

  const handleGreeting = useCallback(async () => {
    try {
      const [profile, checkIn, recentSessions, patientNotes] = await Promise.all([
        getUserProfile(),
        getTodayCheckIn(),
        getRecentSessions(1),
        getPatientNotes(),
      ]);
      const lastSummary = recentSessions[0]?.summary ?? null;

      const greetingPrompt = buildGreetingPrompt({
        profile,
        todayCheckIn: checkIn,
        lastSessionSummary: lastSummary,
        therapySchool: settings.therapySchool,
        patientNotes,
      });

      const abortController = new AbortController();
      session.setAbortController(abortController);
      session.startStreaming();

      await streamMessage({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: [{ id: "greeting-trigger", role: "user", content: "Merhaba, seansa başlayalım.", timestamp: new Date().toISOString() }],
        systemPrompt: greetingPrompt,
        customBaseUrl: settings.customBaseUrl || undefined,
        thinkingEnabled: settings.thinkingEnabled,
        thinkingLevel: settings.thinkingLevel,
        abortSignal: abortController.signal,
        onThinking: (chunk) => {
          useSessionStore.getState().appendStreamThinking(chunk);
        },
        onContent: (chunk) => {
          useSessionStore.getState().appendStreamContent(chunk);
        },
        onDone: () => {
          useSessionStore.getState().finishStreaming();
          const sessionId = useSessionStore.getState().sessionId;
          if (sessionId) {
            updateSessionMessages(sessionId, useSessionStore.getState().messages);
          }
        },
        onUsage: (usage) => {
          const sid = useSessionStore.getState().sessionId;
          trackUsage(settings.provider, settings.model, sid, "greeting", usage);
        },
        onError: (error) => {
          const store = useSessionStore.getState();
          if (store.streamingMessageId) {
            store.updateMessage(store.streamingMessageId, {
              content: `Bir hata oluştu: ${error.message}`,
              isStreaming: false,
            });
          }
          store.finishStreaming();
        },
      });
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Bir hata oluştu: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`,
        timestamp: new Date().toISOString(),
      };
      session.addMessage(errorMsg);
      session.finishStreaming();
    }
  }, [settings]);

  const handleSendMessage = useCallback(async (content: string) => {
    const { isStreaming } = useSessionStore.getState();
    if (isStreaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    session.addMessage(userMsg);

    try {
      const [profile, checkIn, recentSessions, patientNotes] = await Promise.all([
        getUserProfile(),
        getTodayCheckIn(),
        getRecentSessions(1),
        getPatientNotes(),
      ]);
      const lastSummary = recentSessions[0]?.summary ?? null;

      const systemPrompt = buildSystemPrompt({
        profile,
        todayCheckIn: checkIn,
        lastSessionSummary: lastSummary,
        therapySchool: settings.therapySchool,
        patientNotes,
      });

      const allMessages = useSessionStore.getState().messages;
      const abortController = new AbortController();
      session.setAbortController(abortController);
      session.startStreaming();

      await streamMessage({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: allMessages.filter((m) => !m.isStreaming),
        systemPrompt,
        customBaseUrl: settings.customBaseUrl || undefined,
        thinkingEnabled: settings.thinkingEnabled,
        thinkingLevel: settings.thinkingLevel,
        abortSignal: abortController.signal,
        onThinking: (chunk) => {
          useSessionStore.getState().appendStreamThinking(chunk);
        },
        onContent: (chunk) => {
          useSessionStore.getState().appendStreamContent(chunk);
        },
        onDone: () => {
          useSessionStore.getState().finishStreaming();
          const sessionId = useSessionStore.getState().sessionId;
          if (sessionId) {
            updateSessionMessages(sessionId, useSessionStore.getState().messages);
          }
        },
        onUsage: (usage) => {
          const sid = useSessionStore.getState().sessionId;
          trackUsage(settings.provider, settings.model, sid, "chat", usage);
        },
        onError: (error) => {
          const store = useSessionStore.getState();
          if (store.streamingMessageId) {
            store.updateMessage(store.streamingMessageId, {
              content: `Bir hata oluştu: ${error.message}. Lütfen ayarlarından API bağlantını kontrol et.`,
              isStreaming: false,
            });
          }
          store.finishStreaming();
        },
      });
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Bir hata oluştu: ${err instanceof Error ? err.message : "Bilinmeyen hata"}. Lütfen ayarlarından API bağlantını kontrol et.`,
        timestamp: new Date().toISOString(),
      };
      session.addMessage(errorMsg);
      session.finishStreaming();
    }
  }, [settings]);

  const handleEndSession = useCallback(async () => {
    const { isStreaming } = useSessionStore.getState();
    if (isStreaming) return;

    const messages = useSessionStore.getState().messages;
    const userMessageCount = messages.filter((m) => m.role === "user").length;

    // Short session: delete and redirect
    if (userMessageCount < 2) {
      const sessionId = useSessionStore.getState().sessionId;
      if (sessionId) {
        await deleteSession(sessionId);
      }
      session.reset();
      setSidebarHidden(false);
      navigate("/dashboard");
      return;
    }

    // Switch to post view with streaming state
    session.startSummaryStream();

    // 1. Stream recommendation paragraph (user sees this)
    const recommendationPrompt = buildRecommendationPrompt();
    const conversationForRecommendation: ChatMessage[] = [
      ...messages,
      {
        id: "recommendation-request",
        role: "user",
        content: recommendationPrompt,
        timestamp: new Date().toISOString(),
      },
    ];

    try {
      await streamMessage({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: conversationForRecommendation,
        systemPrompt: "Sen deneyimli bir klinik psikologsun ve bu danışanın terapistisin. Danışana sıcak ve destekleyici bir öneri yaz.",
        customBaseUrl: settings.customBaseUrl || undefined,
        thinkingEnabled: false,
        abortSignal: new AbortController().signal,
        onThinking: () => {},
        onContent: (chunk) => {
          useSessionStore.getState().appendSummaryNarrative(chunk);
        },
        onUsage: (usage) => {
          const sid = useSessionStore.getState().sessionId;
          trackUsage(settings.provider, settings.model, sid, "recommendation", usage);
        },
        onDone: () => {
          useSessionStore.getState().finishSummaryStream();
        },
        onError: (error) => {
          useSessionStore.getState().appendSummaryNarrative(
            `\n\nBir hata oluştu: ${error.message}`
          );
          useSessionStore.getState().finishSummaryStream();
        },
      });

      // 2. Background: structured JSON summary + patient notes update (parallel)
      session.setSummaryParsing(true);
      try {
        const [existingNotes] = await Promise.all([getPatientNotes()]);

        const summaryPrompt = buildSummaryPrompt();
        const conversationForSummary: ChatMessage[] = [
          ...messages,
          {
            id: "summary-request",
            role: "user",
            content: summaryPrompt,
            timestamp: new Date().toISOString(),
          },
        ];

        const patientNotesPrompt = buildPatientNotesUpdatePrompt(existingNotes);
        const conversationForNotes: ChatMessage[] = [
          ...messages,
          {
            id: "notes-request",
            role: "user",
            content: patientNotesPrompt,
            timestamp: new Date().toISOString(),
          },
        ];

        // Run both in parallel
        const [summaryResult, notesResult] = await Promise.all([
          sendMessage({
            provider: settings.provider,
            apiKey: settings.apiKey,
            model: settings.model,
            messages: conversationForSummary,
            systemPrompt: "Sen bir seans analisti. Verilen konuşmayı analiz et.",
            customBaseUrl: settings.customBaseUrl || undefined,
          }),
          sendMessage({
            provider: settings.provider,
            apiKey: settings.apiKey,
            model: settings.model,
            messages: conversationForNotes,
            systemPrompt: "Sen deneyimli bir klinik psikolog. Hasta notlarını güncelle.",
            customBaseUrl: settings.customBaseUrl || undefined,
          }),
        ]);

        // Track usage for both calls
        const sid = useSessionStore.getState().sessionId;
        trackUsage(settings.provider, settings.model, sid, "summary", summaryResult.usage);
        trackUsage(settings.provider, settings.model, sid, "patient_notes", notesResult.usage);

        // Parse and save structured summary
        let summary: SessionSummary;
        try {
          summary = JSON.parse(summaryResult.content);
        } catch {
          summary = {
            themes: [],
            defenses: [],
            insights: [],
            homework: [],
          };
        }
        session.setSummary(summary);

        // Save updated patient notes
        if (notesResult.content && notesResult.content.trim().length > 0) {
          await upsertPatientNotes(notesResult.content.trim());
        }
      } catch {
        session.setSummary({
          themes: [],
          defenses: [],
          insights: [],
          homework: [],
        });
      } finally {
        session.setSummaryParsing(false);
      }
    } catch (err) {
      useSessionStore.getState().appendSummaryNarrative(
        `Bir hata oluştu: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`
      );
      useSessionStore.getState().finishSummaryStream();
    }
  }, [settings, navigate, setSidebarHidden]);

  const handleSaveAndClose = useCallback(async () => {
    setSaving(true);
    const state = useSessionStore.getState();
    if (state.sessionId && state.summary) {
      await completeSession(state.sessionId, {
        mood_after: state.moodAfter ?? 5,
        summary: state.summary,
        summary_narrative: state.summaryNarrative || undefined,
      });
    }
    session.reset();
    setSidebarHidden(false);
    setSaving(false);
    navigate("/dashboard");
  }, [navigate, setSidebarHidden]);

  // Viewing a past session
  if (viewingSessionId) {
    return (
      <PastSessionDetail
        sessionId={viewingSessionId}
        onBack={() => setViewingSessionId(null)}
      />
    );
  }

  // Pre-session: past sessions + start button
  if (session.status === "idle" || session.status === "pre") {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Header with Start button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold">Seanslar</h2>
            <p className="text-sm text-[var(--text-muted)]">Geçmiş seanslarını görüntüle veya yeni bir seans başlat</p>
          </div>
          <Button onClick={() => { setApiError(null); setStartModalOpen(true); }} size="lg">
            Seans Başlat
          </Button>
        </div>

        {/* Past sessions */}
        <PastSessionsList onViewSession={setViewingSessionId} />

        {/* Start session modal */}
        <Modal isOpen={startModalOpen} onClose={() => { setStartModalOpen(false); setSchoolPickerOpen(false); }} title="Seansa Başla">
          {/* Therapy school display */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Terapi Ekolü</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]">
                <span className="text-sm font-medium">{getTherapySchool(settings.therapySchool)?.name ?? "BDT"}</span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSchoolPickerOpen(!schoolPickerOpen)}>
                Değiştir
              </Button>
            </div>

            {/* School picker grid */}
            {schoolPickerOpen && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {therapySchools.map((school) => (
                  <button
                    key={school.id}
                    onClick={() => {
                      settings.setTherapySchool(school.id);
                      setSchoolPickerOpen(false);
                    }}
                    className={`text-left p-3 rounded-xl border transition-all duration-200 ${
                      school.id === "general" ? "col-span-2" : ""
                    } ${
                      settings.therapySchool === school.id
                        ? "border-primary-500 bg-primary-500/10"
                        : "border-[var(--border-color)] hover:border-[var(--text-muted)]"
                    }`}
                  >
                    <span className="text-sm font-medium block">{school.shortName}</span>
                    <span className="text-xs text-[var(--text-muted)]">{school.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mood slider */}
          <Slider label="Ruh Hali" value={preMood} onChange={setPreMood} min={1} max={10} />

          {/* API error message */}
          {apiError && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400 mb-2">{apiError}</p>
              <button
                onClick={() => { setStartModalOpen(false); setApiError(null); navigate("/settings"); }}
                className="text-sm text-primary-400 hover:text-primary-300 underline"
              >
                Ayarlara Git
              </button>
            </div>
          )}

          {/* Start button */}
          <Button
            disabled={apiTesting}
            onClick={async () => {
              setApiError(null);
              setApiTesting(true);
              const result = await testApiKey({
                provider: settings.provider,
                apiKey: settings.apiKey,
                model: settings.model,
                customBaseUrl: settings.customBaseUrl || undefined,
              });
              setApiTesting(false);
              if (!result.success) {
                setApiError(result.error ?? "API bağlantısı başarısız. Lütfen ayarlarını kontrol et.");
                return;
              }
              setStartModalOpen(false);
              setSchoolPickerOpen(false);
              await handleStartSession();
              handleGreeting();
            }}
            size="lg"
            className="w-full mt-6"
          >
            {apiTesting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Bağlantı kontrol ediliyor...
              </span>
            ) : (
              "Seansı Başlat"
            )}
          </Button>
        </Modal>
      </div>
    );
  }

  // Post-session: summary
  if (session.status === "post") {
    return (
      <SessionEndSummary
        summaryNarrative={session.summaryNarrative}
        isSummaryStreaming={session.isSummaryStreaming}
        isSummaryParsing={session.isSummaryParsing}
        moodAfter={session.moodAfter ?? 5}
        onMoodChange={session.setMoodAfter}
        onSave={handleSaveAndClose}
        saving={saving}
      />
    );
  }

  // Active session: chat
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Seans</h2>
          <Badge variant="primary">
            Psikolog · {getTherapySchoolName(settings.therapySchool)}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {session.startedAt && <SessionTimer startedAt={session.startedAt} />}
          <button
            onClick={() => setEndConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Square className="w-3.5 h-3.5" />
            Seansı Bitir
          </button>
        </div>
      </div>

      {/* Chat */}
      <ChatContainer messages={session.messages} isLoading={session.isLoading} isStreaming={session.isStreaming} />

      {/* Input */}
      <ChatInput onSend={handleSendMessage} disabled={session.isLoading || session.isStreaming} />

      {/* End session confirmation modal */}
      <Modal isOpen={endConfirmOpen} onClose={() => setEndConfirmOpen(false)} title="Seansı Bitir">
        <p className="text-[var(--text-secondary)] mb-6">
          Seansı bitirmek istediğinden emin misin?
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setEndConfirmOpen(false)}>
            İptal
          </Button>
          <Button variant="danger" onClick={() => {
            setEndConfirmOpen(false);
            handleEndSession();
          }}>
            Evet, Bitir
          </Button>
        </div>
      </Modal>
    </div>
  );
}
