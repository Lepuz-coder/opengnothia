import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Check, X } from "lucide-react-native";
import { useKeepAwake } from "expo-keep-awake";
import { useTranslation } from "@opengnothia/shared/i18n";
import type { BreathingTechnique } from "@opengnothia/shared/constants/breathingTechniques";
import { formatClock } from "@/lib/duration";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, GradientCircle } from "@/ui";

interface BreathingExerciseProps {
  technique: BreathingTechnique;
  totalDuration: number;
  onStop: () => void;
}

const CIRCLE = 160;
// primary-500 — the ring/glow teal desktop hardcodes as rgba(58,186,180,…).
const TEAL = { r: 58, g: 186, b: 180 };
const tealAlpha = (a: number) => `rgba(${TEAL.r}, ${TEAL.g}, ${TEAL.b}, ${a})`;

/**
 * Fullscreen exercise runner. Desktop overlays `fixed inset-0` over the page
 * and hides the sidebar; the RN counterpart is a fullscreen Modal, which
 * covers the tab bar and header for the same effect — nothing to un-hide,
 * closing the modal is what brings the tab bar back (Step 22).
 *
 * Like desktop, the whole phase state machine is derived from one elapsed
 * counter. Unlike desktop's drifting setInterval(1000), elapsed is computed
 * from a wall-clock baseline: no drift, and a backgrounded app catches up to
 * real time on return instead of silently extending the exercise.
 */
export function BreathingExercise({ technique, totalDuration, onStop }: BreathingExerciseProps) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();
  // A phone that sleeps mid-exercise is a broken exercise; released on unmount.
  useKeepAwake();

  const [elapsed, setElapsed] = useState(0);

  // Derived from the phase list — technique.cycleDuration is hand-authored
  // duplicated data across 8 language files; summing is drift-proof.
  const cycleDuration = technique.phases.reduce((sum, phase) => sum + phase.duration, 0);

  const remaining = Math.max(0, totalDuration - elapsed);
  const isFinished = elapsed >= totalDuration;
  const elapsedInCycle = elapsed % cycleDuration;
  const cycleNumber = Math.floor(elapsed / cycleDuration) + 1;

  let accumulated = 0;
  let currentPhaseIdx = 0;
  let phaseElapsed = 0;
  for (let i = 0; i < technique.phases.length; i++) {
    if (elapsedInCycle < accumulated + technique.phases[i].duration) {
      currentPhaseIdx = i;
      phaseElapsed = elapsedInCycle - accumulated;
      break;
    }
    accumulated += technique.phases[i].duration;
  }

  const currentPhase = technique.phases[currentPhaseIdx];
  const phaseRemaining = currentPhase.duration - phaseElapsed;
  const targetScale = currentPhase.type === "inhale" || currentPhase.type === "hold" ? 1 : 0.6;

  useEffect(() => {
    const startedAt = Date.now();
    const id = setInterval(() => {
      const next = Math.floor((Date.now() - startedAt) / 1000);
      if (next >= totalDuration) {
        setElapsed(totalDuration);
        clearInterval(id);
      } else {
        setElapsed(next);
      }
    }, 250);
    return () => clearInterval(id);
  }, [totalDuration]);

  // Desktop animates scale with a CSS transition lasting the phase's duration;
  // withTiming is the same statement. Starting at 0.6 also fixes a desktop
  // quirk where the very first inhale rendered already-full instead of growing.
  const scale = useSharedValue(0.6);
  useEffect(() => {
    if (isFinished) return;
    scale.value = withTiming(targetScale, {
      duration: currentPhase.duration * 1000,
      easing: Easing.inOut(Easing.ease),
    });
  }, [cycleNumber, currentPhaseIdx, currentPhase.duration, targetScale, isFinished, scale]);
  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Desktop's breathing-glow box-shadow pulse (4s cycle) — RN has no animatable
  // shadow, so a scaled translucent disc behind the circle stands in for it.
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [glow]);
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.1 + glow.value * 0.12,
    transform: [{ scale: 1.15 + glow.value * 0.25 }],
  }));

  const completedCycles = Math.floor(totalDuration / cycleDuration);

  return (
    <Modal visible animationType="fade" onRequestClose={onStop} statusBarTranslucent>
      <View className="flex-1 bg-canvas">
        {isFinished ? (
          <View className="flex-1 items-center justify-center gap-6 px-6">
            <View className="items-center justify-center">
              <GradientCircle size={80} />
              <View className="absolute">
                <Check size={36} color="#fff" strokeWidth={3} />
              </View>
            </View>
            <View className="items-center gap-2">
              <Text className="text-2xl font-bold text-ink">{t.breathing.congratulations}</Text>
              <Text className="text-ink-mute">{t.breathing.completed}</Text>
              <Text className="text-sm text-ink-mute">
                {completedCycles} {t.breathing.cyclesCompleted}
              </Text>
            </View>
            <Button size="lg" onPress={onStop}>
              {t.common.close}
            </Button>
          </View>
        ) : (
          <>
            <Text
              className="absolute inset-x-0 text-center text-sm text-ink-mute"
              style={{ top: insets.top + 18 }}
            >
              {technique.name}
            </Text>
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
              <View className="items-center justify-center" style={{ width: 192, height: 192 }}>
                <ExpandingRing delay={0} alpha={0.2} />
                <ExpandingRing delay={1000} alpha={0.15} />
                <ExpandingRing delay={2000} alpha={0.1} />
                <Animated.View
                  style={[{ width: CIRCLE, height: CIRCLE, alignItems: "center", justifyContent: "center" }, circleStyle]}
                >
                  <Animated.View
                    style={[
                      {
                        position: "absolute",
                        width: CIRCLE,
                        height: CIRCLE,
                        borderRadius: CIRCLE / 2,
                        backgroundColor: tealAlpha(1),
                      },
                      glowStyle,
                    ]}
                  />
                  <GradientCircle size={CIRCLE} />
                </Animated.View>
              </View>

              {/* The key remount replays the entrance on every phase change (desktop parity). */}
              <Animated.View
                key={`${cycleNumber}-${currentPhaseIdx}`}
                entering={FadeInUp.duration(400)}
                style={{ alignItems: "center" }}
              >
                <Text className="text-center text-3xl font-bold text-ink">{currentPhase.name}</Text>
                <Text
                  className="mt-3 text-5xl font-bold"
                  style={{ color: colors.tint, fontVariant: ["tabular-nums"] }}
                >
                  {phaseRemaining}
                </Text>
              </Animated.View>
            </View>

            <Text
              className="absolute inset-x-0 text-center text-sm text-ink-mute"
              style={{ bottom: insets.bottom + 24, fontVariant: ["tabular-nums"] }}
            >
              {formatClock(remaining)}
            </Text>
          </>
        )}
      </View>
    </Modal>
  );
}

/** One of desktop's staggered breathing-ring ripples (scale 1→2.5, fade out, 3s loop). */
function ExpandingRing({ delay, alpha }: { delay: number; alpha: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 3000, easing: Easing.out(Easing.ease) }), -1, false)
    );
  }, [delay, progress]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.3 * (1 - progress.value),
    transform: [{ scale: 1 + 1.5 * progress.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: CIRCLE,
          height: CIRCLE,
          borderRadius: CIRCLE / 2,
          borderWidth: 1,
          borderColor: tealAlpha(alpha),
        },
        style,
      ]}
    />
  );
}
