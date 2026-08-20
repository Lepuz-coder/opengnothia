import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Compass, Heart, Lock, Sparkles } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, Card } from "@/ui";

/**
 * M11 step 1. Desktop's WelcomeStep, minus what mobile doesn't have: no data
 * import (M10 defers portability) and no "own API key" pillar — AI runs behind
 * the Worker here, so the middle pillar sells the school quiz instead.
 */
export default function OnboardingWelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <ScrollView className="flex-1" contentContainerClassName="flex-grow justify-center gap-6 px-6 py-8">
        <View className="items-center">
          <View className="mb-5 h-20 w-20 items-center justify-center rounded-[28px] bg-primary-100 dark:bg-primary-900/40">
            <Sparkles size={38} color={colors.tint} />
          </View>
          <Text className="text-center text-3xl font-bold text-ink">{t.onboarding.welcome}</Text>
          <Text className="mt-3 text-center text-base leading-relaxed text-ink-soft">
            {t.onboarding.welcomeDescription}
          </Text>
        </View>

        <View className="gap-3">
          <PillarCard
            icon={<Lock size={20} color={colors.tint} />}
            title={t.onboarding.completelyLocal}
            description={t.onboarding.completelyLocalDescription}
          />
          <PillarCard
            icon={<Compass size={20} color={colors.tint} />}
            title={t.onboarding.personalizedApproach}
            description={t.onboarding.personalizedApproachDescription}
          />
          <PillarCard
            icon={<Heart size={20} color={colors.tint} />}
            title={t.onboarding.openSource}
            description={t.onboarding.openSourceDescription}
          />
        </View>
      </ScrollView>

      <View className="px-6 pb-4">
        <Button size="lg" onPress={() => router.push("/language")}>
          {t.onboarding.letsStart}
        </Button>
      </View>
    </View>
  );
}

function PillarCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <View className="flex-row items-start gap-3.5">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15">{icon}</View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-ink">{title}</Text>
          <Text className="mt-0.5 text-xs leading-relaxed text-ink-mute">{description}</Text>
        </View>
      </View>
    </Card>
  );
}
