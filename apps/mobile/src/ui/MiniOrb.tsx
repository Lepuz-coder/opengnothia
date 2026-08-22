import { useEffect } from "react";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { GLASS } from "@/theme/sessionAmbience";
import { useThemeColors } from "@/theme/useAppTheme";

/**
 * Desktop's `.mini-orb` (styles.css:404-409) — the AI identity marker that sits
 * above every assistant message and doubles as the empty state. The mobile port
 * used to flatten it to a solid dot; this is the real thing: a teal radial
 * gradient lit from the upper left, a glow, and a slow breath.
 *
 * The gradient's four stops are desktop's exactly, and they turn out to be pure
 * ramp steps — primary-400 → primary-500 → primary-700 → transparent.
 *
 * One static gradient id is safe here for the same reason it is in LockBadge:
 * every instance registers an identical definition, so collisions are invisible.
 */
export function MiniOrb({ size }: { size: number }) {
  const { resolved } = useThemeColors();
  const breath = useSharedValue(0);

  useEffect(() => {
    // Desktop's orb-breathe is a 5s round trip; reversing a 2.5s leg matches it.
    breath.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
      undefined,
      ReduceMotion.System,
    );
  }, [breath]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breath.value * 0.08 }],
    opacity: 0.7 + breath.value * 0.3,
  }));

  return (
    <Animated.View
      style={[
        { width: size, height: size, borderRadius: size / 2, boxShadow: GLASS[resolved].orbGlow },
        animatedStyle,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          {/* radial-gradient(circle at 35% 35%, …) — farthest-corner from (35%,35%)
              is ~92% of the box, which is what sizes the ramp. */}
          <RadialGradient id="miniOrbTeal" cx="35%" cy="35%" r="92%">
            <Stop offset="0" stopColor="#4BC3BE" stopOpacity="0.95" />
            <Stop offset="0.45" stopColor="#3ABAB4" stopOpacity="0.55" />
            <Stop offset="0.72" stopColor="#236E6B" stopOpacity="0.2" />
            <Stop offset="1" stopColor="#236E6B" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill="url(#miniOrbTeal)" />
      </Svg>
    </Animated.View>
  );
}
