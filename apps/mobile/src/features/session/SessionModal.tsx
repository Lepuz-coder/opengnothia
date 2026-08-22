import { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sparkles } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { useTranslation } from "@opengnothia/shared/i18n";
import type { InsightGroup } from "@opengnothia/shared/types";
import { useAIErrorHandler } from "@/ai/useAIErrorHandler";
import { getQueries } from "@/db";
import { showToast } from "@/stores/useToastStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { GLASS } from "@/theme/sessionAmbience";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, ConfirmSheet, ToastContainer } from "@/ui";
import { NewInsightModal } from "@/features/notebook/insights/GroupFormModals";
import { useVoiceConversation } from "@/features/voice/useVoiceConversation";
import { VoiceConversationView } from "@/features/voice/VoiceConversationView";
import { ChatInput } from "./ChatInput";
import { ChatMessages } from "./ChatMessages";
import { SessionAmbience } from "./SessionAmbience";
import { SessionEndScreen } from "./SessionEndScreen";
import { SessionTopBar } from "./SessionTopBar";
import { finishSession, sendUserMessage, setVoiceSink } from "./sessionActions";

/** The AI proposed closing (SESSION_END_MARKER): confirm or keep talking. */
function EndPromptCard({
  finishing,
  onClose,
  onContinue,
}: {
  finishing: boolean;
  onClose: () => void;
  onContinue: () => void;
}) {
  const { t } = useTranslation();
  const { colors, resolved } = useThemeColors();

  return (
    <View className="px-4 pb-3 pt-2">
      <View className="rounded-2xl" style={{ boxShadow: GLASS[resolved].pillShadow }}>
        <View className="overflow-hidden rounded-2xl border border-primary-500/30 px-4 py-4">
          <BlurView
            intensity={60}
            tint={resolved === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: GLASS[resolved].chromeTint }]} />
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
            <Button variant="secondary" className="flex-1" onPress={onContinue} disabled={finishing}>
              {t.session.continueSession}
            </Button>
            <Button className="flex-1" onPress={onClose} loading={finishing}>
              {t.session.closeSession}
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}

/** RN's modal slide animation, with a little slack. */
const NESTED_MODAL_DISMISS_MS = 350;

/**
 * The whole in-session surface, presented as a fullscreen Modal over the
 * session tab — the Faz 3 precedent (breathing exercise) for desktop's
 * hide-the-sidebar focus mode: the tab bar is covered, not restyled.
 *
 * The mode is picked in the start sheet and lives in the session store
 * (desktop's shape). A voice session opens the loop here as soon as the
 * session turns active; dropping to chat is one-way, as on desktop — the chat
 * input's mic dictates rather than switching modes.
 */
