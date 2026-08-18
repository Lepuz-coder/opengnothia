import { Text, View } from "react-native";
import { Check, type LucideIcon } from "lucide-react-native";
import { cn } from "@opengnothia/shared/lib/cn";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, Card } from "@/ui";

type RitualTone = "blue" | "purple";

interface RitualCardProps {
  icon: LucideIcon;
  tone: RitualTone;
  title: string;
  body: string;
  done: boolean;
  actionLabel: string;
  actionVariant?: "primary" | "secondary" | "ghost";
  onAction: () => void;
  totalCount: number;
  totalLabel: string;
}

// Desktop passes one combined class ("bg-blue-900/30 text-blue-400"); RN icons
// take a colour value, not a class, so the tone splits into a tile class and a
// per-scheme icon colour. Desktop's dark-only values are the dark halves.
const TONE_TILE: Record<RitualTone, string> = {
  blue: "bg-blue-100 dark:bg-blue-900/30",
  purple: "bg-purple-100 dark:bg-purple-900/30",
};
const TONE_ICON: Record<RitualTone, { light: string; dark: string }> = {
  blue: { light: "#2563EB", dark: "#60A5FA" },
  purple: { light: "#9333EA", dark: "#C084FC" },
};

/** RN port of desktop's RitualCard — purely presentational, data comes from the dashboard. */
export function RitualCard({
  icon: Icon,
  tone,
  title,
  body,
  done,
  actionLabel,
  actionVariant = "secondary",
  onAction,
  totalCount,
  totalLabel,
}: RitualCardProps) {
  const { resolved, colors } = useThemeColors();

  return (
    <Card>
      <View className="mb-3 flex-row items-start justify-between">
        <View className={cn("h-10 w-10 items-center justify-center rounded-xl", TONE_TILE[tone])}>
          <Icon size={20} color={TONE_ICON[tone][resolved]} />
        </View>
        {done ? (
          <View className="h-6 w-6 items-center justify-center rounded-full border border-primary-500/40 bg-primary-500/20">
            <Check size={14} color={colors.tint} strokeWidth={3} />
          </View>
        ) : (
          <View className="h-6 w-6 rounded-full border-2 border-line" />
        )}
      </View>

      <Text className="mb-1 font-semibold text-ink">{title}</Text>
      <Text numberOfLines={2} className="mb-4 text-sm text-ink-soft">
        {body}
      </Text>

      <View className="flex-row items-center justify-between gap-2">
        <Button variant={actionVariant} size="sm" onPress={onAction}>
          {actionLabel}
        </Button>
        <Text className="shrink-0 text-xs text-ink-mute" style={{ fontVariant: ["tabular-nums"] }}>
          {totalCount} {totalLabel}
        </Text>
      </View>
    </Card>
  );
}
