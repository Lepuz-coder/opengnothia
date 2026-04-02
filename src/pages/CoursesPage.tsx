import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useCourseStore } from "@/stores/useCourseStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "@/i18n";
import { COURSES, getCourseById, type CourseDefinition } from "@/constants/courses";
import {
  initializeCourseProgress,
  getCourseProgress,
  getCourseStepProgress,
  startCourseStep,
  completeCourseStep,
  updateCourseStepMessages,
  getCourseCompletedStepCount,
  getPatientNotes,
  getPatientNotesUpdatedAt,
  saveTokenUsage,
} from "@/services/db/queries";
import { streamMessage, sendMessage } from "@/services/ai/aiService";
import { AIError } from "@/services/ai/AIError";
import { getErrorDisplayInfo, type ErrorDisplayInfo } from "@/services/ai/errorMessages";
import { calculateCost } from "@/services/ai/costCalculator";
import {
  buildCourseLessonSystemPrompt,
  buildCourseLessonGreetingPrompt,
  buildCourseLessonNotesMessage,
  COURSE_LESSON_TRIGGER,
} from "@/services/ai/coursePromptBuilder";
import { buildPatientNotesUpdatePrompt, buildCompactionPrompt, BACKGROUND_NOTES_SYSTEM_PROMPT } from "@/services/ai/promptBuilder";
import { takeBackgroundNotes } from "@/services/ai/backgroundNotes";
import { getProvider } from "@/constants/providers";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { Button } from "@/components/ui/Button";
import { ErrorModal } from "@/components/ui/ErrorModal";
import type { ChatMessage, CourseStepProgress, TokenUsage } from "@/types";
import { ArrowLeft, Lock, Check, Play, BookOpen, Loader2, ChevronRight, CheckCircle2, MoreVertical } from "lucide-react";

type View = "list" | "journey" | "lesson";

function getLocalizedStepTitle(
  t: ReturnType<typeof useTranslation>["t"],
  courseId: string,
  index: number,
  fallback: string,
): string {
  if (courseId === "spiritual_journey") {
    return t.courses.spiritualJourneySteps?.[index] ?? fallback;
  }
  return fallback;
}

function stripMarkers(content: string): string {
  return content
    .replace(/<<<PROGRESS:\d+>>>/g, "")
    .replace(/<<<STEP_COMPLETE>>>/g, "")
    .replace(/\n?<<<[^\n]*$/g, "")
    .trimEnd();
}

function extractProgress(content: string): number | null {
  const match = content.match(/<<<PROGRESS:(\d+)>>>/);
  return match ? Math.min(parseInt(match[1], 10), 100) : null;
}

