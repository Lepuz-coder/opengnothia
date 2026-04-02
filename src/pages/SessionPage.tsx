import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useSessionStore } from "@/stores/useSessionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useAppStore } from "@/stores/useAppStore";
import { loadSettings } from "@/lib/store";
import { useTranslation } from "@/i18n";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import type { ChatInputHandle } from "@/components/chat/ChatInput";
import { TranscriptApiKeyModal } from "@/components/chat/TranscriptApiKeyModal";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { transcribeAudio } from "@/services/ai/transcriptionService";
import { SessionTimer } from "@/components/chat/SessionTimer";
import { SessionEndSummary } from "@/components/session/SessionEndSummary";
import { PastSessionsList } from "@/components/session/PastSessionsList";
import type { PastSessionsListHandle, WeekSummaryInfo } from "@/components/session/PastSessionsList";
import { PastSessionDetail } from "@/components/session/PastSessionDetail";
import { sendMessage, streamMessage, testApiKey } from "@/services/ai/aiService";
import { AIError } from "@/services/ai/AIError";
import { getErrorDisplayInfo, type ErrorDisplayInfo } from "@/services/ai/errorMessages";
import { calculateCost } from "@/services/ai/costCalculator";
import { buildSystemPrompt, buildSummaryPrompt, buildGreetingPrompt, buildPatientNotesUpdatePrompt, buildCompactionPrompt, buildInsightExtractionPrompt, GREETING_TRIGGER, BACKGROUND_NOTES_SYSTEM_PROMPT, SESSION_SUMMARY_SYSTEM_PROMPT, INSIGHT_EXTRACTION_SYSTEM_PROMPT } from "@/services/ai/promptBuilder";
import { takeBackgroundNotes } from "@/services/ai/backgroundNotes";
import { createSession, updateSessionMessages, completeSession, deleteSession, getUserProfile, getTodayCheckIn, getRecentSessions, getPatientNotes, getPatientNotesUpdatedAt, getCompletedSessionCount, saveTokenUsage, getInsightGroups, createInsightGroup, createInsight } from "@/services/db/queries";
import { getAllSchools, getSchoolById } from "@/stores/useSchoolsStore";
import { providers, getProvider, modelSupportsThinking } from "@/constants/providers";
import { ErrorModal } from "@/components/ui/ErrorModal";
import { testTranscriptApiKey } from "@/services/ai/ttsService";
import { Square, Loader2, FileText, Sparkles, Mic, MessageSquare, Pause, Play } from "lucide-react";
import { useVoiceConversation, type VoiceLoopStatus } from "@/hooks/useVoiceConversation";
import { VoiceConversationView } from "@/components/session/VoiceConversationView";
import type { AIProvider, ChatMessage, ThinkingLevel, TokenUsage, ExtractedInsight, SessionMode } from "@/types";
import { createBufferedTextStream } from "@/lib/createBufferedTextStream";

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

function VoiceStatusBadge({ status, t }: { status: VoiceLoopStatus; t: ReturnType<typeof useTranslation>["t"] }) {
  const labels: Partial<Record<VoiceLoopStatus, string>> = {
    waiting_for_ai: t.chat.thinking,
    synthesizing: t.voice.synthesizing,
    playing: t.voice.playing,
    listening: t.voice.listening,
    transcribing: t.voice.transcribing,
    confirming_transcript: t.voice.confirmTranscript,
    paused: t.voice.voicePaused,
  };
  const label = labels[status];
  if (!label) return null;
  const isActive = status !== "paused";
  return (
    <Badge variant={isActive ? "primary" : "default"}>
      <span className="flex items-center gap-1.5">
        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
        {label}
      </span>
    </Badge>
  );
}

