import { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sparkles } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import type { InsightGroup } from "@opengnothia/shared/types";
import { useAIErrorHandler } from "@/ai/useAIErrorHandler";
import { getQueries } from "@/db";
import { showToast } from "@/stores/useToastStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, ConfirmSheet, ToastContainer } from "@/ui";
import { NewInsightModal } from "@/features/notebook/insights/GroupFormModals";
import { useVoiceConversation } from "@/features/voice/useVoiceConversation";
import { VoiceConversationView } from "@/features/voice/VoiceConversationView";
import { ChatInput } from "./ChatInput";
import { ChatMessages } from "./ChatMessages";
import { SessionEndScreen } from "./SessionEndScreen";
import { SessionTopBar } from "./SessionTopBar";
import { finishSession, sendUserMessage, setVoiceSink } from "./sessionActions";

/** The AI proposed closing (SESSION_END_MARKER): confirm or keep talking. */
function EndPromptCard({ onClose, onContinue }: { onClose: () => void; onContinue: () => void }) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();

  return (
    <View className="border-t border-line bg-card px-4 py-4">
      <View className="mb-3 flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15">
          <Sparkles size={20} color={colors.tint} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-ink">{t.session.sessionEndedTitle}</Text>
          <Text className="mt-0.5 text-sm leading-relaxed text-ink-mute">{t.session.sessionEndedDescription}</Text>
        </View>
      </View>
      <View className="flex-row gap-2.5">
        <Button variant="secondary" className="flex-1" onPress={onContinue}>
          {t.session.continueSession}
        </Button>
        <Button className="flex-1" onPress={onClose}>
          {t.session.closeSession}
        </Button>
      </View>
    </View>
  );
}

type SessionMode = "chat" | "voice";

/**
 * The whole in-session surface, presented as a fullscreen Modal over the
 * session tab — the Faz 3 precedent (breathing exercise) for desktop's
 * hide-the-sidebar focus mode: the tab bar is covered, not restyled.
 *
 * Faz 8: this component owns the session mode. Voice mode swaps the chat
 * surface for VoiceConversationView and registers the stream sink so
 * sessionActions can feed the loop; both directions of the switch stay inside
 * the same running session (M9).
 */
