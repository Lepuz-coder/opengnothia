import { useCallback, useRef, useState } from "react";
import { getCurrentLanguage } from "@opengnothia/shared/i18n";
import { createMarkerStrippedStream } from "@opengnothia/shared/lib/createMarkerStrippedStream";
import type { ChatMessage, TokenUsage } from "@opengnothia/shared/types";
import { sendChat, streamChat } from "@/ai/client";
import { getQueries } from "@/db";
import {
  INTAKE_EXTRACTION_SYSTEM_PROMPT,
  INTERVIEW_END_MARKER,
  INTERVIEW_TRIGGER,
  buildIntakeExtractionMessage,
  buildInterviewSystemPrompt,
  parseIntakeExtraction,
} from "./interviewPrompts";

const FLUSH_DELAY_MS = 48;

export type InterviewSaveState = "idle" | "saving" | "failed";

/**
 * State machine of the onboarding intake interview (M11). Deliberately NOT the
 * session store: an interview is not a session — no DB row, no mood, no
 * summary; its only artifact is the intake record written by finishAndSave().
 * The streaming plumbing mirrors sessionActions' turn handling on local state.
 */
export function useInterview(onAIError: (error: unknown) => void) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  /** Greeting failed before anything rendered — show a retry surface. */
  const [startFailed, setStartFailed] = useState(false);
  /** True once the AI emitted the end marker — input swaps for the save flow. */
  const [ended, setEnded] = useState(false);
  const [saveState, setSaveState] = useState<InterviewSaveState>("idle");

  const messagesRef = useRef<ChatMessage[]>([]);
  const startedRef = useRef(false);

  const updateMessages = (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    messagesRef.current = updater(messagesRef.current);
    setMessages(messagesRef.current);
  };

  const trackUsage = async (callType: string, usage: TokenUsage) => {
    try {
      const queries = await getQueries();
      // Same placeholder trail as sessionActions: model/cost are opaque behind
      // the proxy (M5); the interview belongs to no session.
      await queries.saveTokenUsage({
        session_id: null,
        provider: "openai",
        model: "proxy",
        input_tokens: usage.inputTokens,
        output_tokens: usage.outputTokens,
        cost: 0,
        call_type: callType,
      });
    } catch {
      // Usage trail only — never surface.
    }
  };

  const streamTurn = async (requestMessages: ChatMessage[], isGreeting: boolean) => {
    setIsStreaming(true);
    const streamingId = crypto.randomUUID();
    updateMessages((prev) => [
      ...prev,
      { id: streamingId, role: "assistant", content: "", timestamp: new Date().toISOString(), isStreaming: true },
    ]);

    const contentStream = createMarkerStrippedStream(
      INTERVIEW_END_MARKER,
      (safeChunk) =>
        updateMessages((prev) =>
          prev.map((m) => (m.id === streamingId ? { ...m, content: m.content + safeChunk } : m))
        ),
      FLUSH_DELAY_MS,
    );

    await streamChat({
      messages: requestMessages,
      systemPrompt: buildInterviewSystemPrompt(getCurrentLanguage()),
      onContent: (chunk) => contentStream.push(chunk),
      onDone: () => {
        contentStream.flush();
        updateMessages((prev) =>
          prev.map((m) => (m.id === streamingId ? { ...m, isStreaming: false } : m))
        );
        setIsStreaming(false);
        if (contentStream.hasMarker()) setEnded(true);
      },
      onUsage: (usage) => void trackUsage("intake_interview", usage),
      onError: (error) => {
        contentStream.cancel();
        updateMessages((prev) => prev.filter((m) => m.id !== streamingId));
        setIsStreaming(false);
        if (isGreeting && messagesRef.current.length === 0) {
          startedRef.current = false;
          setStartFailed(true);
        }
        onAIError(error);
      },
    });
  };

  /** Kick off the AI's opening turn. The trigger message never renders. */
  const start = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStartFailed(false);
    void streamTurn(
      [{ id: "interview-trigger", role: "user", content: INTERVIEW_TRIGGER, timestamp: new Date().toISOString() }],
      true,
    );
  }, []);

  const send = useCallback((content: string) => {
    if (messagesRef.current.some((m) => m.isStreaming)) return;
    updateMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content, timestamp: new Date().toISOString() },
    ]);
    void streamTurn(messagesRef.current.filter((m) => !m.isStreaming), false);
  }, []);

  /**
   * Extraction pass: transcript → intake record (+ user profile name when the
   * client gave one — the session greeting personalizes with it). Returns
   * whether saving succeeded; failure leaves state at "failed" for retry/skip.
   */
  const finishAndSave = useCallback(async (): Promise<boolean> => {
    setSaveState("saving");
    try {
      const transcript = messagesRef.current.filter((m) => !m.isStreaming && m.content.trim() !== "");
      const { content, usage } = await sendChat({
        messages: [
          {
            id: "intake-extraction",
            role: "user",
            content: buildIntakeExtractionMessage(transcript),
            timestamp: new Date().toISOString(),
          },
        ],
        systemPrompt: INTAKE_EXTRACTION_SYSTEM_PROMPT,
      });
      if (usage) void trackUsage("intake_extraction", usage);

      const extraction = parseIntakeExtraction(content);
      if (extraction === null) throw new Error("Intake extraction returned no parseable JSON");

      const queries = await getQueries();
      await queries.upsertPatientIntakeForm(extraction.fields);
      if (extraction.name !== null) {
        await queries.upsertUserProfile({ name: extraction.name });
      }
      setSaveState("idle");
      return true;
    } catch {
      setSaveState("failed");
      return false;
    }
  }, []);

  const userTurnCount = messages.filter((m) => m.role === "user").length;

  return { messages, isStreaming, startFailed, ended, saveState, userTurnCount, start, send, finishAndSave };
}
