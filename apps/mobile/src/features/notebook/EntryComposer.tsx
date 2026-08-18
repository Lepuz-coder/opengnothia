import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Text, TextInput, View } from "react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button } from "@/ui";

interface EntryComposerProps {
  visible: boolean;
  /** Header label: a day ("pazartesi, 18 Ağustos 2026") or an action title ("Yeni Not"). */
  label: string;
  placeholder: string;
  /** Pre-filled when editing an existing entry; empty for a new one. */
  initialContent: string;
  saving: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
}

/**
 * Fullscreen writing surface for the whole Defter tab — journal entries,
 * dreams and insight notes all write here. Desktop swaps the page body for an
 * editor and hides the sidebar; the phone-native equivalent is an iOS page
 * sheet, which also brings swipe-to-dismiss for free.
 */
export function EntryComposer({
  visible,
  label,
  placeholder,
  initialContent,
  saving,
  onClose,
  onSave,
}: EntryComposerProps) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const [content, setContent] = useState(initialContent);

  // The sheet is reused across days and entries; re-arm the draft each time
  // it opens rather than on mount.
  useEffect(() => {
    if (visible) setContent(initialContent);
  }, [visible, initialContent]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-canvas"
      >
        {/* Top bar: cancel · date · save */}
        <View className="flex-row items-center justify-between border-b border-line px-3 py-2.5">
          <Button variant="ghost" size="sm" onPress={onClose} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Text className="mx-2 flex-1 text-center text-sm capitalize text-ink-mute" numberOfLines={1}>
            {label}
          </Text>
          <Button size="sm" onPress={() => onSave(content.trim())} disabled={!content.trim()} loading={saving}>
            {t.common.save}
          </Button>
        </View>

        <TextInput
          multiline
          autoFocus
          value={content}
          onChangeText={setContent}
          placeholder={placeholder}
          placeholderTextColor={colors.inkMute}
          textAlignVertical="top"
          className="flex-1 px-5 py-4 text-base leading-relaxed text-ink"
        />

        <View className="border-t border-line px-4 py-2">
          <Text className="text-right text-xs text-ink-mute">
            {wordCount} {t.common.words}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
