import { StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { Sparkles } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { cn } from "@opengnothia/shared/lib/cn";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";
import { useThemeColors } from "@/theme/useAppTheme";

// Dark-on-gold works in both schemes, so the chip needs no dark: variants.
const GOLD_INK = "#3D290B"; // accent-950

/**
 * M3: AI entry points are never hidden from free users — they carry this badge
 * and route to the paywall on tap (via useProGate). The badge reads the
 * subscription itself and disappears for Pro, so call sites stay one-liners.
 *
 * Visual language: a gold-gradient chip with the paywall's Sparkles mark —
 * accent ramp only, same in light and dark (just a softer glow in light).
 */
export function LockBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { resolved } = useThemeColors();
  const isPro = useSubscriptionStore((s) => s.isPro);

  if (isPro) return null;

  return (
    <View
      className={cn("self-start rounded-full", className)}
      style={{
        boxShadow:
          resolved === "dark"
            ? "0px 2px 10px rgba(237, 180, 72, 0.45)"
            : "0px 1px 6px rgba(196, 138, 42, 0.30)",
      }}
    >
      <View className="flex-row items-center gap-1 overflow-hidden rounded-full border border-accent-200 px-2.5 py-[3px]">
        {/* Same duplicated-static-id idiom as MoodPicker: every instance renders
            the identical gradient, so registry collisions are invisible. */}
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="proBadgeGold" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#F2C66E" />
              <Stop offset="0.55" stopColor="#E8A838" />
              <Stop offset="1" stopColor="#C48A2A" />
            </LinearGradient>
          </Defs>
          <Rect width="100" height="100" fill="url(#proBadgeGold)" />
        </Svg>
        <Sparkles size={10} color={GOLD_INK} fill={GOLD_INK} strokeWidth={1} />
        <Text className="text-[11px] font-bold tracking-wide" style={{ color: GOLD_INK }}>
          {t.paywall.badge}
        </Text>
      </View>
    </View>
  );
}
