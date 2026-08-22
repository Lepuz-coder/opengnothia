import { useEffect } from "react";
import { StyleSheet, View, useWindowDimensions, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { AURORA, type AuroraPalette } from "@/theme/sessionAmbience";
import { useThemeColors } from "@/theme/useAppTheme";

/**
 * Desktop's AmbientBackground (`.aurora-orb`, styles.css:365-396) ported to RN:
 * three huge, very soft radial gradients drifting behind the session.
 *
 * Desktop stacks a `blur(60px)` on each gradient, but its own comment
 * (styles.css:363-364) says the softness comes from the gradient and the blur is
 * never animated — so an SVG <RadialGradient> reproduces it without the blur RN
 * doesn't have. Two extra stops guard against banding, which the 60px blur would
 * otherwise have smoothed away.
 *
 * Only transform and opacity animate, exactly as on desktop.
 */

interface OrbSpec {
  hue: keyof AuroraPalette;
  /** Diameter as a multiple of the screen width. */
  sizeRatio: number;
  /** Resting position, from desktop's top/left/right/bottom percentages. */
  position: (w: number, h: number) => ViewStyle;
  durationMs: number;
  /** Keyframes at 0% / 50% / 100%. Drift is in viewport fractions (desktop's vw/vh). */
  driftX: readonly [number, number, number];
  driftY: readonly [number, number, number];
  scale: readonly [number, number, number];
  opacity: readonly [number, number, number];
}

const ORBS: readonly OrbSpec[] = [
  {
    hue: "teal",
    sizeRatio: 1.5,
    position: (w, h) => ({ top: -0.18 * h, left: -0.12 * w }),
    durationMs: 75_000,
    driftX: [0, 0.06, -0.04],
    driftY: [0, 0.05, 0.08],
    scale: [1, 1.12, 1.04],
    opacity: [0.75, 1, 0.65],
  },
  {
    hue: "blue",
    sizeRatio: 1.3,
    position: (w, h) => ({ top: 0.28 * h, right: -0.14 * w }),
    durationMs: 90_000,
    driftX: [0, -0.07, 0.03],
    driftY: [0, -0.04, -0.08],
    scale: [1, 1.15, 0.95],
    opacity: [0.7, 1, 0.6],
  },
  {
    hue: "violet",
    sizeRatio: 1.1,
    position: (w, h) => ({ bottom: -0.14 * h, left: 0.18 * w }),
    durationMs: 60_000,
    driftX: [0, 0.05, -0.05],
    driftY: [0, -0.06, 0.03],
    scale: [1, 1.1, 1.02],
    opacity: [0.65, 0.95, 0.6],
  },
];

/** Reads a 3-keyframe track the way a CSS `alternate` animation does: 0 → 50% → 100%. */
function track(p: number, keyframes: readonly [number, number, number]): number {
  "worklet";
  const [a, b, c] = keyframes;
  return p < 0.5 ? a + (b - a) * (p / 0.5) : b + (c - b) * ((p - 0.5) / 0.5);
}

function AuroraLayer({ spec, color, alpha }: { spec: OrbSpec; color: string; alpha: number }) {
  const { width, height } = useWindowDimensions();
  const size = width * spec.sizeRatio;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: spec.durationMs, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
      undefined,
      ReduceMotion.System,
    );
  }, [progress, spec.durationMs]);

  // Pull the plain keyframe tuples out first: `spec` also holds a `position`
  // function, and capturing a non-worklet function in a worklet closure fails.
  const { driftX, driftY, scale, opacity } = spec;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: track(progress.value, opacity),
    transform: [
      { translateX: track(progress.value, driftX) * width },
      { translateY: track(progress.value, driftY) * height },
      { scale: track(progress.value, scale) },
    ],
  }));

  const gradientId = `aurora-${spec.hue}`;

  return (
    <Animated.View
      style={[{ position: "absolute", width: size, height: size }, spec.position(width, height), animatedStyle]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          {/* Desktop anchors the ramp at 0% / 40% / 70%; the other two stops only
              smooth the falloff. r=70.7% is CSS's farthest-corner for a circle. */}
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="70.7%">
            <Stop offset="0" stopColor={color} stopOpacity={alpha} />
            <Stop offset="0.2" stopColor={color} stopOpacity={alpha * 0.72} />
            <Stop offset="0.4" stopColor={color} stopOpacity={alpha * 0.38} />
            <Stop offset="0.55" stopColor={color} stopOpacity={alpha * 0.18} />
            <Stop offset="0.7" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill={`url(#${gradientId})`} />
      </Svg>
    </Animated.View>
  );
}

export function SessionAmbience() {
  const { resolved } = useThemeColors();
  const palette = AURORA[resolved];

  return (
    <View
      style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {ORBS.map((spec) => (
        // Re-keyed per scheme so the gradient stops rebuild on a theme switch.
        <AuroraLayer
          key={`${spec.hue}-${resolved}`}
          spec={spec}
          color={palette[spec.hue].color}
          alpha={palette[spec.hue].alpha}
        />
      ))}
    </View>
  );
}
