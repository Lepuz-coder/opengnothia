import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

/**
 * Desktop's from-primary-400 to-primary-700 diagonal gradient disc. Used as the
 * breathing exercise's pulsing circle and as the completion mark behind the
 * check on both the breathing and meditation finish screens.
 *
 * One static gradient id is safe here for the same reason it is in MiniOrb:
 * every instance registers an identical definition, so collisions are invisible.
 */
export function GradientCircle({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="breathGradient" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#4BC3BE" />
          <Stop offset="1" stopColor="#236E6B" />
        </LinearGradient>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#breathGradient)" />
    </Svg>
  );
}
