import { useEffect, useState } from "react";
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
import { ChatInput } from "./ChatInput";
import { ChatMessages } from "./ChatMessages";
import { SessionEndScreen } from "./SessionEndScreen";
import { SessionTopBar } from "./SessionTopBar";
import { finishSession, sendUserMessage } from "./sessionActions";

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

/**
 * The whole in-session surface, presented as a fullscreen Modal over the
 * session tab — the Faz 3 precedent (breathing exercise) for desktop's
 * hide-the-sidebar focus mode: the tab bar is covered, not restyled.
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

  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [insightModalOpen, setInsightModalOpen] = useState(false);
  const [insightGroups, setInsightGroups] = useState<InsightGroup[]>([]);

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
    void finishSession();
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
            <ChatMessages messages={messages} />
            <View style={{ paddingBottom: insets.bottom }}>
              {pendingEndPrompt ? (
                <EndPromptCard onClose={handleFinish} onContinue={() => setPendingEndPrompt(false)} />
              ) : (
                <ChatInput
                  disabled={isLoading || isStreaming}
                  onSend={(content) => void sendUserMessage(content, handleAIError)}
                />
              )}
            </View>
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
