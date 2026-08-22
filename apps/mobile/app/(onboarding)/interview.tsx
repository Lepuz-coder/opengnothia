import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@opengnothia/shared/i18n";
import { useAIErrorHandler } from "@/ai/useAIErrorHandler";
import { showToast } from "@/stores/useToastStore";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, Card, ConfirmSheet } from "@/ui";
import { ChatInput } from "@/features/session/ChatInput";
import { ChatMessages } from "@/features/session/ChatMessages";
import { useInterview } from "@/features/onboarding/useInterview";

/**
 * M11 step 5: the AI getting-to-know-you interview, subscribers only — Faz 5's
 * chat components over the interview hook. Ends either when the AI wraps up
 * (end marker) or via the finish button; both funnel through the extraction
 * save, then land on ready. Skipping is always possible — the intake can be
 * completed later from the session tab's CTA (the M11 fallback).
 */
export default function OnboardingInterviewScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const isPro = useSubscriptionStore((s) => s.isPro);
  const handleAIError = useAIErrorHandler();

  const { messages, isStreaming, startFailed, ended, saveState, userTurnCount, start, send, finishAndSave } =
    useInterview(handleAIError);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (isPro) start();
  }, [isPro, start]);

  const completeAndLeave = async () => {
    if (saveState === "saving") return;
    const saved = await finishAndSave();
    if (saved) {
      showToast(t.onboarding.interviewSavedToast, "success");
      router.push("/ready");
    }
  };

  // The AI closed the interview on its own — run the save without another tap.
  useEffect(() => {
    if (ended && saveState === "idle") void completeAndLeave();
    // completeAndLeave is stable enough for this one-shot; re-running on saveState
    // changes would loop the failed state back into saving.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot on `ended`
  }, [ended]);

  const handleFinishPress = () => {
    if (isStreaming || saveState === "saving") return;
    // Nothing shared yet — nothing to extract; the intake CTA remains later.
    if (userTurnCount === 0) {
      router.push("/ready");
      return;
    }
    setConfirmOpen(true);
  };

  if (!isPro) {
    // Guard for direct/deep navigation: the step only exists for subscribers (M11).
    return <Redirect href="/ready" />;
  }

  const busySaving = saveState === "saving" || (ended && saveState === "idle");

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <View className="flex-row items-center justify-between border-b border-line px-4 py-2.5">
          <Text className="text-base font-semibold text-ink">{t.onboarding.interviewTitle}</Text>
          <Button variant="ghost" size="sm" onPress={handleFinishPress} disabled={busySaving}>
            {t.onboarding.interviewFinish}
          </Button>
        </View>

        {!ended && (
          <Text className="px-4 pb-1 pt-2 text-xs leading-relaxed text-ink-mute">
            {t.onboarding.interviewIntro}
          </Text>
        )}

        {startFailed ? (
          <View className="flex-1 items-center justify-center gap-4 px-6">
            <Button variant="secondary" onPress={start}>
              {t.errors.retryButton}
            </Button>
          </View>
        ) : (
          <ChatMessages messages={messages} />
        )}

        <View style={{ paddingBottom: insets.bottom }}>
          {busySaving ? (
            <View className="flex-row items-center justify-center gap-3 border-t border-line bg-card px-4 py-5">
              <ActivityIndicator size="small" color={colors.tint} />
              <Text className="text-sm text-ink-soft">{t.onboarding.interviewSaving}</Text>
            </View>
          ) : saveState === "failed" ? (
            <Card className="mx-4 mb-3 border-primary-500/30">
              <Text className="text-sm leading-relaxed text-ink-soft">{t.onboarding.interviewSaveFailed}</Text>
              <View className="mt-3 flex-row gap-2.5">
                <Button className="flex-1" onPress={() => void completeAndLeave()}>
                  {t.errors.retryButton}
                </Button>
                <Button variant="secondary" className="flex-1" onPress={() => router.push("/ready")}>
                  {t.onboarding.skipForNow}
                </Button>
              </View>
            </Card>
          ) : (
            !startFailed && <ChatInput disabled={isStreaming} onSend={send} onAIError={handleAIError} />
          )}
        </View>
      </KeyboardAvoidingView>

      <ConfirmSheet
        isOpen={confirmOpen}
        title={t.onboarding.interviewFinishConfirmTitle}
        message={t.onboarding.interviewFinishConfirmMessage}
        confirmLabel={t.onboarding.interviewFinish}
        onConfirm={() => {
          setConfirmOpen(false);
          void completeAndLeave();
        }}
        onClose={() => setConfirmOpen(false)}
      />
    </View>
  );
}
