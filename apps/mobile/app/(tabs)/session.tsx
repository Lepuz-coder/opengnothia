import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { MessageSquare, Play } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { intakeFormHasContent } from "@opengnothia/shared/db/queries";
import type { PatientIntakeForm } from "@opengnothia/shared/types";
import { useAIErrorHandler } from "@/ai/useAIErrorHandler";
import { getQueries } from "@/db";
import { useProGate } from "@/hooks/useProGate";
import { showToast } from "@/stores/useToastStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, Card, DataLoadError, LockBadge } from "@/ui";
import { MoodPickerSheet } from "@/features/dashboard/MoodPicker";
import { IntakeCard } from "@/features/session/IntakeCard";
import { IntakeFormSheet } from "@/features/session/IntakeFormSheet";
import { PastSessionList, type PastSessionRow } from "@/features/session/PastSessionList";
import { SessionModal } from "@/features/session/SessionModal";
import { startSessionInDb, streamGreeting } from "@/features/session/sessionActions";

/**
 * The session tab's idle surface (Steps 41+46): start CTA (gated, M3), intake
 * card, note-taking banner and past-session history — desktop SessionPage's
 * pre-session view. The running session itself lives in SessionModal.
 */
export default function SessionScreen() {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const router = useRouter();
  const { gate } = useProGate();
  // The greeting this screen kicks off streams while the fullscreen session
  // modal is already up — a paywall route pushed from there would natively
  // dismiss the modal (and strand the active session), so its errors stay
  // in-modal toasts like every other in-session AI call.
  const handleAIError = useAIErrorHandler({ modalHosted: true });

  const status = useSessionStore((s) => s.status);
  const notesPreparing = useSessionStore((s) => s.noteTakingStartedAt !== null);

  const [sessions, setSessions] = useState<PastSessionRow[]>([]);
  const [intakeForm, setIntakeForm] = useState<PatientIntakeForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [moodSheetOpen, setMoodSheetOpen] = useState(false);
  const [intakeSheetOpen, setIntakeSheetOpen] = useState(false);
  const [intakeAllowSkip, setIntakeAllowSkip] = useState(false);
  const [intakeFirstPrompt, setIntakeFirstPrompt] = useState(false);
  const pendingStartRef = useRef(false);
  const pendingMoodRef = useRef<number | null>(null);
  const previousStatusRef = useRef(status);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const queries = await getQueries();
      const [completed, intake] = await Promise.all([
        queries.getCompletedSessions(),
        queries.getPatientIntakeForm(),
      ]);
      setSessions(completed);
      setIntakeForm(intake);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  // A finished (or discarded) session returns the store to idle while this
  // screen stays mounted — refresh the history without a tab switch.
  useEffect(() => {
    const previousStatus = previousStatusRef.current;
    previousStatusRef.current = status;
    if (previousStatus !== "idle" && status === "idle") void loadData();
  }, [status, loadData]);

  const beginSession = useCallback(
    async (moodBefore: number) => {
      try {
        await startSessionInDb(moodBefore);
        void streamGreeting(handleAIError);
      } catch {
        showToast(t.errors.generic, "error");
      }
    },
    [handleAIError, t]
  );

  const beginStartFlow = useCallback(async () => {
    if (useSessionStore.getState().noteTakingStartedAt !== null) {
      showToast(t.session.noteTakingStartBlocked, "info");
      return;
    }
    try {
      // Desktop's first-session nudge (Step 41 / M11): an empty intake prompts
      // once, skippable, and the start flow resumes after save or skip.
      const queries = await getQueries();
      const latestIntake = await queries.getPatientIntakeForm();
      const { hasSeenIntakePrompt, setHasSeenIntakePrompt } = useSettingsStore.getState();
      if (!intakeFormHasContent(latestIntake) && !hasSeenIntakePrompt) {
        setHasSeenIntakePrompt(true);
        pendingStartRef.current = true;
        setIntakeFirstPrompt(true);
        setIntakeAllowSkip(true);
        setIntakeSheetOpen(true);
        return;
      }
      setMoodSheetOpen(true);
    } catch {
      showToast(t.errors.generic, "error");
    }
  }, [t]);

  const handleStartPress = () => gate(() => void beginStartFlow());

  // Step 53: the dashboard hero lands here with ?start=<timestamp> (already
  // gated there); each tap carries a fresh value, so the effect retriggers.
  const { start } = useLocalSearchParams<{ start?: string }>();
  useEffect(() => {
    if (!start) return;
    if (useSessionStore.getState().status !== "idle") return;
    void beginStartFlow();
  }, [start, beginStartFlow]);

  const openIntakeForEdit = () => {
    pendingStartRef.current = false;
    setIntakeFirstPrompt(false);
    setIntakeAllowSkip(false);
    setIntakeSheetOpen(true);
  };

  return (
    <>
      {loading ? (
        <View className="flex-1 items-center justify-center bg-canvas">
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : loadError ? (
        <DataLoadError onRetry={() => void loadData()} />
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 py-4">
          {notesPreparing && (
            <Card className="border-primary-500/30 bg-primary-500/10">
              <View className="flex-row items-center gap-3">
                <ActivityIndicator size="small" color={colors.tint} />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-ink">{t.session.noteTakingModalTitle}</Text>
                  <Text className="mt-0.5 text-xs leading-relaxed text-ink-mute">
                    {t.session.noteTakingModalDescription}
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* The IntakeCard promo shell in primary teal — the two cards read
              as a matching pair on this screen. */}
          <Card className="overflow-hidden rounded-3xl border-primary-500/20 p-5">
            <View className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primary-500/5" />
            <View className="absolute -right-6 -top-14 h-40 w-40 rounded-full bg-primary-500/10" />

            <View className="flex-row items-center gap-4">
              <View className="h-14 w-14 items-center justify-center rounded-2xl border border-primary-500/30 bg-primary-500/20">
                <MessageSquare size={26} color={colors.tint} />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400">
                  {t.session.startHeroLabel}
                </Text>
                <Text className="mt-1 text-lg font-bold leading-snug text-ink">{t.session.startHeroTitle}</Text>
              </View>
            </View>

            <View className="mt-4 flex-row items-center gap-2.5">
              <Button
                size="lg"
                className="flex-1"
                icon={<Play size={18} color="#fff" />}
                disabled={notesPreparing}
                onPress={handleStartPress}
              >
                {t.session.startSession}
              </Button>
              <LockBadge />
            </View>
          </Card>

          <IntakeCard intakeForm={intakeForm} onPress={openIntakeForEdit} />

          <PastSessionList sessions={sessions} onPress={(s) => router.push(`/session/${s.id}`)} />
        </ScrollView>
      )}

      {/* Step 41: pre-session mood — selecting starts the session. */}
      <MoodPickerSheet
        isOpen={moodSheetOpen}
        title={t.session.moodBeforeQuestion}
        initialMood={null}
        onSelect={(mood) => {
          pendingMoodRef.current = mood;
        }}
        onClose={() => {
          setMoodSheetOpen(false);
          const mood = pendingMoodRef.current;
          pendingMoodRef.current = null;
          if (mood !== null) {
            // Let the sheet's dismissal finish before the fullscreen session
            // modal presents — two sibling modals must not overlap.
            setTimeout(() => void beginSession(mood), 150);
          }
        }}
      />

      <IntakeFormSheet
        visible={intakeSheetOpen}
        initialData={intakeForm}
        allowSkip={intakeAllowSkip}
        isFirstSessionPrompt={intakeFirstPrompt}
        onClose={() => setIntakeSheetOpen(false)}
        onSaved={(updated) => {
          if (updated) setIntakeForm(updated);
          if (pendingStartRef.current) {
            pendingStartRef.current = false;
            setIntakeFirstPrompt(false);
            setTimeout(() => setMoodSheetOpen(true), 350);
          }
        }}
      />

      <SessionModal />
    </>
  );
}
