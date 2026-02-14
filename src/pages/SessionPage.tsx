import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useSessionStore } from "@/stores/useSessionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Card } from "@/components/ui/Card";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { SessionTimer } from "@/components/chat/SessionTimer";
import { SessionToolbar } from "@/components/chat/SessionToolbar";
import { SessionEndSummary } from "@/components/session/SessionEndSummary";
import { BreathingOverlay } from "@/components/session/BreathingOverlay";
import { sendMessage, streamMessage } from "@/services/ai/aiService";
import { buildSystemPrompt, buildSummaryPrompt } from "@/services/ai/promptBuilder";
import { createSession, updateSessionMessages, completeSession, getUserProfile, getTodayCheckIn, getRecentSessions } from "@/services/db/queries";
import { therapySchools, getTherapySchool, getTherapySchoolName } from "@/constants/therapySchools";
import type { ChatMessage, SessionSummary } from "@/types";

export default function SessionPage() {
  const navigate = useNavigate();
  const session = useSessionStore();
  const settings = useSettingsStore();
  const [preMood, setPreMood] = useState(5);
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schoolModalOpen, setSchoolModalOpen] = useState(false);

  const handleStartSession = useCallback(async () => {
    session.startSession(preMood);
    const id = useSessionStore.getState().sessionId!;
    const startedAt = useSessionStore.getState().startedAt!;
    await createSession({ id, started_at: startedAt, mood_before: preMood });
  }, [preMood]);

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
      const profile = await getUserProfile();
      const checkIn = await getTodayCheckIn();
      const recentSessions = await getRecentSessions(1);
      const lastSummary = recentSessions[0]?.summary ?? null;

      const systemPrompt = buildSystemPrompt({
        profile,
        todayCheckIn: checkIn,
        lastSessionSummary: lastSummary,
        therapySchool: settings.therapySchool,
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
    session.setLoading(true);
    try {
      const messages = useSessionStore.getState().messages;
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

      const response = await sendMessage({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: conversationForSummary,
        systemPrompt: "Sen bir seans analisti. Verilen konuşmayı analiz et.",
        customBaseUrl: settings.customBaseUrl || undefined,
      });

      let summary: SessionSummary;
      try {
        summary = JSON.parse(response);
      } catch {
        summary = {
          themes: ["Genel konuşma"],
          defenses: [],
          insights: ["Seans tamamlandı"],
          homework: [],
        };
      }

      session.setSummary(summary);
    } catch {
      session.setSummary({
        themes: ["Analiz yapılamadı"],
        defenses: [],
        insights: [],
        homework: [],
      });
    } finally {
      session.setLoading(false);
    }
  }, [settings]);

  const handleGrounding = useCallback(() => {
    const groundingMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Grounding egzersizi yapalım:\n\n5 - Gördüğün 5 şeyi say\n4 - Dokunabildiğin 4 şeyi say\n3 - Duyabildiğin 3 şeyi say\n2 - Koklayabildiğin 2 şeyi say\n1 - Tadabildiğin 1 şeyi say\n\nHazır olduğunda devam edelim.",
      timestamp: new Date().toISOString(),
    };
    session.addMessage(groundingMsg);
  }, []);

  const handleSaveAndClose = useCallback(async () => {
    setSaving(true);
    const state = useSessionStore.getState();
    if (state.sessionId && state.summary) {
      await completeSession(state.sessionId, {
        mood_after: state.moodAfter ?? 5,
        summary: state.summary,
      });
    }
    session.reset();
    setSaving(false);
    navigate("/dashboard");
  }, [navigate]);

  // Pre-session: mood selection + therapy school
  if (session.status === "idle" || session.status === "pre") {
    const currentSchool = getTherapySchool(settings.therapySchool);
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card>
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">Seansa Başla</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Başlamadan önce şu anki ruh halini değerlendir
            </p>
          </div>

          {/* Therapy School Display */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Terapi Ekolü</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]">
                <span className="text-sm font-medium">{currentSchool?.name ?? "BDT"}</span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSchoolModalOpen(true)}>
                Değiştir
              </Button>
            </div>
          </div>

          <Slider
            label="Ruh Hali"
            value={preMood}
            onChange={setPreMood}
            min={1}
            max={10}
          />
          <Button onClick={handleStartSession} size="lg" className="w-full mt-6">
            Seansı Başlat
          </Button>
        </Card>

        {/* School selection modal */}
        <Modal isOpen={schoolModalOpen} onClose={() => setSchoolModalOpen(false)} title="Terapi Ekolü Seç">
          <div className="grid grid-cols-2 gap-2">
            {therapySchools.map((school) => (
              <button
                key={school.id}
                onClick={() => {
                  settings.setTherapySchool(school.id);
                  setSchoolModalOpen(false);
                }}
                className={`text-left p-3 rounded-xl border transition-all duration-200 ${
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
  if (session.status === "post" && session.summary) {
    return (
      <SessionEndSummary
        summary={session.summary}
        moodAfter={session.moodAfter ?? 5}
        onMoodChange={session.setMoodAfter}
        onSave={handleSaveAndClose}
        saving={saving}
      />
    );
  }

  // Active session: chat
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-8">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Seans</h2>
          <Badge variant="primary" onClick={() => setSchoolModalOpen(true)}>
            Psikolog · {getTherapySchoolName(settings.therapySchool)}
          </Badge>
        </div>
        {session.startedAt && <SessionTimer startedAt={session.startedAt} />}
      </div>

      {/* Chat */}
      <ChatContainer messages={session.messages} isLoading={session.isLoading} isStreaming={session.isStreaming} />

      {/* Toolbar */}
      <SessionToolbar
        onBreathing={() => setBreathingOpen(true)}
        onGrounding={handleGrounding}
        onSummary={() => {}}
        onEnd={handleEndSession}
      />

      {/* Input */}
      <ChatInput onSend={handleSendMessage} disabled={session.isLoading || session.isStreaming} />

      {/* Breathing overlay */}
      <BreathingOverlay isOpen={breathingOpen} onClose={() => setBreathingOpen(false)} />

      {/* School change modal */}
      <Modal isOpen={schoolModalOpen} onClose={() => setSchoolModalOpen(false)} title="Terapi Ekolü Değiştir">
        <div className="grid grid-cols-2 gap-2">
          {therapySchools.map((school) => (
            <button
              key={school.id}
              onClick={() => {
                settings.setTherapySchool(school.id);
                setSchoolModalOpen(false);
              }}
              className={`text-left p-3 rounded-xl border transition-all duration-200 ${
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
