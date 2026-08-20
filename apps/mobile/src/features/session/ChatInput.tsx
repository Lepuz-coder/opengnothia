import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { ArrowUp, Mic } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { cn } from "@opengnothia/shared/lib/cn";
import { useThemeColors } from "@/theme/useAppTheme";

interface ChatInputProps {
  disabled: boolean;
  onSend: (content: string) => void;
  /** Faz 8: renders the mic button that switches the session to voice mode. */
  onVoicePress?: () => void;
}

/**
 * Desktop ChatInput's RN counterpart. The input stays enabled for composing
 * while the assistant streams; only sending is held back, matching the
 * disabled-send semantics of desktop. Surfaces without voice (the onboarding
 * interview) simply omit onVoicePress.
 */
export function ChatInput({ disabled, onSend, onVoicePress }: ChatInputProps) {
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
      {onVoicePress !== undefined && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.voice.switchToVoice}
          onPress={onVoicePress}
          className="h-11 w-11 items-center justify-center rounded-full bg-raised active:bg-line"
        >
          <Mic size={20} color={colors.tint} />
        </Pressable>
      )}
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
