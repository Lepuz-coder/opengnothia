import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import {
  getBreathingTechniques,
  getDurationOptions,
} from "@opengnothia/shared/constants/breathingTechniques";
import { cn } from "@opengnothia/shared/lib/cn";
import { Button, Card } from "@/ui";

interface BreathingSetupProps {
  selectedTechniqueId: string;
  onSelectTechnique: (id: string) => void;
  selectedDuration: string;
  onSelectDuration: (value: string) => void;
  onStart: () => void;
}

/**
 * RN take on desktop's BreathingSetup: technique cards go single-column (the
 * desktop 2-col grid doesn't fit text-heavy cards on a phone) and the duration
 * <Select> becomes a chip row — the UI kit deliberately has no Select.
 *
 * Technique names/descriptions are pre-translated per language in the shared
 * data, so the language must be passed explicitly — a bare call reads the
 * non-reactive language and would miss in-app language switches.
 */
export function BreathingSetup({
  selectedTechniqueId,
  onSelectTechnique,
  selectedDuration,
  onSelectDuration,
  onStart,
}: BreathingSetupProps) {
  const { t, language } = useTranslation();
  const techniques = getBreathingTechniques(language);
  const durations = getDurationOptions(language);

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-6 px-4 py-4">
      <Text className="text-sm text-ink-mute">{t.breathing.description}</Text>

      <View className="gap-2.5">
        <Text className="px-1 text-sm font-medium text-ink-soft">{t.breathing.selectTechnique}</Text>
        {techniques.map((technique) => {
          const isSelected = technique.id === selectedTechniqueId;
          return (
            <Pressable
              key={technique.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelectTechnique(technique.id)}
            >
              <Card className={cn(isSelected && "border-primary-500 bg-primary-500/10")}>
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="flex-1 text-base font-semibold text-ink">{technique.name}</Text>
                  <Text
                    className="text-xs text-primary-600 dark:text-primary-400"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {technique.phases.map((phase) => `${phase.duration}s`).join("-")}
                  </Text>
                </View>
                <Text className="mt-1.5 text-xs leading-relaxed text-ink-mute">{technique.description}</Text>
              </Card>
            </Pressable>
          );
        })}
      </View>

      <View className="gap-2.5">
        <Text className="px-1 text-sm font-medium text-ink-soft">{t.breathing.duration}</Text>
        <View className="flex-row flex-wrap gap-2">
          {durations.map((option) => {
            const isSelected = option.value === selectedDuration;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelectDuration(option.value)}
                className={cn(
                  "rounded-full border px-4 py-2",
                  isSelected ? "border-transparent bg-primary-500" : "border-line bg-card active:bg-raised"
                )}
              >
                <Text className={cn("text-sm font-medium", isSelected ? "text-white" : "text-ink-soft")}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button size="lg" onPress={onStart}>
        {t.breathing.startExercise}
      </Button>
    </ScrollView>
  );
}
