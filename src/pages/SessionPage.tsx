import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useSessionStore } from "@/stores/useSessionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useAppStore } from "@/stores/useAppStore";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { SessionTimer } from "@/components/chat/SessionTimer";
import { SessionEndSummary } from "@/components/session/SessionEndSummary";
import { PastSessionsList } from "@/components/session/PastSessionsList";
import type { PastSessionsListHandle, WeekSummaryInfo } from "@/components/session/PastSessionsList";
import { PastSessionDetail } from "@/components/session/PastSessionDetail";
import { sendMessage, streamMessage, testApiKey } from "@/services/ai/aiService";
import { calculateCost } from "@/services/ai/costCalculator";
import { buildSystemPrompt, buildSummaryPrompt, buildGreetingPrompt, buildRecommendationPrompt, buildPatientNotesUpdatePrompt, buildCompactionPrompt } from "@/services/ai/promptBuilder";
import { takeBackgroundNotes } from "@/services/ai/backgroundNotes";
import { createSession, updateSessionMessages, completeSession, deleteSession, getUserProfile, getTodayCheckIn, getRecentSessions, getPatientNotes, saveTokenUsage } from "@/services/db/queries";
import { therapySchools, getTherapySchool, getTherapySchoolName } from "@/constants/therapySchools";
import { providers, getProvider, modelSupportsThinking } from "@/constants/providers";
import { Square, Loader2, FileText, Sparkles } from "lucide-react";
import type { AIProvider, ChatMessage, SessionSummary, ThinkingLevel, TokenUsage } from "@/types";

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

function getEffectiveMessages(
  messages: ChatMessage[],
  compactedContext: string | null,
  compactedAtIndex: number,
): ChatMessage[] {
  if (!compactedContext) return messages;
  const contextMsg: ChatMessage = {
    id: "compacted-context",
    role: "assistant",
    content: compactedContext,
    timestamp: new Date().toISOString(),
  };
  return [contextMsg, ...messages.slice(compactedAtIndex)];
}

