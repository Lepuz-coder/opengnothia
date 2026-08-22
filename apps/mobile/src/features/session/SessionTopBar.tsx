import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { Clock, Lightbulb, Square } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { getTherapySchool } from "@opengnothia/shared/constants/therapySchools";
import { useSessionStore } from "@/stores/useSessionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { GLASS } from "@/theme/sessionAmbience";
import { useThemeColors } from "@/theme/useAppTheme";

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

interface SessionTopBarProps {
  onEndPress: () => void;
  onInsightsPress: () => void;
}

/**
 * Step 42's compact top bar: timer, school badge, the in-session insights entry
 * point and the end button. Desktop spreads these over a header plus a bottom
 * controls bar; one row is all a phone has room for.
 *
 * Desktop's context-usage donut has no counterpart here — the phone bar stays
 * down to what a session actually needs in reach.
 */
export function SessionTopBar({ onEndPress, onInsightsPress }: SessionTopBarProps) {
  const { t } = useTranslation();
  const { colors, resolved } = useThemeColors();
  const startedAt = useSessionStore((s) => s.startedAt);
  const insightCount = useSessionStore((s) => s.sessionInsightIds.length);
  const isStreaming = useSessionStore((s) => s.isStreaming);
  const schoolId = useSettingsStore((s) => s.schoolId);

  const school = schoolId ? getTherapySchool(schoolId) : undefined;

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: GLASS[resolved].hairline }}>
      <BlurView
        intensity={60}
        tint={resolved === "dark" ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: GLASS[resolved].chromeTint }]} />
      <View className="flex-row items-center gap-3 px-4 py-2.5">
        {startedAt !== null && <SessionTimer startedAt={startedAt} />}
        {school !== undefined && (
          <View className="rounded-full border border-primary-500/25 bg-primary-500/10 px-2 py-0.5 dark:border-primary-500/30 dark:bg-primary-900/40">
            <Text className="text-[11px] font-semibold text-primary-700 dark:text-primary-300">
              {school.shortName}
            </Text>
          </View>
        )}
        <View className="flex-1" />
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
    </View>
  );
}
