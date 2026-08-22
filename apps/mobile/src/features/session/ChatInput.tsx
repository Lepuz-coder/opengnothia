import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { BlurView } from "expo-blur";
import { ArrowUp, Mic } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { cn } from "@opengnothia/shared/lib/cn";
import { GLASS } from "@/theme/sessionAmbience";
import { useThemeColors } from "@/theme/useAppTheme";

interface ChatInputProps {
  disabled: boolean;
  onSend: (content: string) => void;
  /** Faz 8: renders the mic button that switches the session to voice mode. */
  onVoicePress?: () => void;
}

/** 36pt keeps desktop's compact look; hitSlop restores the 44pt touch target. */
const BUTTON_HIT_SLOP = { top: 4, bottom: 4, left: 4, right: 4 };

/**
 * Desktop ChatInput's RN counterpart. The input stays enabled for composing
 * while the assistant streams; only sending is held back, matching the
 * disabled-send semantics of desktop. Surfaces without voice (the onboarding
 * interview) simply omit onVoicePress.
 *
 * Visually this is desktop's floating glass card (ChatInput.tsx:150-227): no
 * separator above it, a blurred translucent pill over the aurora, both buttons
 * tucked inside at the bottom right, and a teal halo on focus.
 */
export function ChatInput({ disabled, onSend, onVoicePress }: ChatInputProps) {
  const { t } = useTranslation();
  const { colors, resolved } = useThemeColors();
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);

  const glass = GLASS[resolved];
  const canSend = !disabled && draft.trim().length > 0;

  const handleSend = () => {
    const content = draft.trim();
    if (!content || disabled) return;
    setDraft("");
    onSend(content);
  };

  return (
    <View className="px-4 pb-3 pt-2">
      {/* boxShadow sits outside the clipping view — `overflow: hidden` sets
          masksToBounds on iOS and would swallow it (LockBadge's split). */}
      <View
        className="rounded-2xl"
        style={{ boxShadow: focused ? glass.pillShadowFocused : glass.pillShadow }}
      >
        <View
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: focused ? glass.pillBorderFocused : glass.pillBorder }}
        >
          <BlurView
            intensity={60}
            tint={resolved === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: glass.chromeTint }]} />

          <TextInput
            multiline
            value={draft}
            onChangeText={setDraft}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={t.chat.placeholder}
            placeholderTextColor={colors.inkMute}
            className={cn(
              "max-h-32 min-h-[48px] px-4 py-3 text-base leading-snug text-ink",
              // Clear whichever buttons are actually mounted.
              onVoicePress !== undefined ? "pr-[88px]" : "pr-[52px]",
            )}
          />

          <View className="absolute bottom-1.5 right-2 flex-row items-center gap-1">
            {onVoicePress !== undefined && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.voice.switchToVoice}
                onPress={onVoicePress}
                hitSlop={BUTTON_HIT_SLOP}
                className="h-9 w-9 items-center justify-center rounded-full active:bg-primary-500/10"
              >
                <Mic size={18} color={colors.tint} />
              </Pressable>
            )}
            <View style={canSend ? { borderRadius: 18, boxShadow: glass.sendGlow } : undefined}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.common.continue}
                accessibilityState={{ disabled: !canSend }}
                disabled={!canSend}
                onPress={handleSend}
                hitSlop={BUTTON_HIT_SLOP}
                className="h-9 w-9 items-center justify-center overflow-hidden rounded-full"
              >
                {/* Desktop's `bg-gradient-to-br from-primary-400 to-primary-600`,
                    which appears only once there is something to send. */}
                {canSend && (
                  <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
                    <Defs>
                      <LinearGradient id="sendButtonTeal" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor="#4BC3BE" />
                        <Stop offset="1" stopColor="#2D8F8B" />
                      </LinearGradient>
                    </Defs>
                    <Rect width="100" height="100" fill="url(#sendButtonTeal)" />
                  </Svg>
                )}
                <ArrowUp size={18} color={canSend ? "#fff" : colors.inkMute} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
