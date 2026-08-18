import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { getNextMilestone, MILESTONE_DEFS } from "@opengnothia/shared/constants/milestones";
import { useThemeColors } from "@/theme/useAppTheme";
import { Card } from "@/ui";

interface JourneyCardProps {
  sessionCount: number;
}

/**
 * The new-for-mobile "journey" card (M1): completed session count against the
 * next milestone, linking to the Analyses tab. Content mirrors the desktop
 * AnalysesPage "next goal" block, whose milestone defs now live in shared.
 */
export function JourneyCard({ sessionCount }: JourneyCardProps) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const router = useRouter();

  const next = getNextMilestone(sessionCount);
  const target = next ?? MILESTONE_DEFS[MILESTONE_DEFS.length - 1];
  const progress = Math.min(sessionCount / target.sessions, 1);

  return (
    <Pressable accessibilityRole="button" onPress={() => router.push("/analyses")} className="active:opacity-80">
      <Card>
        <View className="flex-row items-center gap-3">
          <Text className="text-3xl">{target.emoji}</Text>
          <View className="flex-1">
            <Text className="text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400">
              {next ? t.analyses.nextGoal : t.analyses.milestones}
            </Text>
            <Text className="mt-0.5 text-base font-bold text-ink">{t.analyses[target.nameKey]}</Text>
            <Text className="mt-0.5 text-xs text-ink-mute">
              {next ? `${target.sessions - sessionCount} ${t.analyses.sessionsToGo}` : t.analyses.completed}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.inkMute} />
        </View>

        <View className="mt-3 h-2.5 overflow-hidden rounded-full bg-raised">
          <View className="h-full rounded-full bg-primary-500" style={{ width: `${progress * 100}%` }} />
        </View>
        <View className="mt-1.5 flex-row justify-between">
          <Text className="text-xs text-ink-mute" style={{ fontVariant: ["tabular-nums"] }}>
            {sessionCount} / {target.sessions}
          </Text>
          <Text className="text-xs text-ink-mute" style={{ fontVariant: ["tabular-nums"] }}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
