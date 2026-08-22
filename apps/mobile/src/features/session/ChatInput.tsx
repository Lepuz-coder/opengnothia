import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { BlurView } from "expo-blur";
import { ArrowUp, Mic, Square } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { formatClock } from "@/lib/duration";
import { GLASS } from "@/theme/sessionAmbience";
import { useThemeColors } from "@/theme/useAppTheme";
import { RecordingWave } from "@/features/voice/RecordingWave";
import { useDictation } from "@/features/voice/useDictation";

interface ChatInputProps {
  disabled: boolean;
  onSend: (content: string) => void;
  /** Dictation is a proxied AI call: 403 has to reach the paywall contract. */
  onAIError: (error: unknown) => void;
}

/** 36pt keeps desktop's compact look; hitSlop restores the 44pt touch target. */
const BUTTON_HIT_SLOP = { top: 4, bottom: 4, left: 4, right: 4 };

const RECORD_RED = "#F87171";

/** Desktop's `animate-pulse` dot on the recording mic. */
function PulsingDot() {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
      undefined,
      ReduceMotion.System,
    );
  }, [pulse]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        { position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
        style,
      ]}
    />
  );
}

/**
 * Desktop ChatInput's RN counterpart. The input stays enabled for composing
 * while the assistant streams; only sending is held back, matching the
 * disabled-send semantics of desktop.
 *
 * Visually this is desktop's floating glass card (ChatInput.tsx:150-227): no
 * separator above it, a blurred translucent pill over the aurora, both buttons
 * tucked inside at the bottom right, and a teal halo on focus.
 *
 * The mic dictates (desktop's handleMicClick/handleMicStop): it appends the
 * transcript to the draft and never sends. While recording, the whole pill
 * becomes desktop's red bar — wave, timer and a stop button — so there is no
 * way to send half a thought by accident.
 */
export function ChatInput({ disabled, onSend, onAIError }: ChatInputProps) {
  const { t } = useTranslation();
  const { colors, resolved } = useThemeColors();
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const dictation = useDictation({
    onText: (text) =>
      // Desktop's insertText: appended to whatever is already typed, one space
      // between, so a second pass reads as one sentence.
      setDraft((prev) => prev + (prev.trim() ? " " : "") + text),
    onAIError,
  });

  const glass = GLASS[resolved];
  const canSend = !disabled && draft.trim().length > 0;
  const isRecording = dictation.state === "recording";
  const isTranscribing = dictation.state === "transcribing";

  // The TextInput unmounts while recording; give the caret back once the
  // transcript lands. Only on that transition — focusing on mount would throw
  // the keyboard up over the greeting the moment a session opens.
  const previousDictationState = useRef(dictation.state);
  useEffect(() => {
    const cameFromDictation = previousDictationState.current !== "idle";
    previousDictationState.current = dictation.state;
    if (dictation.state !== "idle" || !cameFromDictation) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [dictation.state]);

  const handleSend = () => {
    const content = draft.trim();
    if (!content || disabled) return;
    setDraft("");
    onSend(content);
  };

  const borderColor = isRecording
    ? glass.pillBorderRecording
    : focused
      ? glass.pillBorderFocused
      : glass.pillBorder;
  const shadow = isRecording
    ? glass.pillShadowRecording
    : focused
      ? glass.pillShadowFocused
      : glass.pillShadow;

  return (
    <View className="px-4 pb-3 pt-2">
      {/* boxShadow sits outside the clipping view — `overflow: hidden` sets
          masksToBounds on iOS and would swallow it (LockBadge's split). */}
      <View className="rounded-2xl" style={{ boxShadow: shadow }}>
        <View className="overflow-hidden rounded-2xl border" style={{ borderColor }}>
          <BlurView
            intensity={60}
            tint={resolved === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: glass.chromeTint }]} />

          {isRecording ? (
            <View className="min-h-[48px] flex-row items-center gap-3 px-4 py-3">
              <View>
                <Mic size={20} color={RECORD_RED} />
                <PulsingDot />
              </View>

              <View className="flex-1 items-center gap-1">
                <RecordingWave audioLevel={dictation.audioLevel} />
                <Text className="text-xs" style={{ color: RECORD_RED }}>
                  {t.transcript.recordingAudio}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Text
                  className="text-sm font-medium"
                  style={{ color: RECORD_RED, fontVariant: ["tabular-nums"] }}
                >
                  {formatClock(Math.floor(dictation.durationSeconds))}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.transcript.recording}
                  onPress={() => void dictation.stop()}
                  hitSlop={BUTTON_HIT_SLOP}
                  className="h-8 w-8 items-center justify-center rounded-full bg-red-500 active:bg-red-600"
                >
                  <Square size={14} color="#fff" fill="#fff" />
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <TextInput
                ref={inputRef}
                multiline
                value={draft}
                onChangeText={setDraft}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={t.chat.placeholder}
                placeholderTextColor={colors.inkMute}
                className="max-h-32 min-h-[48px] px-4 py-3 pr-[88px] text-base leading-snug text-ink"
              />

              <View className="absolute bottom-1.5 right-2 flex-row items-center gap-1">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isTranscribing ? t.transcript.transcribing : t.transcript.recording}
                  accessibilityState={{ disabled: disabled || isTranscribing }}
                  disabled={disabled || isTranscribing}
                  onPress={() => void dictation.start()}
                  hitSlop={BUTTON_HIT_SLOP}
                  className="h-9 w-9 items-center justify-center rounded-full active:bg-primary-500/10"
                >
                  {isTranscribing ? (
                    <ActivityIndicator size="small" color={colors.tint} />
                  ) : (
                    <Mic size={18} color={disabled ? colors.inkMute : colors.tint} />
                  )}
                </Pressable>
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
            </>
          )}
        </View>
      </View>
    </View>
  );
}
