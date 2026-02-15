import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useSessionStore } from "@/stores/useSessionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Card } from "@/components/ui/Card";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { SessionTimer } from "@/components/chat/SessionTimer";
import { SessionToolbar } from "@/components/chat/SessionToolbar";
import { SessionEndSummary } from "@/components/session/SessionEndSummary";
import { BreathingOverlay } from "@/components/session/BreathingOverlay";
import { sendMessage } from "@/services/ai/aiService";
import { buildSystemPrompt, buildSummaryPrompt } from "@/services/ai/promptBuilder";
import { createSession, updateSessionMessages, completeSession, getUserProfile, getTodayCheckIn, getRecentSessions } from "@/services/db/queries";
import { getProvider } from "@/constants/providers";
import type { ChatMessage, SessionSummary, TokenUsage } from "@/types";

function calculateCost(usage: TokenUsage, provider: string, model: string): number {
  const providerConfig = getProvider(provider);
  const modelConfig = providerConfig?.models.find((m) => m.id === model);
  if (!modelConfig?.costPer1kInput || !modelConfig?.costPer1kOutput) return 0;
  const inputCost = (usage.inputTokens / 1000) * modelConfig.costPer1kInput;
  const outputCost = (usage.outputTokens / 1000) * modelConfig.costPer1kOutput;
  return inputCost + outputCost;
}

export default function SessionPage() {
  const navigate = useNavigate();
  const session = useSessionStore();
  const settings = useSettingsStore();
  const [preMood, setPreMood] = useState(5);
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleStartSession = useCallback(async () => {
    session.startSession(preMood);
    const id = useSessionStore.getState().sessionId!;
    const startedAt = useSessionStore.getState().startedAt!;
    await createSession({ id, started_at: startedAt, mood_before: preMood });
  }, [preMood]);

  const handleSendMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    session.addMessage(userMsg);
    session.setLoading(true);

    try {
      const profile = await getUserProfile();
      const checkIn = await getTodayCheckIn();
      const recentSessions = await getRecentSessions(1);
      const lastSummary = recentSessions[0]?.summary ?? null;

      const systemPrompt = buildSystemPrompt({
        profile,
        todayCheckIn: checkIn,
        lastSessionSummary: lastSummary,
      });

      const allMessages = useSessionStore.getState().messages;
      const response = await sendMessage({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: allMessages,
        systemPrompt,
        customBaseUrl: settings.customBaseUrl || undefined,
      });

      if (response.usage) {
        const cost = calculateCost(response.usage, settings.provider, settings.model);
        session.addUsage(response.usage, cost);
        session.setModelUsed(settings.model);
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.content,
        timestamp: new Date().toISOString(),
      };
      session.addMessage(assistantMsg);

      const sessionId = useSessionStore.getState().sessionId;
      if (sessionId) {
        await updateSessionMessages(sessionId, useSessionStore.getState().messages);
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Bir hata oluştu: ${err instanceof Error ? err.message : "Bilinmeyen hata"}. Lütfen ayarlarından API bağlantını kontrol et.`,
        timestamp: new Date().toISOString(),
      };
      session.addMessage(errorMsg);
    } finally {
      session.setLoading(false);
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

      if (response.usage) {
        const cost = calculateCost(response.usage, settings.provider, settings.model);
        session.addUsage(response.usage, cost);
      }

      let summary: SessionSummary;
      try {
        summary = JSON.parse(response.content);
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
        total_input_tokens: state.totalInputTokens,
        total_output_tokens: state.totalOutputTokens,
        total_cost: state.totalCost,
        model_used: state.modelUsed,
      });
    }
    session.reset();
    setSaving(false);
    navigate("/dashboard");
  }, [navigate]);

  // Pre-session: mood selection
  if (session.status === "idle" || session.status === "pre") {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card>
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">Seansa Başla</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Başlamadan önce şu anki ruh halini değerlendir
            </p>
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
        totalInputTokens={session.totalInputTokens}
        totalOutputTokens={session.totalOutputTokens}
        totalCost={session.totalCost}
        modelUsed={session.modelUsed}
      />
    );
  }

  // Active session: chat
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-8">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <h2 className="font-semibold">Seans</h2>
        {session.startedAt && <SessionTimer startedAt={session.startedAt} />}
      </div>

      {/* Chat */}
      <ChatContainer messages={session.messages} isLoading={session.isLoading} />

      {/* Toolbar */}
      <SessionToolbar
        onBreathing={() => setBreathingOpen(true)}
        onGrounding={handleGrounding}
        onSummary={() => {}}
        onEnd={handleEndSession}
      />

      {/* Input */}
      <ChatInput onSend={handleSendMessage} disabled={session.isLoading} />

      {/* Breathing overlay */}
      <BreathingOverlay isOpen={breathingOpen} onClose={() => setBreathingOpen(false)} />
    </div>
  );
}
