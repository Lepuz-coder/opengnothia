import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Clock, Lightbulb, Square } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { formatTokenCount } from "@opengnothia/shared/lib/formatTokens";
import { getTherapySchool } from "@opengnothia/shared/constants/therapySchools";
import { useSessionStore } from "@/stores/useSessionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useThemeColors } from "@/theme/useAppTheme";
import { Sheet } from "@/ui";
import { PROXY_CONTEXT_WINDOW } from "./sessionActions";

/** Desktop SessionTimer verbatim: elapsed is recomputed from the wall clock every tick. */
function SessionTimer({ startedAt }: { startedAt: string }) {
  const { colors } = useThemeColors();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    const interval = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <View className="flex-row items-center gap-1.5">
      <Clock size={14} color={colors.inkMute} />
      <Text className="text-sm text-ink-mute" style={{ fontVariant: ["tabular-nums"] }}>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </Text>
    </View>
  );
}

const RING_RADIUS = 7;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ringColor(pct: number): string {
  if (pct >= 80) return "#EF4444";
  if (pct >= 50) return "#EAB308";
  return "#22C55E";
}

interface SessionTopBarProps {
  onEndPress: () => void;
  onInsightsPress: () => void;
}

/**
 * Step 42's compact top bar: timer, school badge, context usage ring (tap for
 * token detail), the in-session insights entry point and the end button.
 * Desktop spreads these over a header plus a bottom controls bar; one row is
 * all a phone has room for.
 */
export function SessionTopBar({ onEndPress, onInsightsPress }: SessionTopBarProps) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const startedAt = useSessionStore((s) => s.startedAt);
  const currentTokens = useSessionStore((s) => s.currentInputTokens);
  const insightCount = useSessionStore((s) => s.sessionInsightIds.length);
  const isStreaming = useSessionStore((s) => s.isStreaming);
  const schoolId = useSettingsStore((s) => s.schoolId);
  const [contextSheetOpen, setContextSheetOpen] = useState(false);

  const school = schoolId ? getTherapySchool(schoolId) : undefined;
  const pct = Math.min((currentTokens / PROXY_CONTEXT_WINDOW) * 100, 100);
  const dash = (pct / 100) * RING_CIRCUMFERENCE;
  const color = ringColor(pct);

  return (
    <>
      <View className="flex-row items-center gap-3 border-b border-line bg-card px-4 py-2.5">
        {startedAt !== null && <SessionTimer startedAt={startedAt} />}
        {school !== undefined && (
          <View className="rounded-full border border-primary-500/25 bg-primary-500/10 px-2 py-0.5">
            <Text className="text-[11px] font-semibold text-primary-600 dark:text-primary-400">
              {school.shortName}
            </Text>
          </View>
        )}
        <View className="flex-1" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.session.contextWindow}
          onPress={() => setContextSheetOpen(true)}
          className="rounded-lg p-1.5 active:bg-raised"
        >
          <Svg viewBox="0 0 18 18" width={20} height={20} style={{ transform: [{ rotate: "-90deg" }] }}>
            <Circle cx={9} cy={9} r={RING_RADIUS} fill="none" stroke={colors.line} strokeWidth={2} />
            <Circle
              cx={9}
              cy={9}
              r={RING_RADIUS}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeDasharray={`${dash} ${RING_CIRCUMFERENCE}`}
              strokeLinecap="round"
            />
          </Svg>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.session.myInsights}
          onPress={onInsightsPress}
          className="flex-row items-center gap-1 rounded-lg p-1.5 active:bg-raised"
        >
          <Lightbulb size={20} color={insightCount > 0 ? colors.tint : colors.inkMute} />
          {insightCount > 0 && (
            <Text className="text-xs font-semibold text-primary-600 dark:text-primary-400" style={{ fontVariant: ["tabular-nums"] }}>
              {insightCount}
            </Text>
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.session.endSession}
          accessibilityState={{ disabled: isStreaming }}
          disabled={isStreaming}
          onPress={onEndPress}
          className="rounded-lg p-1.5 active:bg-raised"
          style={isStreaming ? { opacity: 0.4 } : undefined}
        >
          <Square size={18} color="#EF4444" fill="#EF4444" />
        </Pressable>
      </View>

      <Sheet isOpen={contextSheetOpen} onClose={() => setContextSheetOpen(false)} title={t.session.contextWindow}>
        <View className="mb-2 flex-row items-baseline justify-between">
          <Text className="text-sm text-ink-soft" style={{ fontVariant: ["tabular-nums"] }}>
            {formatTokenCount(currentTokens)} / {formatTokenCount(PROXY_CONTEXT_WINDOW)}
          </Text>
          <Text className="text-sm font-semibold text-ink" style={{ fontVariant: ["tabular-nums"] }}>
            {Math.round(pct)}%
          </Text>
        </View>
        <View className="mb-2 h-2 overflow-hidden rounded-full bg-raised">
          <View className="h-full rounded-full" style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: color }} />
        </View>
      </Sheet>
    </>
  );
}
