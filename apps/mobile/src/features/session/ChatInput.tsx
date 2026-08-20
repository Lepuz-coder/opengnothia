import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { ArrowUp } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { cn } from "@opengnothia/shared/lib/cn";
import { useThemeColors } from "@/theme/useAppTheme";

interface ChatInputProps {
  disabled: boolean;
  onSend: (content: string) => void;
}

/**
 * Desktop ChatInput minus the dictation mic — voice arrives with Faz 8. The
 * input stays enabled for composing while the assistant streams; only sending
 * is held back, matching the disabled-send semantics of desktop.
 */
export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const [draft, setDraft] = useState("");

  const canSend = !disabled && draft.trim().length > 0;

  const handleSend = () => {
    const content = draft.trim();
    if (!content || disabled) return;
    setDraft("");
    onSend(content);
  };

  return (
    <View className="flex-row items-end gap-2 border-t border-line bg-card px-3 py-2.5">
      <TextInput
        multiline
        value={draft}
        onChangeText={setDraft}
        placeholder={t.chat.placeholder}
        placeholderTextColor={colors.inkMute}
        className="max-h-32 min-h-[44px] flex-1 rounded-2xl border border-line bg-canvas px-4 py-3 text-base leading-snug text-ink"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.common.continue}
        accessibilityState={{ disabled: !canSend }}
        disabled={!canSend}
        onPress={handleSend}
        className={cn(
          "h-11 w-11 items-center justify-center rounded-full",
          canSend ? "bg-primary-500 active:bg-primary-600" : "bg-raised"
        )}
      >
        <ArrowUp size={20} color={canSend ? "#fff" : colors.inkMute} />
      </Pressable>
    </View>
  );
}