function formatTokenCount(n: number): string {
  if (n === 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function SessionPage() {
  const navigate = useNavigate();
  const session = useSessionStore();
  const settings = useSettingsStore();
  const setSidebarHidden = useAppStore((s) => s.setSidebarHidden);
  const [saving, setSaving] = useState(false);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [schoolPickerOpen, setSchoolPickerOpen] = useState(false);
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [apiTesting, setApiTesting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const pastSessionsRef = useRef<PastSessionsListHandle>(null);
  const [weekSummaryInfo, setWeekSummaryInfo] = useState<WeekSummaryInfo>({ weekSessionCount: 0, hasWeeklySummary: false, summaryLoading: false, generating: false });
  const isSunday = new Date().getDay() === 0;

  // Restore sidebar when leaving session page
  useEffect(() => {
    return () => {
      useAppStore.getState().setSidebarHidden(false);
    };
  }, []);

  const handleStartSession = useCallback(async () => {
    setSidebarHidden(true);
    session.startSession(5);
    const id = useSessionStore.getState().sessionId!;
    const startedAt = useSessionStore.getState().startedAt!;
    await createSession({ id, started_at: startedAt, mood_before: 5 });
  }, [setSidebarHidden]);

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
          useSessionStore.getState().setCurrentInputTokens(usage.inputTokens);
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

  const performCompaction = useCallback(async () => {
    const store = useSessionStore.getState();
    if (store.isCompacting || store.isStreaming) return;

    store.startCompaction();

    try {
      const [profile, checkIn, recentSessions, patientNotes] = await Promise.all([
        getUserProfile(),
        getTodayCheckIn(),
        getRecentSessions(1),
        getPatientNotes(),
      ]);

      const systemPrompt = buildSystemPrompt({
        profile,
        todayCheckIn: checkIn,
        lastSessionSummary: recentSessions[0]?.summary ?? null,
        therapySchool: settings.therapySchool,
        patientNotes,
      });

      const compactionPrompt = buildCompactionPrompt();
      const effectiveMsgs = getEffectiveMessages(
        store.messages.filter((m) => !m.isStreaming),
        store.compactedContext,
        store.compactedAtIndex,
      );
      const conversationForCompaction: ChatMessage[] = [
        ...effectiveMsgs,
        {
          id: "compaction-request",
          role: "user",
          content: compactionPrompt,
          timestamp: new Date().toISOString(),
        },
      ];

      const result = await sendMessage({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: conversationForCompaction,
        systemPrompt,
        customBaseUrl: settings.customBaseUrl || undefined,
      });

      const sid = useSessionStore.getState().sessionId;
      trackUsage(settings.provider, settings.model, sid, "compaction", result.usage);

      useSessionStore.getState().applyCompaction(result.content);
      useSessionStore.getState().finishCompaction();
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Kompaktlama sırasında bir hata oluştu: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`,
        timestamp: new Date().toISOString(),
      };
      useSessionStore.getState().addMessage(errorMsg);
      useSessionStore.getState().finishCompaction();
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

      const state = useSessionStore.getState();
      const effectiveMessages = getEffectiveMessages(
        state.messages.filter((m) => !m.isStreaming),
        state.compactedContext,
        state.compactedAtIndex,
      );
      const abortController = new AbortController();
      session.setAbortController(abortController);
      session.startStreaming();

      await streamMessage({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: effectiveMessages,
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
          useSessionStore.getState().setCurrentInputTokens(usage.inputTokens);
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

      // Check if compaction is needed
      const providerConfig = getProvider(settings.provider);
      const modelConfig = providerConfig?.models.find((m) => m.id === settings.model);
      const ctxWindow = modelConfig?.contextWindow ?? 0;
      const { currentInputTokens } = useSessionStore.getState();
      if (ctxWindow > 0 && currentInputTokens >= ctxWindow * 0.8) {
        await performCompaction();
      }
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
  }, [settings, performCompaction]);

  const handleEndSession = useCallback(async () => {
    const { isStreaming } = useSessionStore.getState();
    if (isStreaming) return;

    const endState = useSessionStore.getState();
    const messages = getEffectiveMessages(endState.messages, endState.compactedContext, endState.compactedAtIndex);
    const userMessageCount = endState.messages.filter((m) => m.role === "user").length;

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

      // 2a. Fire-and-forget: update patient notes in background
      getPatientNotes().then((existingNotes) => {
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
        takeBackgroundNotes({
          provider: settings.provider,
          apiKey: settings.apiKey,
          model: settings.model,
          messages: conversationForNotes,
          systemPrompt: "Sen deneyimli bir klinik psikolog. Hasta notlarını güncelle.",
          customBaseUrl: settings.customBaseUrl || undefined,
          callType: "patient_notes",
          sessionId: useSessionStore.getState().sessionId,
        });
      });

      // 2b. Background: structured JSON summary
      session.setSummaryParsing(true);
      try {
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

        const summaryResult = await sendMessage({
          provider: settings.provider,
          apiKey: settings.apiKey,
          model: settings.model,
          messages: conversationForSummary,
          systemPrompt: "Sen bir seans analisti. Verilen konuşmayı analiz et.",
          customBaseUrl: settings.customBaseUrl || undefined,
        });

        const sid = useSessionStore.getState().sessionId;
        trackUsage(settings.provider, settings.model, sid, "summary", summaryResult.usage);

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
        mood_after: 5,
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
      <div>
        {/* Header with Start button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold">Seanslar</h2>
            <p className="text-sm text-[var(--text-muted)]">Geçmiş seanslarını görüntüle veya yeni bir seans başlat</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Weekly Summary Button */}
            {weekSummaryInfo.weekSessionCount >= 2 && !weekSummaryInfo.summaryLoading && (
              weekSummaryInfo.hasWeeklySummary ? (
                <Button variant="secondary" size="lg" onClick={() => pastSessionsRef.current?.showSummary()}>
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Haftalık Özeti Göster
                  </span>
                </Button>
              ) : isSunday ? (
                <Button variant="secondary" size="lg" onClick={() => pastSessionsRef.current?.generateSummary()} disabled={weekSummaryInfo.generating}>
                  <span className="flex items-center gap-2">
                    {weekSummaryInfo.generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Özet hazırlanıyor...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Haftalık Özet Çıkar
                      </>
                    )}
                  </span>
                </Button>
              ) : null
            )}
            <Button onClick={() => { setApiError(null); setStartModalOpen(true); }} size="lg">
              Seans Başlat
            </Button>
          </div>
        </div>

        {/* Past sessions */}
        <PastSessionsList ref={pastSessionsRef} onViewSession={setViewingSessionId} onWeekSummaryInfoChange={setWeekSummaryInfo} />

        {/* Start session modal */}
        <Modal isOpen={startModalOpen} onClose={() => { setStartModalOpen(false); setSchoolPickerOpen(false); }} title="Seansa Başla">
          {/* Therapy school display */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Terapi Ekolü</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]">
                <span className="text-sm font-medium">{getTherapySchool(settings.therapySchool)?.name ?? "BDT"}</span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSchoolPickerOpen(true)}>
                Değiştir
              </Button>
            </div>
          </div>

          {/* AI Settings */}
          <div className="mb-6 space-y-4">
            <label className="block text-sm font-medium mb-2">AI Ayarları</label>
            <Select
              label="Sağlayıcı"
              options={providers.map((p) => ({ value: p.id, label: p.name }))}
              value={settings.provider}
              onChange={(e) => {
                settings.setProvider(e.target.value as AIProvider);
                const prov = getProvider(e.target.value);
                if (prov?.models[0]) settings.setModel(prov.models[0].id);
              }}
            />
            <Select
              label="Model"
              options={getProvider(settings.provider)?.models.map((m) => ({ value: m.id, label: m.name })) ?? []}
              value={settings.model}
              onChange={(e) => {
                settings.setModel(e.target.value);
                if (!modelSupportsThinking(settings.provider, e.target.value)) {
                  settings.setThinkingEnabled(false);
                }
              }}
            />
            {modelSupportsThinking(settings.provider, settings.model) && (
              <>
                <div className="pt-1">
                  <Toggle
                    checked={settings.thinkingEnabled}
                    onChange={settings.setThinkingEnabled}
                    label="Düşünce Modu"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1 ml-14">
                    AI'ın düşünce sürecini görmeni sağlar. Daha yavaş ama daha derinlemesine yanıtlar.
                  </p>
                </div>
                {settings.thinkingEnabled && (
                  <Select
                    label="Düşünce Seviyesi"
                    options={[
                      { value: "low", label: "Hızlı — Kısa düşünür, çabuk yanıt verir" },
                      { value: "medium", label: "Dengeli — Yeterince düşünür, makul hızda" },
                      { value: "high", label: "Derinlemesine — Uzun düşünür, detaylı analiz" },
                      ...(settings.provider !== "openai" ? [{ value: "max", label: "Kapsamlı — En derin analiz, en yavaş yanıt" }] : []),
                    ]}
                    value={settings.thinkingLevel}
                    onChange={(e) => settings.setThinkingLevel(e.target.value as ThinkingLevel)}
                  />
                )}
              </>
            )}
          </div>

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

        {/* School picker modal */}
        <Modal isOpen={schoolPickerOpen} onClose={() => setSchoolPickerOpen(false)} title="Terapi Ekolü Seç">
          <div className="grid grid-cols-2 gap-2">
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
        onSave={handleSaveAndClose}
        saving={saving}
      />
    );
  }

  // Active session: chat
  const providerConfig = getProvider(settings.provider);
  const modelConfig = providerConfig?.models.find((m) => m.id === settings.model);
  const contextWindow = modelConfig?.contextWindow ?? 0;
  const modelName = modelConfig?.name ?? settings.model;
  const usagePercent = contextWindow > 0 ? (session.currentInputTokens / contextWindow) * 100 : 0;
  const tokenBarColor = usagePercent >= 80 ? "bg-red-500" : usagePercent >= 50 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-color)]/50 bg-[var(--bg-primary)]">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Seans</h2>
          <Badge variant="primary">
            Psikolog · {getTherapySchoolName(settings.therapySchool)}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {/* Token usage display */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">{modelName}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${tokenBarColor}`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              <span className="text-xs text-[var(--text-muted)] tabular-nums">
                {formatTokenCount(session.currentInputTokens)} / {formatTokenCount(contextWindow)}
              </span>
            </div>
          </div>
          <div className="w-px h-4 bg-[var(--border-color)]" />
          {session.startedAt && <SessionTimer startedAt={session.startedAt} />}
          <button
            onClick={() => setEndConfirmOpen(true)}
            disabled={session.isCompacting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Seansı Bitir
          </button>
        </div>
      </div>

      {/* Chat */}
      <ChatContainer messages={session.messages} isLoading={session.isLoading} isStreaming={session.isStreaming} isCompacting={session.isCompacting} />

      {/* Input */}
      <ChatInput onSend={handleSendMessage} disabled={session.isLoading || session.isStreaming || session.isCompacting} />

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
