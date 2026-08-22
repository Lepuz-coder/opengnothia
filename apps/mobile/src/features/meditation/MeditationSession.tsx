import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { Check, X } from "lucide-react-native";
import { useKeepAwake } from "expo-keep-awake";
import { useTranslation } from "@opengnothia/shared/i18n";
import { formatClock } from "@/lib/duration";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, GradientCircle, MiniOrb } from "@/ui";
import type { BellPackId } from "./constants";
import { useMeditationTimer } from "./useMeditationTimer";

interface MeditationSessionProps {
  totalSeconds: number;
  prepSeconds: number;
  intervalSeconds: number;
  bell: BellPackId;
  onStop: () => void;
}

/**
 * Fullscreen session runner. Same shell as BreathingExercise: a fullscreen Modal
 * is what covers the tab bar and header, and closing it is what brings them back.
 *
 * The visual is MiniOrb rather than the breathing circle — a meditation timer has
 * no phases to drive a scale, and the orb's slow five-second breath is the right
 * thing to sit with. It also already honours ReduceMotion.System.
 */
export function MeditationSession({
  totalSeconds,
  prepSeconds,
  intervalSeconds,
  bell,
  onStop,
}: MeditationSessionProps) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();
  // Same call as the breathing exercise: a phone that dims mid-sitting is a
  // broken sitting. Locking it by hand still works and the bells keep ringing
  // either way — the audio session, not this, is what holds them alive.
  useKeepAwake();

  const { phase, prepRemaining, remaining, elapsedInSession, nextBellIn } = useMeditationTimer({
    totalSeconds,
    prepSeconds,
    intervalSeconds,
    bell,
  });

  const satMinutes = Math.max(1, Math.round(elapsedInSession / 60));

  return (
    <Modal visible animationType="fade" onRequestClose={onStop} statusBarTranslucent>
      <View className="flex-1 bg-canvas">
        {phase === "done" ? (
          <View className="flex-1 items-center justify-center gap-6 px-6">
            <View className="items-center justify-center">
              <GradientCircle size={80} />
              <View className="absolute">
                <Check size={36} color="#fff" strokeWidth={3} />
              </View>
            </View>
            <View className="items-center gap-2">
              <Text className="text-2xl font-bold text-ink">{t.meditation.complete}</Text>
              <Text className="text-sm text-ink-mute">
                {satMinutes} {t.meditation.completedMinutes}
              </Text>
            </View>
            <Button size="lg" onPress={onStop}>
              {t.common.close}
            </Button>
          </View>
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.common.close}
              onPress={onStop}
              className="absolute right-4 z-10 rounded-xl p-2 active:bg-raised"
              style={{ top: insets.top + 8 }}
            >
              <X size={24} color={colors.inkMute} />
            </Pressable>

            <View className="flex-1 items-center justify-center gap-10">
              <MiniOrb size={180} />

              {phase === "prep" ? (
                <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: "center" }}>
                  <Text className="text-center text-xl text-ink-soft">{t.meditation.getReady}</Text>
                  <Text
                    className="mt-3 text-6xl font-bold"
                    style={{ color: colors.tint, fontVariant: ["tabular-nums"] }}
                  >
                    {prepRemaining}
                  </Text>
                </Animated.View>
              ) : (
                <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: "center" }}>
                  <Text
                    className="text-6xl font-bold text-ink"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {formatClock(remaining)}
                  </Text>
                  {nextBellIn !== null && (
                    <Text
                      className="mt-3 text-sm text-ink-mute"
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {t.meditation.nextBell} · {formatClock(nextBellIn)}
                    </Text>
                  )}
                </Animated.View>
              )}
            </View>

            <View className="absolute inset-x-0 items-center" style={{ bottom: insets.bottom + 24 }}>
              <Button variant="ghost" onPress={onStop}>
                {t.meditation.finishEarly}
              </Button>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}