async function trackUsage(
  provider: string,
  model: string,
  usage: TokenUsage | null,
) {
  if (!usage) return;
  const cost = calculateCost(provider as any, model, usage.inputTokens, usage.outputTokens);
  await saveTokenUsage({
    session_id: null,
    provider,
    model,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    cost,
    call_type: "course_lesson",
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

// ─── Course List View ────────────────────────────────────────────────

function CourseListView({
  onSelectCourse,
  t,
}: {
  onSelectCourse: (course: CourseDefinition) => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const [completedCounts, setCompletedCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    COURSES.forEach(async (course) => {
      const count = await getCourseCompletedStepCount(course.id);
      setCompletedCounts((prev) => ({ ...prev, [course.id]: count }));
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t.courses.title}</h1>
      </div>
      <div className="grid gap-4">
        {COURSES.map((course) => {
          const completed = completedCounts[course.id] ?? 0;
          const total = course.steps.length;
          const pct = total > 0 ? (completed / total) * 100 : 0;

          return (
            <button
              key={course.id}
              onClick={() => onSelectCourse(course)}
              className="text-left p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-primary-500/50 hover:bg-[var(--bg-secondary)]/80 transition-all duration-200 group"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{course.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-semibold">
                      {t.courses[course.nameKey as keyof typeof t.courses] ?? course.nameKey}
                    </h3>
                    <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-primary-500 transition-colors" />
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mb-3">
                    {t.courses[course.descriptionKey as keyof typeof t.courses] ?? course.descriptionKey}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                      {completed} {t.courses.of} {total}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Journey Map View ────────────────────────────────────────────────

function JourneyMapView({
  course,
  onBack,
  onStartLesson,
  t,
}: {
  course: CourseDefinition;
  onBack: () => void;
  onStartLesson: (stepIndex: number) => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const [steps, setSteps] = useState<CourseStepProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProgress = useCallback(async () => {
    await initializeCourseProgress(course.id, course.steps.length);
    const progress = await getCourseProgress(course.id);
    setSteps(progress);
    setLoading(false);
  }, [course.id, course.steps.length]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const completedCount = steps.filter((s) => s.status === "completed").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span>{course.icon}</span>
            {t.courses[course.nameKey as keyof typeof t.courses] ?? course.nameKey}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {completedCount} {t.courses.of} {course.steps.length} {t.courses.stepsCompleted}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-500"
            style={{ width: `${(completedCount / course.steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Course completed message */}
      {completedCount === course.steps.length && (
        <div className="mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <h3 className="font-semibold text-green-400">{t.courses.courseCompleted}</h3>
          <p className="text-sm text-[var(--text-muted)]">{t.courses.courseCompletedDesc}</p>
        </div>
      )}

      {/* Steps list */}
      <div className="space-y-1">
        {course.steps.map((step, index) => {
          const progress = steps[index];
          const status = progress?.status ?? "locked";
          const isClickable = status === "available" || status === "in_progress" || status === "completed";

          return (
            <button
              key={index}
              onClick={() => isClickable && onStartLesson(index)}
              disabled={!isClickable}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isClickable
                  ? "hover:bg-[var(--bg-secondary)] cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              {/* Status icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  status === "completed"
                    ? "bg-green-500/20 text-green-400"
                    : status === "in_progress"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : status === "available"
                    ? "bg-primary-500/20 text-primary-400"
                    : "bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                }`}
              >
                {status === "completed" ? (
                  <Check className="w-4 h-4" />
                ) : status === "in_progress" ? (
                  <Play className="w-3.5 h-3.5" />
                ) : status === "available" ? (
                  <span className="text-xs font-bold">{index + 1}</span>
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Step info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)]">
                    {t.courses.step} {index + 1}
                  </span>
                  {status === "in_progress" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-medium">
                      {t.courses.inProgress}
                    </span>
                  )}
                </div>
                <p className={`text-sm truncate ${status === "locked" ? "text-[var(--text-muted)]" : ""}`}>
                  {getLocalizedStepTitle(t, course.id, index, step.topicTitle)}
                </p>
              </div>

              {/* Arrow for clickable items */}
              {isClickable && (
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Lesson View ─────────────────────────────────────────────────────

function LessonView({
  course,
  stepIndex,
  onBack,
  onNextStep,
  t,
  language,
}: {
  course: CourseDefinition;
  stepIndex: number;
  onBack: () => void;
  onNextStep: () => void;
  t: ReturnType<typeof useTranslation>["t"];
  language: string;
}) {
  const store = useCourseStore();
  const settings = useSettingsStore();
  const setSidebarHidden = useAppStore((s) => s.setSidebarHidden);
  const navigate = useNavigate();
  const [errorModalInfo, setErrorModalInfo] = useState<ErrorDisplayInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const greetingSentRef = useRef(false);
  const step = course.steps[stepIndex];
  const hasNextStep = stepIndex + 1 < course.steps.length;

  // Hide sidebar on mount, restore on unmount
  useEffect(() => {
    setSidebarHidden(true);
    return () => {
      useAppStore.getState().setSidebarHidden(false);
    };
  }, [setSidebarHidden]);

  // Initialize lesson
  useEffect(() => {
    greetingSentRef.current = false;

    async function init() {
      const progress = await getCourseStepProgress(course.id, stepIndex);
      const existingMessages = progress?.messages ?? [];
      const isCompleted = progress?.status === "completed";

      store.startLesson(course.id, stepIndex, existingMessages);
      if (isCompleted) {
        store.setLessonCompleted(true);
        store.setLessonProgress(100);
      }

      // Mark step as in_progress if it was available
      if (progress?.status === "available") {
        await startCourseStep(course.id, stepIndex);
      }

      // Send greeting if no messages
      if (existingMessages.length === 0 && !isCompleted) {
        sendGreeting();
      }
    }

    init();

    return () => {
      // Save messages on unmount
      const state = useCourseStore.getState();
      if (state.messages.length > 0) {
        updateCourseStepMessages(course.id, stepIndex, state.messages);
      }
      store.reset();
    };
  }, [course.id, stepIndex]);

  const sendGreeting = useCallback(async () => {
    if (greetingSentRef.current) return;
    greetingSentRef.current = true;

    try {
      const patientNotes = await getPatientNotes();

      const greetingPrompt = buildCourseLessonGreetingPrompt({
        topicTitle: step.topicTitle,
        stepIndex,
        totalSteps: course.steps.length,
        courseName: course.nameKey,
        patientNotes,
        language: language as any,
        provider: settings.provider,
      });

      const abortController = new AbortController();
      useCourseStore.getState().setAbortController(abortController);
      useCourseStore.getState().startStreaming();

      await streamMessage({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: [{ id: "greeting-trigger", role: "user", content: COURSE_LESSON_TRIGGER, timestamp: new Date().toISOString() }],
        systemPrompt: greetingPrompt,
        customBaseUrl: settings.customBaseUrl || undefined,
        thinkingEnabled: settings.thinkingEnabled,
        thinkingLevel: settings.thinkingLevel,
        thinkingType: settings.thinkingType,
        abortSignal: abortController.signal,
        onThinking: (chunk) => useCourseStore.getState().appendStreamThinking(chunk),
        onContent: (chunk) => {
          const cleaned = stripMarkers(chunk);
          if (cleaned) useCourseStore.getState().appendStreamContent(cleaned);
        },
        onDone: () => {
          const state = useCourseStore.getState();
          const lastMsg = state.messages.find((m) => m.id === state.streamingMessageId);
          if (lastMsg) {
            const fullContent = lastMsg.content;
            const progress = extractProgress(fullContent);
            if (progress !== null) useCourseStore.getState().setLessonProgress(progress);
            const hasMarker = fullContent.includes("<<<STEP_COMPLETE>>>");
            // Clean all markers from message
            useCourseStore.setState((s) => ({
              messages: s.messages.map((m) =>
                m.id === state.streamingMessageId
                  ? { ...m, content: stripMarkers(m.content) }
                  : m
              ),
            }));
            if (hasMarker) {
              useCourseStore.getState().setLessonProgress(100);
              handleStepComplete();
            }
          }
          useCourseStore.getState().finishStreaming();
          updateCourseStepMessages(course.id, stepIndex, useCourseStore.getState().messages);
        },
        onUsage: (usage) => {
          trackUsage(settings.provider, settings.model, usage);
          useCourseStore.getState().setCurrentInputTokens(usage.inputTokens);
        },
        onError: (error) => {
          const s = useCourseStore.getState();
          if (s.streamingMessageId) s.removeMessage(s.streamingMessageId);
          s.finishStreaming();
          greetingSentRef.current = false;
          const statusCode = error instanceof AIError ? error.statusCode : undefined;
          setErrorModalInfo(getErrorDisplayInfo(t, statusCode, settings.provider));
        },
      });
    } catch (err) {
      useCourseStore.getState().finishStreaming();
      greetingSentRef.current = false;
      const statusCode = err instanceof AIError ? err.statusCode : undefined;
      setErrorModalInfo(getErrorDisplayInfo(t, statusCode, settings.provider));
    }
  }, [course, stepIndex, step, settings, language, t]);

  const handleStepComplete = useCallback(async () => {
    useCourseStore.getState().setLessonCompleted(true);
    await completeCourseStep(course.id, stepIndex);

    // Fire background notes update
    Promise.all([getPatientNotes(), getPatientNotesUpdatedAt()]).then(([existingNotes, notesUpdatedAt]) => {
      const patientNotesPrompt = buildPatientNotesUpdatePrompt(existingNotes, notesUpdatedAt, language as any);
      const notesMessage = buildCourseLessonNotesMessage(step.topicTitle, stepIndex);
      const msgs = useCourseStore.getState().messages;
      const conversationForNotes: ChatMessage[] = [
        ...msgs.filter((m) => !m.isStreaming),
        { id: "notes-context", role: "user", content: notesMessage, timestamp: new Date().toISOString() },
        { id: "notes-request", role: "user", content: patientNotesPrompt, timestamp: new Date().toISOString() },
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
        callType: "course_lesson",
      });
    });
  }, [course.id, stepIndex, step.topicTitle, settings, language]);

  const performCompaction = useCallback(async () => {
    const state = useCourseStore.getState();
    if (state.isCompacting || state.isStreaming) return;

    state.startCompaction();
    try {
      const patientNotes = await getPatientNotes();
      const systemPrompt = buildCourseLessonSystemPrompt({
        topicTitle: step.topicTitle,
        stepIndex,
        totalSteps: course.steps.length,
        courseName: course.nameKey,
        patientNotes,
        language: language as any,
        provider: settings.provider,
      });

      const compactionPrompt = buildCompactionPrompt(language as any);
      const effectiveMsgs = getEffectiveMessages(
        state.messages.filter((m) => !m.isStreaming),
        state.compactedContext,
        state.compactedAtIndex,
      );

      const result = await sendMessage({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: [
          ...effectiveMsgs,
          { id: "compaction-request", role: "user", content: compactionPrompt, timestamp: new Date().toISOString() },
        ],
        systemPrompt,
        customBaseUrl: settings.customBaseUrl || undefined,
      });

      trackUsage(settings.provider, settings.model, result.usage);
      useCourseStore.getState().applyCompaction(result.content);
      useCourseStore.getState().finishCompaction();
    } catch {
      useCourseStore.getState().finishCompaction();
    }
  }, [course, stepIndex, step, settings, language]);

  const handleSendMessage = useCallback(async (content: string) => {
    const { isStreaming, lessonCompleted } = useCourseStore.getState();
    if (isStreaming || lessonCompleted) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    useCourseStore.getState().addMessage(userMsg);

    try {
      const patientNotes = await getPatientNotes();

      const systemPrompt = buildCourseLessonSystemPrompt({
        topicTitle: step.topicTitle,
        stepIndex,
        totalSteps: course.steps.length,
        courseName: course.nameKey,
        patientNotes,
        language: language as any,
        provider: settings.provider,
      });

      const state = useCourseStore.getState();
      const effectiveMessages = getEffectiveMessages(
        state.messages.filter((m) => !m.isStreaming),
        state.compactedContext,
        state.compactedAtIndex,
      );

      const abortController = new AbortController();
      useCourseStore.getState().setAbortController(abortController);
      useCourseStore.getState().startStreaming();

      let accumulatedContent = "";

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
        onThinking: (chunk) => useCourseStore.getState().appendStreamThinking(chunk),
        onContent: (chunk) => {
          accumulatedContent += chunk;
          const displayContent = stripMarkers(accumulatedContent);
          const { streamingMessageId } = useCourseStore.getState();
          if (streamingMessageId) {
            useCourseStore.setState((s) => ({
              messages: s.messages.map((m) =>
                m.id === streamingMessageId
                  ? { ...m, content: displayContent, isThinkingActive: false }
                  : m
              ),
            }));
          }
        },
        onDone: () => {
          const hasMarker = accumulatedContent.includes("<<<STEP_COMPLETE>>>");
          const progress = extractProgress(accumulatedContent);
          if (progress !== null) useCourseStore.getState().setLessonProgress(progress);
          const cleanContent = stripMarkers(accumulatedContent);

          const { streamingMessageId } = useCourseStore.getState();
          if (streamingMessageId) {
            useCourseStore.setState((s) => ({
              messages: s.messages.map((m) =>
                m.id === streamingMessageId
                  ? { ...m, content: cleanContent, isStreaming: false, isThinkingActive: false }
                  : m
              ),
              isStreaming: false,
              streamingMessageId: null,
              abortController: null,
              isLoading: false,
            }));
          } else {
            useCourseStore.setState({ isStreaming: false, streamingMessageId: null, abortController: null, isLoading: false });
          }

          if (hasMarker) {
            useCourseStore.getState().setLessonProgress(100);
            handleStepComplete();
          }

          updateCourseStepMessages(course.id, stepIndex, useCourseStore.getState().messages);
        },
        onUsage: (usage) => {
          trackUsage(settings.provider, settings.model, usage);
          useCourseStore.getState().setCurrentInputTokens(usage.inputTokens);
        },
        onError: (error) => {
          const s = useCourseStore.getState();
          if (s.streamingMessageId) s.removeMessage(s.streamingMessageId);
          s.finishStreaming();
          const statusCode = error instanceof AIError ? error.statusCode : undefined;
          setErrorModalInfo(getErrorDisplayInfo(t, statusCode, settings.provider));
        },
      });

      // Check compaction
      const providerConfig = getProvider(settings.provider);
      const modelConfig = providerConfig?.models.find((m) => m.id === settings.model);
      const ctxWindow = modelConfig?.contextWindow ?? 0;
      const { currentInputTokens } = useCourseStore.getState();
      if (ctxWindow > 0 && currentInputTokens >= ctxWindow * 0.8) {
        await performCompaction();
      }
    } catch (err) {
      useCourseStore.getState().finishStreaming();
      const statusCode = err instanceof AIError ? err.statusCode : undefined;
      setErrorModalInfo(getErrorDisplayInfo(t, statusCode, settings.provider));
    }
  }, [course, stepIndex, step, settings, language, t, handleStepComplete, performCompaction]);

  const handleMarkComplete = useCallback(async () => {
    setMenuOpen(false);
    await handleStepComplete();
    updateCourseStepMessages(course.id, stepIndex, useCourseStore.getState().messages);
  }, [course.id, stepIndex, handleStepComplete]);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-color)]/50 bg-[var(--bg-primary)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const state = useCourseStore.getState();
              if (state.messages.length > 0) {
                updateCourseStepMessages(course.id, stepIndex, state.messages);
              }
              onBack();
            }}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">
                {t.courses.step} {stepIndex + 1} {t.courses.of} {course.steps.length}
              </span>
            </div>
            <h2 className="text-sm font-semibold truncate max-w-[400px]">{getLocalizedStepTitle(t, course.id, stepIndex, step.topicTitle)}</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Lesson progress */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">{t.courses.progress}</span>
            <div className="w-24 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-500 transition-all duration-700"
                style={{ width: `${store.lessonProgress}%` }}
              />
            </div>
            <span className="text-xs text-[var(--text-muted)] tabular-nums w-8 text-right">
              {store.lessonProgress}%
            </span>
          </div>
          {/* Menu */}
          {!store.lessonCompleted && (
            <>
              <div className="w-px h-4 bg-[var(--border-color)]" />
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-[var(--text-muted)]" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-xl py-1 min-w-[180px]">
                      <button
                        onClick={handleMarkComplete}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        {t.courses.markComplete}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chat */}
      <ChatContainer
        messages={store.messages}
        isLoading={store.isLoading}
        isStreaming={store.isStreaming}
        isCompacting={store.isCompacting}
      />

      {/* Completion banner */}
      {store.lessonCompleted && (
        <div className="px-4 py-3 bg-green-500/10 border-t border-green-500/20">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium text-green-400">{t.courses.lessonCompleted}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={onBack}>
                {t.courses.backToCourse}
              </Button>
              {hasNextStep && (
                <Button size="sm" onClick={onNextStep}>
                  {t.courses.nextStep}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      {!store.lessonCompleted && (
        <ChatInput
          onSend={handleSendMessage}
          disabled={store.isLoading || store.isStreaming || store.isCompacting}
        />
      )}

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

// ─── Main Page ───────────────────────────────────────────────────────

export default function CoursesPage() {
  const { t, language } = useTranslation();
  const [view, setView] = useState<View>("list");
  const [selectedCourse, setSelectedCourse] = useState<CourseDefinition | null>(null);
  const [selectedStep, setSelectedStep] = useState<number>(0);

  const handleSelectCourse = useCallback((course: CourseDefinition) => {
    setSelectedCourse(course);
    setView("journey");
  }, []);

  const handleStartLesson = useCallback((stepIndex: number) => {
    setSelectedStep(stepIndex);
    setView("lesson");
  }, []);

  const handleBackToJourney = useCallback(() => {
    setView("journey");
    // Force re-mount of JourneyMapView to reload progress
    setSelectedCourse((prev) => prev ? { ...prev } : prev);
  }, []);

  const handleNextStep = useCallback(() => {
    setSelectedStep((prev) => prev + 1);
    // Force re-mount of LessonView
    setView("list");
    setTimeout(() => setView("lesson"), 0);
  }, []);

  if (view === "lesson" && selectedCourse) {
    return (
      <LessonView
        key={`${selectedCourse.id}-${selectedStep}`}
        course={selectedCourse}
        stepIndex={selectedStep}
        onBack={handleBackToJourney}
        onNextStep={handleNextStep}
        t={t}
        language={language}
      />
    );
  }

  if (view === "journey" && selectedCourse) {
    return (
      <JourneyMapView
        key={selectedCourse.id}
        course={selectedCourse}
        onBack={() => setView("list")}
        onStartLesson={handleStartLesson}
        t={t}
      />
    );
  }

  return <CourseListView onSelectCourse={handleSelectCourse} t={t} />;
}
