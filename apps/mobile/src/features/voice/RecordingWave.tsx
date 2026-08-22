import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

/** Desktop RecordingWave's constants, unchanged (ChatInput.tsx:20-23). */
const BAR_COUNT = 24;
const MIN_HEIGHT = 6;
const MAX_HEIGHT = 32;
const LEVEL_SCALE = 8;

/** Toast's error red — the one red already in the palette. */
const BAR_COLOR = "#F87171";

interface WaveBarProps {
  index: number;
  time: SharedValue<number>;
  level: SharedValue<number>;
  /** 0 with reduced motion: the bars then track the level without shimmering. */
  shimmer: number;
}

function WaveBar({ index, time, level, shimmer }: WaveBarProps) {
  const style = useAnimatedStyle(() => {
    const t = time.value;
    const wave1 = Math.sin(t * 0.005 + index * 0.6) * 0.35 * shimmer;
    const wave2 = Math.sin(t * 0.008 + index * 1.2) * 0.15 * shimmer;
    const barLevel = Math.max(0, Math.min(1, level.value + (wave1 + wave2) * level.value));
    const height = MIN_HEIGHT + barLevel * (MAX_HEIGHT - MIN_HEIGHT);
    // scaleY on a fixed-height view: 24 bars re-laying out every frame is a
    // cost RN does not need to pay for what is purely a visual.
    return { transform: [{ scaleY: height / MAX_HEIGHT }] };
  });

  return (
    <Animated.View
      style={[
        { width: 6, height: MAX_HEIGHT, borderRadius: 3, backgroundColor: BAR_COLOR },
        style,
      ]}
    />
  );
}

/**
 * Desktop RecordingWave's RN port (ChatInput.tsx:25-81): the same sqrt
 * perceptual scaling, the same asymmetric follow (fast attack, slow release)
 * and the same two-sine shimmer, moved from requestAnimationFrame onto a
 * Reanimated frame callback so it runs off the JS thread.
 */
export function RecordingWave({ audioLevel }: { audioLevel: number }) {
  const reduceMotion = useReducedMotion();
  const time = useSharedValue(0);
  const level = useSharedValue(0);
  const target = useSharedValue(0);

  useEffect(() => {
    // sqrt for perceptual scaling — small sounds become much more visible
    const next = Math.min(Math.sqrt(audioLevel * LEVEL_SCALE), 1);
    target.value = next;
    // With motion reduced the shimmer is off, so nothing else advances `level`.
    if (reduceMotion) level.value = withTiming(next, { duration: 120 });
  }, [audioLevel, reduceMotion, target, level]);

  useFrameCallback((frame) => {
    "worklet";
    time.value = frame.timestamp;
    const dt = Math.min((frame.timeSincePreviousFrame ?? 16) / 1000, 0.05);
    const speed = target.value > level.value ? 18 : 8;
    level.value += (target.value - level.value) * Math.min(speed * dt, 1);
  }, !reduceMotion);

  return (
    <View className="h-10 flex-row items-center justify-center gap-[3px]">
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <WaveBar key={i} index={i} time={time} level={level} shimmer={reduceMotion ? 0 : 1} />
      ))}
    </View>
  );
}
