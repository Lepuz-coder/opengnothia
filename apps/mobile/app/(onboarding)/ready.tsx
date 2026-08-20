import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2 } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, Card } from "@/ui";

/**
 * M11's final step. Flipping `onboarded` is the whole exit: the root layout's
 * guards (Step 59) drop this group and land on (tabs) with the onboarding
 * history cleared — no explicit navigation call needed.
 */
export default function OnboardingReadyScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);

  return (
    <View
      className="flex-1 justify-between bg-canvas px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 items-center justify-center gap-6">
        <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-accent-500/15">
          <CheckCircle2 size={38} color={colors.accent} />
        </View>
        <View>
          <Text className="text-center text-3xl font-bold text-ink">{t.onboarding.ready}</Text>
          <Text className="mt-3 text-center text-base leading-relaxed text-ink-soft">
            {t.onboarding.readyMobileDescription}
          </Text>
        </View>
        <Card className="bg-raised">
          <Text className="text-xs leading-relaxed text-ink-mute">{t.onboarding.readyDisclaimer}</Text>
        </Card>
      </View>

      <View className="pb-4">
        <Button size="lg" onPress={() => setOnboarded(true)}>
          {t.onboarding.openApp}
        </Button>
      </View>
    </View>
  );
}
