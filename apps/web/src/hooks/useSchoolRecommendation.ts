import { useState, useRef, useCallback } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTranslation } from "@/i18n";
import { getAllSchools, getSchoolById } from "@/stores/useSchoolsStore";
import { streamMessage } from "@/services/ai/aiService";
import { AIError } from "@/services/ai/AIError";
import { getErrorDisplayInfo, type ErrorDisplayInfo } from "@/services/ai/errorMessages";
import { calculateCost } from "@/services/ai/costCalculator";
import { buildSchoolRecommendationPrompt } from "@/services/ai/promptBuilder";
import { saveTokenUsage } from "@/services/db/queries";
import type { TherapySchoolDef } from "@/constants/therapySchools";
import type { ChatMessage } from "@/types";

interface UseSchoolRecommendationOptions {
  onSchoolSelected?: (school: TherapySchoolDef) => Promise<void>;
}

export function useSchoolRecommendation(options?: UseSchoolRecommendationOptions) {
  const { t, language } = useTranslation();
  const settings = useSettingsStore();

  const [recMessages, setRecMessages] = useState<ChatMessage[]>([]);
  const [recIsLoading, setRecIsLoading] = useState(false);
  const [recIsStreaming, setRecIsStreaming] = useState(false);
  const [recStreamingMsgId, setRecStreamingMsgId] = useState<string | null>(null);
  const [recRecommendedSchool, setRecRecommendedSchool] = useState<TherapySchoolDef | null>(null);
  const [recPhase, setRecPhase] = useState<"chat" | "result">("chat");
  const [recError, setRecError] = useState<ErrorDisplayInfo | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const allSchools = getAllSchools(language);

  const streamRecommendation = useCallback(
    (messages: ChatMessage[], assistantMsgId: string) => {
      let accumulatedContent = "";
      let accumulatedThinking = "";

      const systemPrompt = buildSchoolRecommendationPrompt(language, allSchools);
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      streamMessage({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        messages,
        systemPrompt,
        customBaseUrl: settings.customBaseUrl || undefined,
        thinkingEnabled: settings.thinkingEnabled,
        thinkingLevel: settings.thinkingLevel,
        thinkingType: settings.thinkingType,
        abortSignal: abortController.signal,
        onThinking: (chunk) => {
          accumulatedThinking += chunk;
          setRecMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, thinking: accumulatedThinking, isThinkingActive: true }
                : m
            )
          );
        },
        onContent: (chunk) => {
          accumulatedContent += chunk;
          const displayContent = accumulatedContent
            .replace(/<<<SCHOOL:[\w]+>>>/g, "")
            .replace(/\n?<<<[^\n]*$/, "")
            .trimEnd();
          setRecMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: displayContent, isThinkingActive: false }
                : m
            )
          );
        },
        onDone: () => {
          const markerMatch = accumulatedContent.match(/<<<SCHOOL:([\w]+)>>>/);
          let displayContent = accumulatedContent;
          let detectedSchool: TherapySchoolDef | null = null;

          if (markerMatch) {
            const schoolId = markerMatch[1];
            displayContent = accumulatedContent.replace(/<<<SCHOOL:[\w]+>>>/g, "").trim();
            detectedSchool = getSchoolById(schoolId, language) ?? null;
          }

          setRecMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: displayContent, isStreaming: false, isThinkingActive: false }
                : m
            )
          );
          setRecIsStreaming(false);
          setRecStreamingMsgId(null);

          if (detectedSchool) {
            setRecRecommendedSchool(detectedSchool);
            setRecPhase("result");
          }
        },
        onUsage: (usage) => {
          const cost = calculateCost(settings.provider, settings.model, usage.inputTokens, usage.outputTokens);
          saveTokenUsage({
            session_id: null,
            provider: settings.provider,
            model: settings.model,
            input_tokens: usage.inputTokens,
            output_tokens: usage.outputTokens,
            cost,
            call_type: "recommendation",
          });
        },
        onError: (error) => {
          setRecMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
          setRecIsStreaming(false);
          setRecStreamingMsgId(null);
          setRecIsLoading(false);
          const statusCode = error instanceof AIError ? error.statusCode : undefined;
          setRecError(getErrorDisplayInfo(t, statusCode, settings.provider));
        },
      }).catch((err) => {
        setRecIsStreaming(false);
        setRecStreamingMsgId(null);
        setRecIsLoading(false);
        const statusCode = err instanceof AIError ? err.statusCode : undefined;
        setRecError(getErrorDisplayInfo(t, statusCode, settings.provider));
      });
    },
    [language, allSchools, settings, t]
  );

  const startRecommendation = useCallback(() => {
    if (recIsStreaming) return;
    setRecIsLoading(true);

    const triggerMsg: ChatMessage = {
      id: "rec-trigger",
      role: "user",
      content: t.schools.recommendationStartTrigger,
      timestamp: new Date().toISOString(),
    };

    const assistantMsgId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      thinking: "",
      isStreaming: true,
      isThinkingActive: false,
    };

    setRecMessages([assistantMsg]);
    setRecStreamingMsgId(assistantMsgId);
    setRecIsStreaming(true);
    setRecIsLoading(false);

    streamRecommendation([triggerMsg], assistantMsgId);
  }, [recIsStreaming, t, streamRecommendation]);

  const handleRecommendationSend = useCallback(
    (content: string) => {
      if (recIsStreaming) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...recMessages, userMsg];
      setRecMessages(updatedMessages);

      const assistantMsgId = crypto.randomUUID();
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        thinking: "",
        isStreaming: true,
        isThinkingActive: false,
      };

      setRecMessages((prev) => [...prev, assistantMsg]);
      setRecStreamingMsgId(assistantMsgId);
      setRecIsStreaming(true);

      const triggerMsg: ChatMessage = {
        id: "rec-trigger",
        role: "user",
        content: t.schools.recommendationStartTrigger,
        timestamp: new Date().toISOString(),
      };
      const apiMessages = [triggerMsg, ...updatedMessages];

      streamRecommendation(apiMessages, assistantMsgId);
    },
    [recIsStreaming, recMessages, t, streamRecommendation]
  );

  const handleApplyRecommendation = useCallback(async () => {
    if (!recRecommendedSchool) return;
    await options?.onSchoolSelected?.(recRecommendedSchool);
    setRecMessages([]);
    setRecPhase("chat");
    setRecRecommendedSchool(null);
    setRecError(null);
  }, [recRecommendedSchool, options]);

  const resetRecommendation = useCallback(() => {
    abortControllerRef.current?.abort();
    setRecMessages([]);
    setRecIsLoading(false);
    setRecIsStreaming(false);
    setRecStreamingMsgId(null);
    setRecPhase("chat");
    setRecRecommendedSchool(null);
    setRecError(null);
  }, []);

  return {
    recMessages,
    recIsLoading,
    recIsStreaming,
    recStreamingMsgId,
    recRecommendedSchool,
    recPhase,
    recError,
    setRecError,
    allSchools,
    startRecommendation,
    handleRecommendationSend,
    handleApplyRecommendation,
    resetRecommendation,
  };
}
