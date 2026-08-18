import type { LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { useThemeColors } from "@/theme/useAppTheme";

interface ScreenPlaceholderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

// RN port of desktop's PlaceholderPage. Every tab renders this until its own
// phase lands (Defter → Faz 2, Nefes + Ana Sayfa → Faz 3, Seans → Faz 5,
// Analizler → Faz 6).
export function ScreenPlaceholder({ icon: Icon, title, description }: ScreenPlaceholderProps) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-canvas px-8">
      <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/40">
        <Icon size={32} color={colors.tint} />
      </View>
      <Text className="text-2xl font-bold text-ink">{title}</Text>
      <Text className="text-center text-ink-mute">{description ?? t.placeholder.featureComingSoon}</Text>
    </View>
  );
}
