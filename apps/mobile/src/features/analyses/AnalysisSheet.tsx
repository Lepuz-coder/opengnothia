import { ActivityIndicator, Modal, ScrollView, Text, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, LockBadge, ToastContainer } from "@/ui";
import { Markdown } from "@/features/session/Markdown";

interface AnalysisSheetProps {
  visible: boolean;
  title: string;
  /** Persisted analysis — when set, the sheet is a plain reader (M4). */
  content: string | null;
  generating: boolean;
  streamContent: string;
  generatingLabel: string;
  generateLabel: string;
  /**
   * The empty state is only reachable after a failed run (generation starts
   * together with the sheet); this retry must apply the same gate as the
   * original entry point, so the caller owns it.
   */
  onGeneratePress: () => void;
  onClose: () => void;
}

/**
 * The one viewer for journal, dream and milestone analyses: a pageSheet that
 * either renders the saved markdown or shows the stream landing in it —
 * the mobile counterpart of desktop's per-page analysis modals.
 */
export function AnalysisSheet({
  visible,
  title,
  content,
  generating,
  streamContent,
  generatingLabel,
  generateLabel,
  onGeneratePress,
  onClose,
}: AnalysisSheetProps) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (!generating) onClose();
      }}
    >
      <View className="flex-1 bg-canvas">
        <View className="flex-row items-center justify-between border-b border-line px-3 py-2.5">
          <Text className="ml-2 flex-1 text-base font-semibold text-ink" numberOfLines={1}>
            {title}
          </Text>
          <Button variant="ghost" size="sm" onPress={onClose} disabled={generating}>
            {t.common.close}
          </Button>
        </View>
        <ScrollView className="flex-1" contentContainerClassName="px-5 py-4">
          {content ? (
            <Markdown>{content}</Markdown>
          ) : generating ? (
            <>
              <View className="mb-3 flex-row items-center gap-2">
                <ActivityIndicator size="small" color={colors.tint} />
                <Text className="text-sm text-ink-mute">{generatingLabel}</Text>
              </View>
              {streamContent !== "" && <Markdown>{streamContent}</Markdown>}
            </>
          ) : (
            <View className="items-center gap-4 py-10">
              <View className="flex-row items-center gap-2.5">
                <Button icon={<Sparkles size={16} color="#fff" />} onPress={onGeneratePress}>
                  {generateLabel}
                </Button>
                <LockBadge />
              </View>
            </View>
          )}
        </ScrollView>
        {/* Root ToastContainer sits below this pageSheet; host one inside. */}
        <ToastContainer />
      </View>
    </Modal>
  );
}
