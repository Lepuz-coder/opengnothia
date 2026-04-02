import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useCourseStore } from "@/stores/useCourseStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "@/i18n";
import { COURSES, type CourseDefinition } from "@/constants/courses";
import {
  initializeCourseProgress,
  getCourseProgress,
  getCourseStepProgress,
  startCourseStep,
  completeCourseStep,
  updateCourseStepMessages,
  updateCourseStepProgress,
  getCourseNotes,
  getCourseNotesUpdatedAt,
  saveTokenUsage,
} from "@/services/db/queries";
import { streamMessage, sendMessage } from "@/services/ai/aiService";
import { AIError } from "@/services/ai/AIError";
import { getErrorDisplayInfo, type ErrorDisplayInfo } from "@/services/ai/errorMessages";
import { calculateCost } from "@/services/ai/costCalculator";
import {
  buildCourseLessonSystemPrompt,
  buildCourseLessonGreetingPrompt,
  buildCourseLessonCompactionPrompt,
  buildCourseLessonNotesUpdateMessage,
  buildCourseNotesUpdatePrompt,
  COURSE_LESSON_TRIGGER,
} from "@/services/ai/coursePromptBuilder";
import { updateCourseNotes } from "@/services/ai/courseNotes";
import { getProvider } from "@/constants/providers";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { Button } from "@/components/ui/Button";
import { ErrorModal } from "@/components/ui/ErrorModal";
import type { ChatMessage, CourseStepProgress, TokenUsage } from "@/types";
import { ArrowLeft, Lock, Check, Play, Loader2, ChevronRight, CheckCircle2, MoreVertical } from "lucide-react";

type View = "list" | "journey" | "lesson";
type CourseStats = {
  completedCount: number;
  overallProgress: number;
};

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

function getLocalizedCourseName(
  t: ReturnType<typeof useTranslation>["t"],
  course: CourseDefinition,
): string {
  const localized = t.courses[course.nameKey as keyof typeof t.courses];
  return typeof localized === "string" ? localized : course.nameKey;
}

function clampProgress(progress: number): number {
  return Math.max(0, Math.min(Math.round(progress), 100));
}

function getStepCompletionPercentage(progress?: CourseStepProgress | null): number {
  if (!progress) return 0;
  if (progress.status === "completed") return 100;
  return clampProgress(progress.progress ?? 0);
}

