import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack } from "expo-router";
import { Check } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import type { Theme } from "@opengnothia/shared/types";
import { LANGUAGE_OPTIONS } from "@/i18n/languages";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useThemeColors, useThemePreference } from "@/theme/useAppTheme";
import { Card, SegmentedTabs } from "@/ui";

/**
 * Skeleton Settings (Step 13): only the two controls needed to exercise the
 * rest of the app during development. Ekol lands in Faz 7, and subscription /
 * app lock / about in Faz 9 (M10) — all as further sections on this screen.
 */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useThemePreference();
  const { colors } = useThemeColors();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const themeTabs: { id: Theme; label: string }[] = [
    { id: "system", label: t.settings.themeSystem },
    { id: "light", label: t.settings.themeLight },
    { id: "dark", label: t.settings.themeDark },
  ];

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
                selected={option.id === language}
                withDivider={index > 0}
                tint={colors.tint}
                onPress={() => setLanguage(option.id)}
              />
            ))}
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
