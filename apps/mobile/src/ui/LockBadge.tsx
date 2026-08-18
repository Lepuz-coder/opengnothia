import { Text, View } from "react-native";
import { Lock } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { cn } from "@opengnothia/shared/lib/cn";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";
import { useThemeColors } from "@/theme/useAppTheme";

/**
 * M3: AI entry points are never hidden from free users — they carry this badge
 * and route to the paywall on tap (via useProGate). The badge reads the
 * subscription itself and disappears for Pro, so call sites stay one-liners.
 */
export function LockBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const isPro = useSubscriptionStore((s) => s.isPro);

  if (isPro) return null;

  return (
    <View
      className={cn(
        "flex-row items-center gap-1 self-start rounded-full bg-accent-100 px-2 py-0.5 dark:bg-accent-900/40",
        className
      )}
    >
      <Lock size={11} color={colors.accent} />
      <Text className="text-[11px] font-semibold text-accent-700 dark:text-accent-300">
        {t.paywall.badge}
      </Text>
    </View>
  );
}
