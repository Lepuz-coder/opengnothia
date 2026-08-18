import { Text, View } from "react-native";
import { ArrowRight, MessageSquare, Play, Sparkles, type LucideIcon } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import type { Session, UserProfile } from "@opengnothia/shared/types";
import { cn } from "@opengnothia/shared/lib/cn";
import { toIsoUtc } from "@/lib/date";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, Card } from "@/ui";

interface TodaySessionHeroProps {
  todaySession: Session | null;
  profile: UserProfile | null;
}

function minutesSince(timestamp: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(toIsoUtc(timestamp)).getTime()) / 60000));
}

/**
 * RN port of desktop's TodaySessionHero, with the same three states
 * (ready / active / completed — "abandoned" reads as ready, like desktop).
 * The CTA is deliberately inert until Faz 6 Step 53 wires it to the session
 * flow or the paywall (M3); it must stay visible meanwhile (Step 24).
 * Desktop's animated gradient orb flattens to a static tinted disc.
 */
export function TodaySessionHero({ todaySession, profile }: TodaySessionHeroProps) {
  const { t } = useTranslation();
  const { resolved } = useThemeColors();

  const isActive = todaySession?.status === "active";
  const isCompleted = todaySession?.status === "completed";

  let title: string;
  let subtitle: string;
  let primaryLabel: string;
  let PrimaryIcon: LucideIcon = Play;
  let accent: "primary" | "accent" = "primary";

  if (isActive && todaySession) {
    title = t.dashboard.sessionInProgress;
    subtitle = t.dashboard.sessionStartedAgo.replace("{minutes}", String(minutesSince(todaySession.started_at)));
    primaryLabel = t.dashboard.continueTodaySession;
    PrimaryIcon = ArrowRight;
  } else if (isCompleted) {
    title = t.dashboard.sessionCompletedToday;
    subtitle = "";
    primaryLabel = t.dashboard.startAnotherSession;
    accent = "accent";
  } else {
    title = t.dashboard.readyForSession;
    subtitle = t.dashboard.preferredTimeHint.replace("{time}", profile?.preferred_session_time || "20:00");
    primaryLabel = t.dashboard.startTodaySession;
  }

  const isAccent = accent === "accent";
  const HeaderIcon = isCompleted ? Sparkles : MessageSquare;
  const headerIconColor = isAccent
    ? resolved === "light"
      ? "#C48A2A" // accent-600
      : "#EDB448" // accent-400
    : resolved === "light"
      ? "#2D8F8B" // primary-600
      : "#4BC3BE"; // primary-400

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        isAccent ? "border-accent-500/40 bg-accent-500/10" : "border-primary-500/40 bg-primary-500/10"
      )}
    >
      <View
        className={cn(
          "absolute -right-16 -top-16 h-48 w-48 rounded-full",
          isAccent ? "bg-accent-500/10" : "bg-primary-500/10"
        )}
      />

      <View
        className={cn(
          "mb-3 h-12 w-12 items-center justify-center rounded-2xl",
          isAccent ? "bg-accent-500/15" : "bg-primary-500/15"
        )}
      >
        <HeaderIcon size={22} color={headerIconColor} />
      </View>

      <Text
        className={cn(
          "text-xs font-semibold uppercase tracking-widest",
          isAccent ? "text-accent-600 dark:text-accent-400" : "text-primary-600 dark:text-primary-400"
        )}
      >
        {t.dashboard.todaySession}
      </Text>
      <Text className="mt-1 text-xl font-bold text-ink">{title}</Text>
      {subtitle !== "" && <Text className="mt-1 text-sm text-ink-mute">{subtitle}</Text>}

      <Button
        className="mt-4 self-start"
        icon={<PrimaryIcon size={16} color="#fff" />}
        onPress={() => {
          // Passive until Faz 6 (Step 53): session flow / paywall routing.
        }}
      >
        {primaryLabel}
      </Button>
    </Card>
  );
}