export function SessionModal() {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();
  const handleAIError = useAIErrorHandler({ modalHosted: true });

  const status = useSessionStore((s) => s.status);
  const messages = useSessionStore((s) => s.messages);
  const isStreaming = useSessionStore((s) => s.isStreaming);
  const isLoading = useSessionStore((s) => s.isLoading);
  const pendingEndPrompt = useSessionStore((s) => s.pendingEndPrompt);
  const setPendingEndPrompt = useSessionStore((s) => s.setPendingEndPrompt);
  const addSessionInsightId = useSessionStore((s) => s.addSessionInsightId);

  const [mode, setMode] = useState<SessionMode>("chat");
  const modeRef = useRef<SessionMode>("chat");
  modeRef.current = mode;

  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [insightModalOpen, setInsightModalOpen] = useState(false);
  const [insightGroups, setInsightGroups] = useState<InsightGroup[]>([]);

  // A failed stream leaves the voice loop with nothing to speak — park it in
  // paused (resume = listening) alongside the normal error surface.
  const onVoiceAwareAIError = useCallback(
    (error: unknown) => {
      if (modeRef.current === "voice") {
        voiceLoopRef.current?.pauseLoop();
      }
      handleAIError(error);
    },
    [handleAIError],
  );

  const voiceLoop = useVoiceConversation({
    onTranscriptionReady: (text) => void sendUserMessage(text, onVoiceAwareAIError),
    onAIError: handleAIError,
  });
  const voiceLoopRef = useRef<typeof voiceLoop | null>(null);
  voiceLoopRef.current = voiceLoop;

  /**
   * Both branches run synchronously with the snapshot read: chunks arrive on
   * async callbacks, so nothing can slip between reading the streamed-so-far
   * text and registering the sink (no lost or doubled speech).
   */
  const enterVoiceMode = () => {
    const s = useSessionStore.getState();
    const streamedSoFar = s.isStreaming
      ? (s.messages.find((m) => m.id === s.streamingMessageId)?.content ?? "")
      : null;
    setVoiceSink({ feed: voiceLoop.feedStreamChunk, flush: voiceLoop.flushStream });
    voiceLoop.startLoop(streamedSoFar);
    setMode("voice");
  };

  const exitVoiceMode = useCallback(() => {
    setVoiceSink(null);
    voiceLoopRef.current?.stopLoop();
    setMode("chat");
  }, []);

  // The modal can unmount mid-session only on teardown paths; never leave a
  // dangling sink pointing at an unmounted loop.
  useEffect(() => () => setVoiceSink(null), []);

  // Desktop parity: the closing marker pauses speech and hands over to the
  // text end-prompt; "continue" resumes into listening.
  useEffect(() => {
    if (pendingEndPrompt && mode === "voice") {
      voiceLoopRef.current?.pauseLoop();
    }
  }, [pendingEndPrompt, mode]);

  const loadGroups = async () => {
    try {
      const queries = await getQueries();
      setInsightGroups(await queries.getInsightGroups());
    } catch {
      setInsightGroups([]);
    }
  };

  const openInsightModal = async () => {
    await loadGroups();
    setInsightModalOpen(true);
  };

  const handleFinish = () => {
    setEndConfirmOpen(false);
    setPendingEndPrompt(false);
    if (mode === "voice") exitVoiceMode();
    void finishSession();
  };

  const handleContinueAfterMarker = () => {
    setPendingEndPrompt(false);
    if (mode === "voice") voiceLoop.resumeLoop();
  };

  return (
    <Modal
      visible={status !== "idle"}
      animationType="slide"
      onRequestClose={() => {
        // Android back / iOS gesture: route through the explicit end flow.
        if (status === "active") setEndConfirmOpen(true);
      }}
      statusBarTranslucent
    >
      <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
        {status === "post" ? (
          <View className="flex-1" style={{ paddingBottom: insets.bottom }}>
            <SessionEndScreen onAIError={handleAIError} />
          </View>
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
            <SessionTopBar onEndPress={() => setEndConfirmOpen(true)} onInsightsPress={openInsightModal} />
            {pendingEndPrompt ? (
              <>
                <ChatMessages messages={messages} />
                <View style={{ paddingBottom: insets.bottom }}>
                  <EndPromptCard onClose={handleFinish} onContinue={handleContinueAfterMarker} />
                </View>
              </>
            ) : mode === "voice" ? (
              <View className="flex-1" style={{ paddingBottom: insets.bottom }}>
                <VoiceConversationView
                  voiceStatus={voiceLoop.status}
                  error={voiceLoop.error}
                  currentAIText={voiceLoop.currentAIText}
                  lastUserTranscript={voiceLoop.lastUserTranscript}
                  audioLevel={voiceLoop.recorder.audioLevel}
                  recordingSeconds={voiceLoop.recorder.durationSeconds}
                  onRecordingStop={() => void voiceLoop.handleRecordingStop()}
                  onConfirmTranscript={voiceLoop.confirmTranscript}
                  onRetryRecording={() => void voiceLoop.retryRecording()}
                  onInterrupt={voiceLoop.interrupt}
                  onPause={voiceLoop.pauseLoop}
                  onResume={voiceLoop.resumeLoop}
                  onSwitchToChat={exitVoiceMode}
                />
              </View>
            ) : (
              <>
                <ChatMessages messages={messages} />
                <View style={{ paddingBottom: insets.bottom }}>
                  <ChatInput
                    disabled={isLoading || isStreaming}
                    onSend={(content) => void sendUserMessage(content, handleAIError)}
                    onVoicePress={enterVoiceMode}
                  />
                </View>
              </>
            )}
          </KeyboardAvoidingView>
        )}

        <ConfirmSheet
          isOpen={endConfirmOpen}
          title={t.session.endSession}
          message={t.session.endSessionConfirm}
          confirmLabel={t.session.yesEnd}
          onConfirm={handleFinish}
          onClose={() => setEndConfirmOpen(false)}
        />

        {/* Step 43: in-session insight capture — the notebook's composer, so
            group pick/create and the writing surface stay one pattern. */}
        <NewInsightModal
          visible={insightModalOpen}
          groups={insightGroups}
          onClose={() => setInsightModalOpen(false)}
          onSaved={(_groupId, insightId) => {
            addSessionInsightId(insightId);
            showToast(t.session.addedToInsightsToast, "success");
          }}
          onGroupCreated={loadGroups}
        />

        {/* The root ToastContainer sits below this RN Modal — mount a second
            host inside so in-session toasts (errors, insight saved) show. */}
        <ToastContainer />
      </View>
    </Modal>
  );
}