export function SessionModal() {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();
  const handleAIError = useAIErrorHandler({ modalHosted: true });

  const status = useSessionStore((s) => s.status);
  const sessionId = useSessionStore((s) => s.sessionId);
  const sessionMode = useSessionStore((s) => s.sessionMode);
  const setSessionMode = useSessionStore((s) => s.setSessionMode);
  const messages = useSessionStore((s) => s.messages);
  const isStreaming = useSessionStore((s) => s.isStreaming);
  const isLoading = useSessionStore((s) => s.isLoading);
  const pendingEndPrompt = useSessionStore((s) => s.pendingEndPrompt);
  const setPendingEndPrompt = useSessionStore((s) => s.setPendingEndPrompt);
  const addSessionInsightId = useSessionStore((s) => s.addSessionInsightId);

  const modeRef = useRef(sessionMode);
  modeRef.current = sessionMode;
  /** Guards the auto-start effect against re-running inside one session. */
  const autoStartedRef = useRef<string | null>(null);

  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
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
   * The snapshot read, the sink registration and startLoop all run
   * synchronously: chunks arrive on async callbacks, so nothing can slip
   * between reading the streamed-so-far text and wiring the sink (no lost or
   * doubled speech).
   *
   * The empty-string fallback matters. startLoop treats a string as "a reply
   * is on its way" and waits; null would open the microphone immediately, and
   * at session start the effect below can run before the greeting request has
   * even flipped isStreaming — the user's first words would be recorded over
   * and thrown away when the greeting arrived.
   */
  const enterVoiceMode = useCallback(() => {
    const s = useSessionStore.getState();
    const streamedSoFar = s.isStreaming
      ? (s.messages.find((m) => m.id === s.streamingMessageId)?.content ?? "")
      : "";
    setVoiceSink({
      feed: voiceLoop.feedStreamChunk,
      flush: voiceLoop.flushStream,
      fail: () => voiceLoopRef.current?.pauseLoop(),
    });
    voiceLoop.startLoop(streamedSoFar);
  }, [voiceLoop.feedStreamChunk, voiceLoop.flushStream, voiceLoop.startLoop]);

  // A voice session opens straight into the loop (desktop's performSessionStart
  // does the same right after handleGreeting).
  useEffect(() => {
    if (status !== "active" || sessionMode !== "voice" || sessionId === null) return;
    if (autoStartedRef.current === sessionId) return;
    autoStartedRef.current = sessionId;
    enterVoiceMode();
  }, [status, sessionMode, sessionId, enterVoiceMode]);

  const exitVoiceMode = useCallback(() => {
    setVoiceSink(null);
    voiceLoopRef.current?.stopLoop();
    setSessionMode("chat");
  }, [setSessionMode]);

  // The modal can unmount mid-session only on teardown paths; never leave a
  // dangling sink pointing at an unmounted loop.
  useEffect(() => () => setVoiceSink(null), []);

  // Desktop parity: the closing marker pauses speech and hands over to the
  // text end-prompt; "continue" resumes into listening.
  useEffect(() => {
    if (pendingEndPrompt && sessionMode === "voice") {
      voiceLoopRef.current?.pauseLoop();
    }
  }, [pendingEndPrompt, sessionMode]);

  const loadGroups = async (): Promise<boolean> => {
    try {
      const queries = await getQueries();
      setInsightGroups(await queries.getInsightGroups());
      return true;
    } catch (err) {
      console.error("Failed to load in-session insight groups:", err);
      showToast(t.errors.generic, "error");
      return false;
    }
  };

  const openInsightModal = async () => {
    if (await loadGroups()) setInsightModalOpen(true);
  };

  const handleFinish = async () => {
    if (finishing || isStreaming) return;
    setFinishing(true);
    const confirmWasOpen = endConfirmOpen;
    try {
      // finishSession resets the store for a short session, which flips this
      // Modal to visible={false}. Tearing the parent down while ConfirmSheet's
      // nested Modal is still on screen leaves iOS on a black screen, so the
      // sheet has to be gone — animation and all — before we get there.
      if (confirmWasOpen) {
        setEndConfirmOpen(false);
        await new Promise<void>((resolve) => setTimeout(resolve, NESTED_MODAL_DISMISS_MS));
      }
      const result = await finishSession();
      if (result === "busy") return;
      setPendingEndPrompt(false);
      if (sessionMode === "voice") exitVoiceMode();
    } catch (err) {
      console.error("Failed to finish session:", err);
      // A short session is deleted before the store resets. Keep every modal
      // and voice state intact so a failed DB delete can be retried safely —
      // including the confirm sheet we closed on the way in.
      if (confirmWasOpen) setEndConfirmOpen(true);
      showToast(t.errors.generic, "error");
    } finally {
      setFinishing(false);
    }
  };

  const handleContinueAfterMarker = () => {
    setPendingEndPrompt(false);
    if (sessionMode === "voice") voiceLoop.resumeLoop();
  };

  return (
    <Modal
      visible={status !== "idle"}
      animationType="slide"
      onRequestClose={() => {
        // Android back / iOS gesture: route through the explicit end flow.
        if (status === "active" && !isStreaming) setEndConfirmOpen(true);
      }}
      statusBarTranslucent
    >
      <View className="flex-1 bg-canvas">
        {/* Desktop's AmbientBackground: the aurora runs under the translucent
            chrome and, thanks to statusBarTranslucent, under the status bar —
            so the safe-area padding belongs on the wrapper, not on this view. */}
        <SessionAmbience />
        <View className="flex-1" style={{ paddingTop: insets.top }}>
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
                    <EndPromptCard
                      finishing={finishing}
                      onClose={() => void handleFinish()}
                      onContinue={handleContinueAfterMarker}
                    />
                  </View>
                </>
              ) : sessionMode === "voice" ? (
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
                      onAIError={handleAIError}
                    />
                  </View>
                </>
              )}
            </KeyboardAvoidingView>
          )}
        </View>

        <ConfirmSheet
          isOpen={endConfirmOpen}
          title={t.session.endSession}
          message={t.session.endSessionConfirm}
          confirmLabel={t.session.yesEnd}
          confirming={finishing}
          onConfirm={() => void handleFinish()}
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
          onGroupCreated={async () => {
            await loadGroups();
          }}
        />

        {/* The root ToastContainer sits below this RN Modal — mount a second
            host inside so in-session toasts (errors, insight saved) show. */}
        <ToastContainer />
      </View>
    </Modal>
  );
}
