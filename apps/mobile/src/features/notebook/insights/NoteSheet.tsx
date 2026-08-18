import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, Sheet } from "@/ui";

interface NoteSheetProps {
  isOpen: boolean;
  title: string;
  /** Pre-filled when editing an insight; empty for new/quick-add notes. */
  initialContent: string;
  saving: boolean;
  onSave: (content: string) => void;
  onClose: () => void;
}

/**
 * One bottom sheet for all three short-text flows desktop renders as inline
 * textareas: quick add on a group card, "new note" in the group detail, and
 * editing an insight. Inline editors don't survive contact with the on-screen
 * keyboard; a sheet rides above it (Sheet's KeyboardAvoidingView).
 */
export function NoteSheet({ isOpen, title, initialContent, saving, onSave, onClose }: NoteSheetProps) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    if (isOpen) setContent(initialContent);
  }, [isOpen, initialContent]);

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={title}>
      <TextInput
        multiline
        autoFocus
        value={content}
        onChangeText={setContent}
        placeholder={t.insights.notePlaceholder}
        placeholderTextColor={colors.inkMute}
        textAlignVertical="top"
        className="min-h-[100px] rounded-xl border border-line bg-canvas px-4 py-3 text-base leading-relaxed text-ink"
      />
      <View className="mt-4 flex-row gap-3">
        <Button variant="secondary" className="flex-1" onPress={onClose} disabled={saving}>
          {t.common.cancel}
        </Button>
        <Button
          className="flex-1"
          onPress={() => onSave(content.trim())}
          disabled={!content.trim()}
          loading={saving}
        >
          {t.common.save}
        </Button>
      </View>
    </Sheet>
  );
}
