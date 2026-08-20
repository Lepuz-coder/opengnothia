import { Text, View } from "react-native";
import { CheckCircle2, Lock, Sparkles } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import type { MilestoneDef } from "@opengnothia/shared/constants/milestones";
import { cn } from "@opengnothia/shared/lib/cn";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, Card, LockBadge } from "@/ui";

interface MilestoneCardProps {
  def: MilestoneDef;
  sessionCount: number;
  hasCached: boolean;
  /** This card's generation is streaming right now. */
  generating: boolean;
  /** Some generation is running — every action button waits (desktop parity). */
  disabled: boolean;
  onPress: () => void;
}

/**
 * One roadmap row of the Analyses tab — desktop AnalysesPage's milestone card
 * in RN. Locked cards show remaining sessions; completed ones carry the
 * show/generate action, badged while generation would be a new AI call (M3);
 * desktop's grayscale filter on locked emoji becomes plain opacity.
 */
export function MilestoneCard({ def, sessionCount, hasCached, generating, disabled, onPress }: MilestoneCardProps) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();

  const isCompleted = sessionCount >= def.sessions;
  const progress = Math.min(sessionCount / def.sessions, 1);
  const remaining = def.sessions - sessionCount;

  return (
    <Card>
      <View className="flex-row items-start gap-3">
        <Text className={cn("text-2xl", !isCompleted && "opacity-40")}>{def.emoji}</Text>

        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-1 flex-row items-center gap-1.5">
              <Text
                className={cn("text-base font-semibold", isCompleted ? "text-ink" : "text-ink-mute")}
                numberOfLines={1}
              >
                {t.analyses[def.nameKey]}
              </Text>
              {isCompleted ? (
                <CheckCircle2 size={15} color="#22C55E" />
              ) : (
                <Lock size={13} color={colors.inkMute} />
              )}
            </View>
            <Text
              className={cn("text-sm font-medium", isCompleted ? "text-green-500" : "text-ink-mute")}
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {Math.min(sessionCount, def.sessions)} / {def.sessions}
            </Text>
          </View>

          <Text className={cn("mt-0.5 text-xs leading-relaxed", isCompleted ? "text-ink-soft" : "text-ink-mute")}>
            {t.analyses[def.descKey]}
          </Text>

          <View className="mt-2.5 h-2 overflow-hidden rounded-full bg-raised">
            <View
              className={cn("h-full rounded-full", isCompleted ? "bg-green-500" : "bg-primary-500")}
              style={{ width: `${progress * 100}%` }}
            />
          </View>

          <View className="mt-3">
            {isCompleted ? (
              <View className="flex-row items-center gap-2.5">
                <Button
                  size="sm"
                  icon={generating ? undefined : <Sparkles size={15} color="#fff" />}
                  loading={generating}
                  disabled={disabled}
                  onPress={onPress}
                >
                  {generating ? t.analyses.analyzing : hasCached ? t.analyses.showAnalysis : t.analyses.generateAnalysis}
                </Button>
                {!hasCached && <LockBadge />}
              </View>
            ) : (
              <View className="flex-row items-center gap-1.5">
                <Lock size={12} color={colors.inkMute} />
                <Text className="text-xs text-ink-mute">
                  {remaining} {t.analyses.sessionsToGo}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
}
