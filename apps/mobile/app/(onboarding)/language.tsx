import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Check } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { LANGUAGE_OPTIONS } from "@/i18n/languages";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, Card } from "@/ui";

/**
 * M11 step 2. The store already holds the device-detected language (Faz 1),
 * so the list opens pre-selected; picking another one re-renders the whole
 * flow in it immediately — the store IS the i18n source (Step 59).
 */
export default function OnboardingLanguageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
          onPress={() => router.back()}
          className="rounded-full bg-raised p-2 active:bg-line"
        >
          <ArrowLeft size={18} color={colors.inkMute} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-6 pb-4">
        <View>
          <Text className="text-2xl font-bold text-ink">{t.onboarding.languageTitle}</Text>
          <Text className="mt-2 text-sm leading-relaxed text-ink-mute">
            {t.onboarding.languageDescription}
          </Text>
        </View>

        <Card padding="none" className="overflow-hidden">
          {LANGUAGE_OPTIONS.map((option, index) => (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: option.id === language }}
              onPress={() => setLanguage(option.id)}
              className={`flex-row items-center justify-between px-4 py-3.5 active:bg-raised ${index > 0 ? "border-t border-line" : ""}`}
            >
              <Text className="text-base text-ink">{option.label}</Text>
              {option.id === language && <Check size={18} color={colors.tint} />}
            </Pressable>
          ))}
        </Card>
      </ScrollView>

      <View className="px-6 pb-4">
        <Button size="lg" onPress={() => router.push("/quiz")}>
          {t.common.continue}
        </Button>
      </View>
    </View>
  );
}