function calculateCourseProgress(steps: CourseStepProgress[], totalSteps: number): number {
  if (totalSteps === 0) return 0;
  const totalCompletion = steps.reduce((sum, step) => sum + getStepCompletionPercentage(step), 0);
  return clampProgress(totalCompletion / totalSteps);
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
  return match ? clampProgress(parseInt(match[1], 10)) : null;
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
  const [courseStats, setCourseStats] = useState<Record<string, CourseStats>>({});

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const entries = await Promise.all(
        COURSES.map(async (course) => {
          await initializeCourseProgress(course.id, course.steps.length);
          const progress = await getCourseProgress(course.id);
          return [
            course.id,
            {
              completedCount: progress.filter((step) => step.status === "completed").length,
              overallProgress: calculateCourseProgress(progress, course.steps.length),
            },
          ] as const;
        }),
      );

      if (!cancelled) {
        setCourseStats(Object.fromEntries(entries));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t.courses.title}</h1>
      </div>
      <div className="grid gap-4">
        {COURSES.map((course) => {
          const stats = courseStats[course.id];
          const completed = stats?.completedCount ?? 0;
          const total = course.steps.length;
          const pct = stats?.overallProgress ?? 0;

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
                      {completed} {t.courses.of} {total} ({pct}%)
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
  const overallProgress = calculateCourseProgress(steps, course.steps.length);

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
            {completedCount} {t.courses.of} {course.steps.length} {t.courses.stepsCompleted} ({overallProgress}%)
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
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
                {status === "in_progress" && (progress?.progress ?? 0) > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-yellow-500 transition-all duration-500"
                        style={{ width: `${progress!.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                      {progress!.progress}%
                    </span>
                  </div>
                )}
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
  const [isSavingCourseNotes, setIsSavingCourseNotes] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const greetingSentRef = useRef(false);
  const lessonInstanceRef = useRef("");
  const step = course.steps[stepIndex];
  const hasNextStep = stepIndex + 1 < course.steps.length;
  const localizedCourseName = getLocalizedCourseName(t, course);

  const isLessonInstanceActive = useCallback((instanceId: string) => {
    return lessonInstanceRef.current === instanceId;
  }, []);

  const persistMessages = useCallback((messages: ChatMessage[]) => {
    if (messages.length === 0) return;
    void updateCourseStepMessages(course.id, stepIndex, messages);
  }, [course.id, stepIndex]);

  const saveCourseLessonNotes = useCallback(async (completedMessages: ChatMessage[]) => {
    const [existingNotes, notesUpdatedAt] = await Promise.all([
      getCourseNotes(course.id),
      getCourseNotesUpdatedAt(course.id),
    ]);

    const systemPrompt = buildCourseNotesUpdatePrompt(existingNotes, notesUpdatedAt, language as any);
    const notesMessage = buildCourseLessonNotesUpdateMessage({
      courseName: localizedCourseName,
      topicTitle: step.topicTitle,
      stepIndex,
      totalSteps: course.steps.length,
    });
    const conversationForNotes: ChatMessage[] = [
      ...completedMessages,
      {
        id: "course-notes-context",
        role: "user",
        content: notesMessage,
        timestamp: new Date().toISOString(),
      },
    ];

    await updateCourseNotes({
      courseId: course.id,
      provider: settings.provider,
      apiKey: settings.apiKey,
      model: settings.memoryModel,
      messages: conversationForNotes,
      systemPrompt,
      customBaseUrl: settings.customBaseUrl || undefined,
      thinkingEnabled: settings.memoryThinkingEnabled,
      thinkingLevel: settings.memoryThinkingLevel,
      thinkingType: settings.memoryThinkingType,
      callType: "course_lesson",
    });
  }, [course.id, course.steps.length, language, localizedCourseName, settings, step.topicTitle, stepIndex]);

  // Hide sidebar on mount, restore on unmount
  useEffect(() => {
    setSidebarHidden(true);
    return () => {
      useAppStore.getState().setSidebarHidden(false);
    };
  }, [setSidebarHidden]);

  // Initialize lesson
  useEffect(() => {
    const instanceId = crypto.randomUUID();
    lessonInstanceRef.current = instanceId;
    greetingSentRef.current = false;

    async function init() {
      const progress = await getCourseStepProgress(course.id, stepIndex);
      if (!isLessonInstanceActive(instanceId)) return;
      const existingMessages = progress?.messages ?? [];
      const isCompleted = progress?.status === "completed";

      useCourseStore.getState().startLesson(course.id, stepIndex, existingMessages);
      if (isCompleted) {
        useCourseStore.getState().setLessonCompleted(true);
        useCourseStore.getState().setLessonProgress(100);
      } else if (progress?.progress) {
        useCourseStore.getState().setLessonProgress(progress.progress);
      }

      // Mark step as in_progress if it was available
      if (progress?.status === "available") {
        await startCourseStep(course.id, stepIndex);
        if (!isLessonInstanceActive(instanceId)) return;
      }

      // Send greeting if no messages
      if (existingMessages.length === 0 && !isCompleted) {
        void sendGreeting();
      }
    }

    void init();

    return () => {
      if (lessonInstanceRef.current !== instanceId) return;

      lessonInstanceRef.current = "";

      const currentState = useCourseStore.getState();
      if (currentState.abortController || currentState.isStreaming) {
        currentState.cancelStreaming();
      }
      persistMessages(useCourseStore.getState().messages);
      useCourseStore.getState().reset();
    };
  }, [course.id, stepIndex, isLessonInstanceActive, persistMessages]);

  const handleStepComplete = useCallback(async (messagesSnapshot?: ChatMessage[]) => {
    const state = useCourseStore.getState();
    if (state.lessonCompleted) return;
    const instanceId = lessonInstanceRef.current;

    const completedMessages = (messagesSnapshot ?? state.messages).filter((message) => !message.isStreaming);
    state.setLessonProgress(100);
    state.setLessonCompleted(true);
    setIsSavingCourseNotes(true);
    try {
      await completeCourseStep(course.id, stepIndex);
      try {
        await saveCourseLessonNotes(completedMessages);
      } catch {
        // Best-effort course memory update
      }
    } finally {
      if (isLessonInstanceActive(instanceId)) {
        setIsSavingCourseNotes(false);
      }
    }
  }, [course.id, isLessonInstanceActive, saveCourseLessonNotes, stepIndex]);

  const sendGreeting = useCallback(async () => {
    if (greetingSentRef.current) return;
    greetingSentRef.current = true;
    const instanceId = lessonInstanceRef.current;

    try {
      const courseNotes = await getCourseNotes(course.id);
      if (!isLessonInstanceActive(instanceId)) return;

      const greetingPrompt = buildCourseLessonGreetingPrompt({
        topicTitle: step.topicTitle,
        stepIndex,
        totalSteps: course.steps.length,
        courseName: localizedCourseName,
        courseNotes,
        language: language as any,
        provider: settings.provider,
      });

      const abortController = new AbortController();
      useCourseStore.getState().setAbortController(abortController);
      useCourseStore.getState().startStreaming();
      let accumulatedContent = "";

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
        onThinking: (chunk) => {
          if (!isLessonInstanceActive(instanceId)) return;
          useCourseStore.getState().appendStreamThinking(chunk);
        },
        onContent: (chunk) => {
          if (!isLessonInstanceActive(instanceId)) return;
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
          if (!isLessonInstanceActive(instanceId)) return;

          const hasMarker = accumulatedContent.includes("<<<STEP_COMPLETE>>>");
          const progress = extractProgress(accumulatedContent);
          if (progress !== null) {
            useCourseStore.getState().setLessonProgress(progress);
            void updateCourseStepProgress(course.id, stepIndex, progress);
          }
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

          const currentMessages = useCourseStore.getState().messages;
          if (hasMarker) {
            useCourseStore.getState().setLessonProgress(100);
            void updateCourseStepProgress(course.id, stepIndex, 100);
            void handleStepComplete(currentMessages);
          }

          persistMessages(currentMessages);
        },
        onUsage: (usage) => {
          trackUsage(settings.provider, settings.model, usage);
          if (isLessonInstanceActive(instanceId)) {
            useCourseStore.getState().setCurrentInputTokens(usage.inputTokens);
          }
        },
        onError: (error) => {
          if (!isLessonInstanceActive(instanceId)) return;
          const s = useCourseStore.getState();
          if (s.streamingMessageId) s.removeMessage(s.streamingMessageId);
          s.finishStreaming();
          greetingSentRef.current = false;
          const statusCode = error instanceof AIError ? error.statusCode : undefined;
          setErrorModalInfo(getErrorDisplayInfo(t, statusCode, settings.provider));
        },
      });
    } catch (err) {
      if (!isLessonInstanceActive(instanceId)) return;
      useCourseStore.getState().finishStreaming();
      greetingSentRef.current = false;
      const statusCode = err instanceof AIError ? err.statusCode : undefined;
      setErrorModalInfo(getErrorDisplayInfo(t, statusCode, settings.provider));
    }
  }, [course.steps.length, handleStepComplete, isLessonInstanceActive, language, localizedCourseName, persistMessages, settings, step, stepIndex, t]);

  const performCompaction = useCallback(async () => {
    const state = useCourseStore.getState();
    if (state.isCompacting || state.isStreaming) return;
    const instanceId = lessonInstanceRef.current;

    state.startCompaction();
    try {
      const courseNotes = await getCourseNotes(course.id);
      if (!isLessonInstanceActive(instanceId)) return;
      const systemPrompt = buildCourseLessonSystemPrompt({
        topicTitle: step.topicTitle,
        stepIndex,
        totalSteps: course.steps.length,
        courseName: localizedCourseName,
        courseNotes,
        language: language as any,
        provider: settings.provider,
      });

      const compactionPrompt = buildCourseLessonCompactionPrompt(language as any);
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
      if (isLessonInstanceActive(instanceId)) {
        useCourseStore.getState().applyCompaction(result.content);
        useCourseStore.getState().finishCompaction();
      }
    } catch {
      if (isLessonInstanceActive(instanceId)) {
        useCourseStore.getState().finishCompaction();
      }
    }
  }, [course.id, course.steps.length, isLessonInstanceActive, language, localizedCourseName, settings, step, stepIndex]);

  const handleSendMessage = useCallback(async (content: string) => {
    const { isStreaming, lessonCompleted } = useCourseStore.getState();
    if (isStreaming || lessonCompleted) return;
    const instanceId = lessonInstanceRef.current;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    useCourseStore.getState().addMessage(userMsg);

    try {
      const courseNotes = await getCourseNotes(course.id);
      if (!isLessonInstanceActive(instanceId)) return;

      const systemPrompt = buildCourseLessonSystemPrompt({
        topicTitle: step.topicTitle,
        stepIndex,
        totalSteps: course.steps.length,
        courseName: localizedCourseName,
        courseNotes,
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
        onThinking: (chunk) => {
          if (!isLessonInstanceActive(instanceId)) return;
          useCourseStore.getState().appendStreamThinking(chunk);
        },
        onContent: (chunk) => {
          if (!isLessonInstanceActive(instanceId)) return;
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
          if (!isLessonInstanceActive(instanceId)) return;
          const hasMarker = accumulatedContent.includes("<<<STEP_COMPLETE>>>");
          const progress = extractProgress(accumulatedContent);
          if (progress !== null) {
            useCourseStore.getState().setLessonProgress(progress);
            void updateCourseStepProgress(course.id, stepIndex, progress);
          }
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

          const currentMessages = useCourseStore.getState().messages;
          if (hasMarker) {
            useCourseStore.getState().setLessonProgress(100);
            void updateCourseStepProgress(course.id, stepIndex, 100);
            void handleStepComplete(currentMessages);
          }

          persistMessages(currentMessages);
        },
        onUsage: (usage) => {
          trackUsage(settings.provider, settings.model, usage);
          if (isLessonInstanceActive(instanceId)) {
            useCourseStore.getState().setCurrentInputTokens(usage.inputTokens);
          }
        },
        onError: (error) => {
          if (!isLessonInstanceActive(instanceId)) return;
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
      if (!isLessonInstanceActive(instanceId)) return;
      useCourseStore.getState().finishStreaming();
      const statusCode = err instanceof AIError ? err.statusCode : undefined;
      setErrorModalInfo(getErrorDisplayInfo(t, statusCode, settings.provider));
    }
  }, [course.steps.length, handleStepComplete, isLessonInstanceActive, language, localizedCourseName, performCompaction, persistMessages, settings, step, stepIndex, t]);

  const handleMarkComplete = useCallback(async () => {
    setMenuOpen(false);
    const currentMessages = useCourseStore.getState().messages.filter((message) => !message.isStreaming);
    await handleStepComplete(currentMessages);
    persistMessages(currentMessages);
  }, [handleStepComplete, persistMessages]);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-color)]/50 bg-[var(--bg-primary)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            disabled={isSavingCourseNotes}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50 disabled:cursor-wait"
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
                  disabled={store.isStreaming || store.isCompacting}
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              {isSavingCourseNotes && <Loader2 className="w-4 h-4 text-green-400 animate-spin" />}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={onBack} disabled={isSavingCourseNotes}>
                {t.courses.backToCourse}
              </Button>
              {hasNextStep && (
                <Button size="sm" onClick={onNextStep} disabled={isSavingCourseNotes}>
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
    setView("lesson");
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
