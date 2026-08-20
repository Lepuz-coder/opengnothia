import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Check, RefreshCw } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { getLocalizedSchoolQuiz } from "@opengnothia/shared/i18n/schoolQuiz";
import { getTherapySchool } from "@opengnothia/shared/constants/therapySchools";
import type { Theme } from "@opengnothia/shared/types";
import { LANGUAGE_OPTIONS } from "@/i18n/languages";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useThemeColors, useThemePreference } from "@/theme/useAppTheme";
import { Card, SegmentedTabs } from "@/ui";

/**
 * Settings: theme + language (Faz 1) and the therapy school section (Faz 7,
 * M2 — current school and "retake the quiz", never a school list). The
 * subscription / app lock / about sections land in Faz 9 (M10).
 */
export default function SettingsScreen() {
  const { t, language } = useTranslation();
  const theme = useThemePreference();
  const { colors } = useThemeColors();
  const router = useRouter();
  const currentLanguage = useSettingsStore((s) => s.language);
  const schoolId = useSettingsStore((s) => s.schoolId);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const themeTabs: { id: Theme; label: string }[] = [
    { id: "system", label: t.settings.themeSystem },
    { id: "light", label: t.settings.themeLight },
    { id: "dark", label: t.settings.themeDark },
  ];

  const quizTexts = getLocalizedSchoolQuiz(language);
  const school = schoolId !== null ? getTherapySchool(schoolId, language) : undefined;

  return (
    <>
      <Stack.Screen options={{ title: t.settings.title }} />
      <ScrollView className="flex-1 bg-canvas" contentContainerClassName="gap-6 px-4 py-4">
        <View className="gap-2">
          <Text className="px-1 text-sm font-medium text-ink-mute">{t.settings.theme}</Text>
          <SegmentedTabs tabs={themeTabs} activeTab={theme} onChange={setTheme} />
        </View>

        <View className="gap-2">
          <Text className="px-1 text-sm font-medium text-ink-mute">{t.settings.languageLabel}</Text>
          <Card padding="none" className="overflow-hidden">
            {LANGUAGE_OPTIONS.map((option, index) => (
              <LanguageRow
                key={option.id}
                label={option.label}
                selected={option.id === currentLanguage}
                withDivider={index > 0}
                tint={colors.tint}
                onPress={() => setLanguage(option.id)}
              />
            ))}
          </Card>
        </View>

        <View className="gap-2">
          <Text className="px-1 text-sm font-medium text-ink-mute">{t.settings.therapySchool}</Text>
          <Card padding="none" className="overflow-hidden">
            <View className="px-4 py-3.5">
              <Text className="text-base font-semibold text-ink">
                {school?.name ?? quizTexts.noSchoolLabel}
              </Text>
              {school && (
                <Text className="mt-1 text-xs leading-relaxed text-ink-mute">{school.description}</Text>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/school-quiz")}
              className="flex-row items-center gap-2.5 border-t border-line px-4 py-3.5 active:bg-raised"
            >
              <RefreshCw size={16} color={colors.tint} />
              <Text className="text-[15px] font-medium text-primary-600 dark:text-primary-400">
                {schoolId !== null ? quizTexts.retakeButton : quizTexts.takeButton}
              </Text>
            </Pressable>
          </Card>
        </View>
      </ScrollView>
    </>
  );
}

function LanguageRow({
  label,
  selected,
  withDivider,
  tint,
  onPress,
}: {
  label: string;
  selected: boolean;
  withDivider: boolean;
  tint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`flex-row items-center justify-between px-4 py-3.5 active:bg-raised ${withDivider ? "border-t border-line" : ""}`}
    >
      <Text className="text-base text-ink">{label}</Text>
      {selected && <Check size={18} color={tint} />}
    </Pressable>
  );
}