export default function SessionPage() {
  const navigate = useNavigate();
  const session = useSessionStore();
  const settings = useSettingsStore();
  const { t, language } = useTranslation();
  const setSidebarHidden = useAppStore((s) => s.setSidebarHidden);
  const [saving, setSaving] = useState(false);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [schoolPickerOpen, setSchoolPickerOpen] = useState(false);
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [apiTesting, setApiTesting] = useState(false);
  const pastSessionsRef = useRef<PastSessionsListHandle>(null);
  const [weekSummaryInfo, setWeekSummaryInfo] = useState<WeekSummaryInfo>({ weekSessionCount: 0, hasWeeklySummary: false, summaryLoading: false, generating: false });
  const [errorModalInfo, setErrorModalInfo] = useState<ErrorDisplayInfo | null>(null);
  const [errorSettingsPath, setErrorSettingsPath] = useState("/settings");
  const [transcriptKeyModalOpen, setTranscriptKeyModalOpen] = useState(false);
  const chatInputRef = useRef<ChatInputHandle>(null);
  const recorder = useAudioRecorder();
  const [selectedMode, setSelectedMode] = useState<SessionMode>(settings.preferredSessionMode);
  const sendMessageRef = useRef<(text: string) => void>(() => {});
  const voiceFeedRef = useRef<(chunk: string) => void>(() => {});
  const voiceFlushRef = useRef<() => void>(() => {});
  const voiceLoop = useVoiceConversation({
    onTranscriptionReady: (text) => sendMessageRef.current(text),
    language,
  });
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
      const [profile, checkIn, recentSessions, patientNotes, sessionCount] = await Promise.all([
        getUserProfile(),
        getTodayCheckIn(),
        getRecentSessions(1),
        getPatientNotes(),
        getCompletedSessionCount(),
      ]);
      const lastSummary = recentSessions[0]?.summary ?? null;
      const lastNarrative = recentSessions[0]?.summary_narrative ?? null;
      const lastSessionDate = recentSessions[0]?.started_at ?? null;

      const greetingPrompt = buildGreetingPrompt({
        profile,
        todayCheckIn: checkIn,
        lastSessionSummary: lastSummary,
        lastSessionNarrative: lastNarrative,
        therapySchool: settings.therapySchool,
        patientNotes,
        lastSessionDate,
        totalSessionCount: sessionCount,
        language,
        provider: settings.provider,
      });

      const abortController = new AbortController();
      session.setAbortController(abortController);
      session.startStreaming();
      const thinkingStream = createBufferedTextStream((chunk) => {
        useSessionStore.getState().appendStreamThinking(chunk);
      });
      const contentStream = createBufferedTextStream((chunk) => {
        useSessionStore.getState().appendStreamContent(chunk);
      });

      await streamMessage({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: [{ id: "greeting-trigger", role: "user", content: GREETING_TRIGGER, timestamp: new Date().toISOString() }],
        systemPrompt: greetingPrompt,
        customBaseUrl: settings.customBaseUrl || undefined,
        thinkingEnabled: settings.thinkingEnabled,
        thinkingLevel: settings.thinkingLevel,
        thinkingType: settings.thinkingType,
        abortSignal: abortController.signal,
        onThinking: (chunk) => {
          thinkingStream.push(chunk);
        },
        onContent: (chunk) => {
          contentStream.push(chunk);
          if (useSessionStore.getState().sessionMode === "voice") {
            voiceFeedRef.current(chunk);
          }
        },
        onDone: () => {
          thinkingStream.flush();
          contentStream.flush();
          useSessionStore.getState().finishStreaming();
          const sessionId = useSessionStore.getState().sessionId;
          if (sessionId) {
            updateSessionMessages(sessionId, useSessionStore.getState().messages);
          }
          if (useSessionStore.getState().sessionMode === "voice") {
            voiceFlushRef.current();
          }
        },
        onUsage: (usage) => {
          const sid = useSessionStore.getState().sessionId;
          trackUsage(settings.provider, settings.model, sid, "greeting", usage);
          useSessionStore.getState().setCurrentInputTokens(usage.inputTokens);
        },
        onError: (error) => {
          thinkingStream.cancel();
          contentStream.cancel();
          const store = useSessionStore.getState();
          if (store.streamingMessageId) {
            store.removeMessage(store.streamingMessageId);
          }
          store.finishStreaming();
          const statusCode = error instanceof AIError ? error.statusCode : undefined;
          setErrorModalInfo(getErrorDisplayInfo(t, statusCode, settings.provider));
        },
      });

      if (abortController.signal.aborted) {
        thinkingStream.cancel();
        contentStream.cancel();
        return;
      }
    } catch (err) {
      session.finishStreaming();
      const statusCode = err instanceof AIError ? err.statusCode : undefined;
      setErrorModalInfo(getErrorDisplayInfo(t, statusCode, settings.provider));
    }
  }, [settings]);

  const performCompaction = useCallback(async () => {
    const store = useSessionStore.getState();
    if (store.isCompacting || store.isStreaming) return;

    store.startCompaction();

    try {
      const [profile, checkIn, recentSessions, patientNotes, sessionCount] = await Promise.all([
        getUserProfile(),
        getTodayCheckIn(),
        getRecentSessions(1),
        getPatientNotes(),
        getCompletedSessionCount(),
      ]);

      const systemPrompt = buildSystemPrompt({
        profile,
        todayCheckIn: checkIn,
        lastSessionSummary: recentSessions[0]?.summary ?? null,
        lastSessionNarrative: recentSessions[0]?.summary_narrative ?? null,
        therapySchool: settings.therapySchool,
        patientNotes,
        lastSessionDate: recentSessions[0]?.started_at ?? null,
        totalSessionCount: sessionCount,
        language,
        provider: settings.provider,
      });

      const compactionPrompt = buildCompactionPrompt(language);
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
        content: `${t.errors.compaction}: ${err instanceof Error ? err.message : t.errors.unknown}`,
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
      const [profile, checkIn, recentSessions, patientNotes, sessionCount] = await Promise.all([
        getUserProfile(),
        getTodayCheckIn(),
        getRecentSessions(1),
        getPatientNotes(),
        getCompletedSessionCount(),
      ]);
      const lastSummary = recentSessions[0]?.summary ?? null;
      const lastNarrative = recentSessions[0]?.summary_narrative ?? null;
      const lastSessionDate = recentSessions[0]?.started_at ?? null;

      const systemPrompt = buildSystemPrompt({
        profile,
        todayCheckIn: checkIn,
        lastSessionSummary: lastSummary,
        lastSessionNarrative: lastNarrative,
        therapySchool: settings.therapySchool,
        patientNotes,
        lastSessionDate,
        totalSessionCount: sessionCount,
        language,
        provider: settings.provider,
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
      const thinkingStream = createBufferedTextStream((chunk) => {
        useSessionStore.getState().appendStreamThinking(chunk);
      });
      const contentStream = createBufferedTextStream((chunk) => {
        useSessionStore.getState().appendStreamContent(chunk);
      });

      await streamMessage({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: effectiveMessages,
        systemPrompt,
        customBaseUrl: settings.customBaseUrl || undefined,
        thinkingEnabled: settings.thinkingEnabled,
        thinkingLevel: settings.thinkingLevel,
        thinkingType: settings.thinkingType,
        abortSignal: abortController.signal,
        onThinking: (chunk) => {
          thinkingStream.push(chunk);
        },
        onContent: (chunk) => {
          contentStream.push(chunk);
          if (useSessionStore.getState().sessionMode === "voice") {
            voiceFeedRef.current(chunk);
          }
        },
        onDone: () => {
          thinkingStream.flush();
          contentStream.flush();
          useSessionStore.getState().finishStreaming();
          const sessionId = useSessionStore.getState().sessionId;
          if (sessionId) {
            updateSessionMessages(sessionId, useSessionStore.getState().messages);
          }
          if (useSessionStore.getState().sessionMode === "voice") {
            voiceFlushRef.current();
          }
        },
        onUsage: (usage) => {
          const sid = useSessionStore.getState().sessionId;
          trackUsage(settings.provider, settings.model, sid, "chat", usage);
          useSessionStore.getState().setCurrentInputTokens(usage.inputTokens);
        },
        onError: (error) => {
          thinkingStream.cancel();
          contentStream.cancel();
          const store = useSessionStore.getState();
          if (store.streamingMessageId) {
            store.removeMessage(store.streamingMessageId);
          }
          store.finishStreaming();
          const statusCode = error instanceof AIError ? error.statusCode : undefined;
          setErrorModalInfo(getErrorDisplayInfo(t, statusCode, settings.provider));
        },
      });

      if (abortController.signal.aborted) {
        thinkingStream.cancel();
        contentStream.cancel();
        return;
      }

      // Check if compaction is needed
      const providerConfig = getProvider(settings.provider);
      const modelConfig = providerConfig?.models.find((m) => m.id === settings.model);
      const ctxWindow = modelConfig?.contextWindow ?? 0;
      const { currentInputTokens } = useSessionStore.getState();
      if (ctxWindow > 0 && currentInputTokens >= ctxWindow * 0.8) {
        await performCompaction();
      }
    } catch (err) {
      session.finishStreaming();
      const statusCode = err instanceof AIError ? err.statusCode : undefined;
      setErrorModalInfo(getErrorDisplayInfo(t, statusCode, settings.provider));
    }
  }, [settings, performCompaction]);

  // Keep refs in sync for voice loop
  sendMessageRef.current = handleSendMessage;
  voiceFeedRef.current = voiceLoop.feedStreamChunk;
  voiceFlushRef.current = voiceLoop.flushStream;

  const extractInsights = useCallback(async (messages: ChatMessage[]) => {
    const store = useSessionStore.getState();
    store.setExtractingInsights(true);
    store.setInsightExtractionError(false);

    try {
      const existingGroups = await getInsightGroups();

      const insightPrompt = buildInsightExtractionPrompt(
        existingGroups.map((g) => ({
          id: g.id,
          name: g.name,
          emoji: g.emoji,
          description: g.description,
        })),
        language,
      );

      const conversationForInsights: ChatMessage[] = [
        ...messages,
        {
          id: "insight-request",
          role: "user",
          content: insightPrompt,
          timestamp: new Date().toISOString(),
        },
      ];

      const result = await sendMessage({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.memoryModel,
        messages: conversationForInsights,
        systemPrompt: INSIGHT_EXTRACTION_SYSTEM_PROMPT,
        customBaseUrl: settings.customBaseUrl || undefined,
        thinkingEnabled: settings.memoryThinkingEnabled,
        thinkingLevel: settings.memoryThinkingLevel,
        thinkingType: settings.memoryThinkingType,
      });

      const sid = useSessionStore.getState().sessionId;
      trackUsage(settings.provider, settings.memoryModel, sid, "insight_extraction", result.usage);

      let parsed: { insights: Array<{
        group_id: string | null;
        new_group: { name: string; emoji: string; description: string; color: string } | null;
        content: string;
      }> };

      try {
        let jsonStr = result.content.trim();
        const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fenceMatch) {
          jsonStr = fenceMatch[1].trim();
        }
        parsed = JSON.parse(jsonStr);
      } catch {
        console.error("Failed to parse insight extraction response:", result.content);
        useSessionStore.getState().setExtractingInsights(false);
        useSessionStore.getState().setInsightExtractionError(true);
        return;
      }

      if (!parsed.insights || !Array.isArray(parsed.insights)) {
        useSessionStore.getState().setExtractingInsights(false);
        return;
      }

      const extractedInsights: ExtractedInsight[] = parsed.insights
        .filter((i) => i.content && i.content.trim().length > 0)
        .map((i) => {
          const existingGroup = i.group_id
            ? existingGroups.find((g) => g.id === i.group_id)
            : null;
          return {
            id: crypto.randomUUID(),
            group_id: i.group_id,
            new_group: i.new_group,
            content: i.content.trim(),
            group_name: existingGroup?.name ?? i.new_group?.name,
            group_emoji: existingGroup?.emoji ?? i.new_group?.emoji,
          };
        });

      useSessionStore.getState().setExtractedInsights(extractedInsights);
      useSessionStore.getState().setExtractingInsights(false);
    } catch (err) {
      console.error("Insight extraction failed:", err);
      useSessionStore.getState().setExtractingInsights(false);
      useSessionStore.getState().setInsightExtractionError(true);
    }
  }, [settings, language]);

  // Trigger insight extraction when summary streaming finishes
  const prevIsSummaryStreaming = useRef(session.isSummaryStreaming);
  useEffect(() => {
    if (prevIsSummaryStreaming.current && !session.isSummaryStreaming && session.status === "post" && session.summary) {
      const endState = useSessionStore.getState();
      const msgs = getEffectiveMessages(endState.messages, endState.compactedContext, endState.compactedAtIndex);
      extractInsights(msgs);
    }
    prevIsSummaryStreaming.current = session.isSummaryStreaming;
  }, [session.isSummaryStreaming, session.status, session.summary, extractInsights]);


  const handleMicClick = useCallback(async () => {
    const transcriptApiKey = useSettingsStore.getState().transcriptApiKey;
    if (!transcriptApiKey) {
      setTranscriptKeyModalOpen(true);
      return;
    }
    await recorder.startRecording();
  }, [recorder]);

  const handleMicStop = useCallback(async () => {
    try {
      const audioBlob = await recorder.stopRecording();
      recorder.setState("transcribing");

      const transcriptApiKey = useSettingsStore.getState().transcriptApiKey;
      const result = await transcribeAudio(audioBlob, transcriptApiKey, language);

      if (result.text.trim()) {
        chatInputRef.current?.insertText(result.text);
      } else {
        recorder.setError(t.transcript.emptyTranscription);
        setTimeout(() => recorder.setError(null), 3000);
      }

      // Track STT cost
      const sessionId = useSessionStore.getState().sessionId;
      await saveTokenUsage({
        session_id: sessionId,
        provider: "openai",
        model: "whisper-1",
        input_tokens: 0,
        output_tokens: 0,
        cost: result.cost,
        call_type: "stt",
      });

      recorder.setState("idle");
    } catch {
      recorder.setError(t.transcript.transcriptionError);
      setTimeout(() => recorder.setError(null), 3000);
      recorder.setState("idle");
    }
  }, [recorder, language, t]);

  const handleTranscriptKeySave = useCallback(async (apiKey: string) => {
    settings.setTranscriptApiKey(apiKey);
    const store = await loadSettings();
    await store.set("transcriptApiKey", apiKey);
    await store.save();
    setTranscriptKeyModalOpen(false);
    await recorder.startRecording();
  }, [settings, recorder]);

  const handleEndSession = useCallback(async () => {
    voiceLoop.stopLoop();
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

    // Switch to post view
    session.startSummaryStream();

    // Fire-and-forget: update patient notes in background
    Promise.all([getPatientNotes(), getPatientNotesUpdatedAt()]).then(([existingNotes, notesUpdatedAt]) => {
      const patientNotesPrompt = buildPatientNotesUpdatePrompt(existingNotes, notesUpdatedAt, language);
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
        model: settings.memoryModel,
        messages: conversationForNotes,
        systemPrompt: BACKGROUND_NOTES_SYSTEM_PROMPT,
        customBaseUrl: settings.customBaseUrl || undefined,
        thinkingEnabled: settings.memoryThinkingEnabled,
        thinkingLevel: settings.memoryThinkingLevel,
        thinkingType: settings.memoryThinkingType,
        callType: "patient_notes",
        sessionId: useSessionStore.getState().sessionId,
      });
    });

    // Stream session summary
    try {
      const patientNotes = await getPatientNotes();
      const summaryPrompt = buildSummaryPrompt(patientNotes, language);
      const conversationForSummary: ChatMessage[] = [
        ...messages,
        {
          id: "summary-request",
          role: "user",
          content: summaryPrompt,
          timestamp: new Date().toISOString(),
        },
      ];
      const summaryStream = createBufferedTextStream((chunk) => {
        useSessionStore.getState().appendSummaryNarrative(chunk);
      });

      await streamMessage({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: conversationForSummary,
        systemPrompt: SESSION_SUMMARY_SYSTEM_PROMPT,
        customBaseUrl: settings.customBaseUrl || undefined,
        thinkingEnabled: false,
        abortSignal: new AbortController().signal,
        onThinking: () => {},
        onContent: (chunk) => {
          summaryStream.push(chunk);
        },
        onUsage: (usage) => {
          const sid = useSessionStore.getState().sessionId;
          trackUsage(settings.provider, settings.model, sid, "summary", usage);
        },
        onDone: () => {
          summaryStream.flush();
          session.setSummary({ themes: [], defenses: [], insights: [], homework: [] });
          useSessionStore.getState().finishSummaryStream();
        },
        onError: (error) => {
          summaryStream.cancel();
          session.setSummary({ themes: [], defenses: [], insights: [], homework: [] });
          useSessionStore.getState().finishSummaryStream();
          const statusCode = error instanceof AIError ? error.statusCode : undefined;
          setErrorModalInfo(getErrorDisplayInfo(t, statusCode, settings.provider));
        },
      });
    } catch (err) {
      session.setSummary({ themes: [], defenses: [], insights: [], homework: [] });
      useSessionStore.getState().finishSummaryStream();
      const statusCode = err instanceof AIError ? err.statusCode : undefined;
      setErrorModalInfo(getErrorDisplayInfo(t, statusCode, settings.provider));
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

    // Persist extracted insights
    const insightsToSave = state.extractedInsights;
    if (insightsToSave.length > 0) {
      const newGroupIdMap = new Map<string, string>();
      for (const insight of insightsToSave) {
        let targetGroupId = insight.group_id;

        if (!targetGroupId && insight.new_group) {
          const groupKey = insight.new_group.name;
          if (newGroupIdMap.has(groupKey)) {
            targetGroupId = newGroupIdMap.get(groupKey)!;
          } else {
            targetGroupId = await createInsightGroup({
              name: insight.new_group.name,
              emoji: insight.new_group.emoji,
              description: insight.new_group.description,
              color: insight.new_group.color,
            });
            newGroupIdMap.set(groupKey, targetGroupId);
          }
        }

        if (targetGroupId) {
          await createInsight({
            group_id: targetGroupId,
            content: insight.content,
          });
        }
      }
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
      <div className="max-w-4xl mx-auto">
        {/* Header with Start button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t.session.title}</h1>
            <p className="text-sm text-[var(--text-muted)]">{t.session.description}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Weekly Summary Button */}
            {weekSummaryInfo.weekSessionCount >= 2 && !weekSummaryInfo.summaryLoading && (
              weekSummaryInfo.hasWeeklySummary ? (
                <Button variant="secondary" size="lg" onClick={() => pastSessionsRef.current?.showSummary()}>
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {t.session.showWeeklySummary}
                  </span>
                </Button>
              ) : isSunday ? (
                <Button variant="secondary" size="lg" onClick={() => pastSessionsRef.current?.generateSummary()} disabled={weekSummaryInfo.generating}>
                  <span className="flex items-center gap-2">
                    {weekSummaryInfo.generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t.session.generatingSummary}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {t.session.generateWeeklySummary}
                      </>
                    )}
                  </span>
                </Button>
              ) : null
            )}
            <Button onClick={() => setStartModalOpen(true)} size="lg">
              {t.session.startSession}
            </Button>
          </div>
        </div>

        {/* Past sessions */}
        <PastSessionsList ref={pastSessionsRef} onViewSession={setViewingSessionId} onWeekSummaryInfoChange={setWeekSummaryInfo} />

        {/* Start session modal */}
        <Modal isOpen={startModalOpen} onClose={() => { setStartModalOpen(false); setSchoolPickerOpen(false); }} title={t.session.startSessionModal}>
          {/* Therapy school display */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">{t.session.therapySchool}</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]">
                <span className="text-sm font-medium">{getSchoolById(settings.therapySchool)?.name ?? "BDT"}</span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSchoolPickerOpen(true)}>
                {t.common.change}
              </Button>
            </div>
          </div>

          {/* Session Mode Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">{t.voice.modeSelection}</label>
            <p className="text-xs text-[var(--text-muted)] mb-3">{t.voice.modeSelectionDescription}</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedMode("chat")}
                className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  selectedMode === "chat"
                    ? "border-primary-500 bg-primary-500/5 shadow-[0_0_12px_-3px] shadow-primary-500/25"
                    : "border-[var(--border-color)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-secondary)]/50"
                }`}
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className={`p-2 rounded-lg transition-colors ${
                    selectedMode === "chat" ? "bg-primary-500/15" : "bg-[var(--bg-secondary)]"
                  }`}>
                    <MessageSquare className={`w-5 h-5 ${selectedMode === "chat" ? "text-primary-500" : "text-[var(--text-muted)]"}`} />
                  </div>
                  <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedMode === "chat"
                      ? "border-primary-500"
                      : "border-[var(--text-muted)]/40"
                  }`}>
                    {selectedMode === "chat" && (
                      <div className="w-2 h-2 rounded-full bg-primary-500" />
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold block mb-1">{t.voice.chatConversation}</span>
                <span className="text-xs text-[var(--text-muted)] block leading-relaxed">{t.voice.chatDescription}</span>
              </button>
              <button
                onClick={() => {
                  setSelectedMode("voice");
                  const key = useSettingsStore.getState().transcriptApiKey;
                  if (!key) {
                    setTranscriptKeyModalOpen(true);
                  }
                }}
                className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  selectedMode === "voice"
                    ? "border-primary-500 bg-primary-500/5 shadow-[0_0_12px_-3px] shadow-primary-500/25"
                    : "border-[var(--border-color)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-secondary)]/50"
                }`}
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className={`p-2 rounded-lg transition-colors ${
                    selectedMode === "voice" ? "bg-primary-500/15" : "bg-[var(--bg-secondary)]"
                  }`}>
                    <Mic className={`w-5 h-5 ${selectedMode === "voice" ? "text-primary-500" : "text-[var(--text-muted)]"}`} />
                  </div>
                  <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedMode === "voice"
                      ? "border-primary-500"
                      : "border-[var(--text-muted)]/40"
                  }`}>
                    {selectedMode === "voice" && (
                      <div className="w-2 h-2 rounded-full bg-primary-500" />
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold block mb-1">{t.voice.voiceConversation}</span>
                <span className="text-xs text-[var(--text-muted)] block leading-relaxed">{t.voice.voiceDescription}</span>
              </button>
            </div>
          </div>

          {/* Start button */}
          <Button
            disabled={apiTesting}
            onClick={async () => {
              setApiTesting(true);
              const result = await testApiKey({
                provider: settings.provider,
                apiKey: settings.apiKey,
                model: settings.model,
                customBaseUrl: settings.customBaseUrl || undefined,
              });
              setApiTesting(false);
              if (!result.success) {
                setStartModalOpen(false);
                setSchoolPickerOpen(false);
                setErrorSettingsPath("/settings");
                setErrorModalInfo(getErrorDisplayInfo(t, result.statusCode, settings.provider));
                return;
              }
              // Validate voice API key if voice mode selected
              if (selectedMode === "voice") {
                const transcriptKey = useSettingsStore.getState().transcriptApiKey;
                if (!transcriptKey) {
                  setStartModalOpen(false);
                  setSchoolPickerOpen(false);
                  setErrorSettingsPath("/settings?tab=voice");
                  setErrorModalInfo({
                    title: t.voice.apiKeyErrorTitle,
                    message: t.voice.apiKeyError,
                    showSettingsLink: true,
                    settingsButtonLabel: t.voice.goToVoiceSettings,
                  });
                  return;
                }
                setApiTesting(true);
                const voiceResult = await testTranscriptApiKey(transcriptKey);
                setApiTesting(false);
                if (!voiceResult.success) {
                  setStartModalOpen(false);
                  setSchoolPickerOpen(false);
                  setErrorSettingsPath("/settings?tab=voice");
                  setErrorModalInfo({
                    title: t.voice.apiKeyErrorTitle,
                    message: t.voice.apiKeyError,
                    showSettingsLink: true,
                    settingsButtonLabel: t.voice.goToVoiceSettings,
                  });
                  return;
                }
              }
              setStartModalOpen(false);
              setSchoolPickerOpen(false);
              useSessionStore.getState().setSessionMode(selectedMode);
              settings.setPreferredSessionMode(selectedMode);
              loadSettings().then((store) => {
                store.set("preferredSessionMode", selectedMode);
                store.save();
              });
              await handleStartSession();
              handleGreeting();
              if (selectedMode === "voice") {
                voiceLoop.startLoop();
              }
            }}
            size="lg"
            className="w-full mt-6"
          >
            {apiTesting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.session.checkingConnection}
              </span>
            ) : (
              t.session.startSessionButton
            )}
          </Button>
        </Modal>

        {/* School picker modal */}
        <Modal isOpen={schoolPickerOpen} onClose={() => setSchoolPickerOpen(false)} title={t.session.selectTherapySchool}>
          <div className="grid grid-cols-2 gap-2">
            {getAllSchools().map((school) => (
              <button
                key={school.id}
                onClick={async () => {
                  settings.setTherapySchool(school.id);
                  setSchoolPickerOpen(false);
                  const store = await loadSettings();
                  await store.set("therapySchool", school.id);
                  await store.save();
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

        {/* API Error Modal */}
        <ErrorModal
          isOpen={errorModalInfo !== null}
          onClose={() => setErrorModalInfo(null)}
          title={errorModalInfo?.title ?? ""}
          message={errorModalInfo?.message ?? ""}
          showSettingsLink={errorModalInfo?.showSettingsLink ?? false}
          settingsButtonLabel={errorModalInfo?.settingsButtonLabel}
          onGoToSettings={() => { setErrorModalInfo(null); navigate(errorSettingsPath); }}
        />
      </div>
    );
  }

  // Post-session: summary
  if (session.status === "post") {
    return (
      <>
        <SessionEndSummary
          summaryNarrative={session.summaryNarrative}
          isSummaryStreaming={session.isSummaryStreaming}
          onSave={handleSaveAndClose}
          saving={saving}
          extractedInsights={session.extractedInsights}
          isExtractingInsights={session.isExtractingInsights}
          insightExtractionError={session.insightExtractionError}
          onRemoveInsight={(id) => useSessionStore.getState().removeExtractedInsight(id)}
          onUpdateInsight={(id, content) => useSessionStore.getState().updateExtractedInsight(id, content)}
          onAddInsight={(insight) => useSessionStore.getState().addExtractedInsight(insight)}
        />
        <ErrorModal
          isOpen={errorModalInfo !== null}
          onClose={() => setErrorModalInfo(null)}
          title={errorModalInfo?.title ?? ""}
          message={errorModalInfo?.message ?? ""}
          showSettingsLink={errorModalInfo?.showSettingsLink ?? false}
          onGoToSettings={() => { setErrorModalInfo(null); navigate("/settings"); }}
        />
      </>
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
          <h2 className="font-semibold">{t.session.sessionTitle}</h2>
          <Badge variant="primary">
            {t.session.psychologist} · {getSchoolById(settings.therapySchool)?.shortName ?? settings.therapySchool}
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
          {/* Voice mode controls */}
          {session.sessionMode === "voice" && voiceLoop.status !== "idle" && (
            <>
              <VoiceStatusBadge status={voiceLoop.status} t={t} />
              <button
                onClick={voiceLoop.status === "paused" ? voiceLoop.resumeLoop : voiceLoop.pauseLoop}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                {voiceLoop.status === "paused" ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                {voiceLoop.status === "paused" ? t.voice.resumeVoice : t.voice.pauseVoice}
              </button>
              <button
                onClick={() => {
                  voiceLoop.stopLoop();
                  useSessionStore.getState().setSessionMode("chat");
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <MessageSquare className="w-3 h-3" />
                {t.voice.switchToChat}
              </button>
              <div className="w-px h-4 bg-[var(--border-color)]" />
            </>
          )}
          {session.startedAt && <SessionTimer startedAt={session.startedAt} />}
          <button
            onClick={() => setEndConfirmOpen(true)}
            disabled={session.isCompacting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.session.endSession}
          </button>
        </div>
      </div>

      {/* Content area: voice mode vs chat mode */}
      {session.sessionMode === "voice" && voiceLoop.status !== "idle" ? (
        <VoiceConversationView
          voiceStatus={voiceLoop.status}
          currentAIText={voiceLoop.currentAIText}
          lastUserTranscript={voiceLoop.lastUserTranscript}
          isStreaming={session.isStreaming}
          audioLevel={voiceLoop.recorder.audioLevel}
          onRecordingStop={voiceLoop.handleRecordingStop}
          onConfirmTranscript={voiceLoop.confirmTranscript}
          onRetryRecording={voiceLoop.retryRecording}
          error={voiceLoop.error}
        />
      ) : (
        <>
          {/* Chat */}
          <ChatContainer messages={session.messages} isLoading={session.isLoading} isStreaming={session.isStreaming} isCompacting={session.isCompacting} />

          {/* Input */}
          <ChatInput
            ref={chatInputRef}
            onSend={(msg) => {
              if (session.sessionMode === "voice" && voiceLoop.status !== "idle") {
                voiceLoop.pauseLoop();
              }
              handleSendMessage(msg);
            }}
            disabled={session.isLoading || session.isStreaming || session.isCompacting}
            recordingState={recorder.state}
            audioLevel={recorder.audioLevel}
            onMicClick={handleMicClick}
            onMicStop={handleMicStop}
          />
          {recorder.error && (
            <div className="px-4 -mt-3 pb-2">
              <p className="text-xs text-red-400 text-center">{recorder.error}</p>
            </div>
          )}
        </>
      )}

      {/* Transcript API key modal */}
      <TranscriptApiKeyModal
        isOpen={transcriptKeyModalOpen}
        onClose={() => {
          setTranscriptKeyModalOpen(false);
          if (!useSettingsStore.getState().transcriptApiKey) {
            setSelectedMode("chat");
          }
        }}
        onSave={handleTranscriptKeySave}
      />

      {/* End session confirmation modal */}
      <Modal isOpen={endConfirmOpen} onClose={() => setEndConfirmOpen(false)} title={t.session.endSession}>
        <p className="text-[var(--text-secondary)] mb-6">
          {t.session.endSessionConfirm}
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setEndConfirmOpen(false)}>
            {t.common.cancel}
          </Button>
          <Button variant="danger" onClick={() => {
            setEndConfirmOpen(false);
            handleEndSession();
          }}>
            {t.session.yesEnd}
          </Button>
        </div>
      </Modal>

      {/* API Error Modal */}
      <ErrorModal
        isOpen={errorModalInfo !== null}
        onClose={() => setErrorModalInfo(null)}
        title={errorModalInfo?.title ?? ""}
        message={errorModalInfo?.message ?? ""}
        showSettingsLink={errorModalInfo?.showSettingsLink ?? false}
        onGoToSettings={() => { setErrorModalInfo(null); navigate("/settings"); }}
      />
    </div>
  );
}
