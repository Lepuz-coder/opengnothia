import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { cn } from "@opengnothia/shared/lib/cn";
import { Button } from "@/ui";
import { useSettingsStore } from "@/stores/useSettingsStore";
import {
  BELL_PACK_IDS,
  MEDITATION_DURATIONS,
  MEDITATION_INTERVALS,
  MEDITATION_PREPS,
  type BellPackId,
} from "./constants";

interface MeditationSetupProps {
  onStart: () => void;
}

interface ChipOption<T> {
  value: T;
  label: string;
}

/**
 * Timer setup, the meditation half of the tab.
 *
 * Every choice is a chip row rather than a picker, matching BreathingSetup — the
 * UI kit deliberately has no Select, and four rows of chips read as one control
 * surface. Unlike breathing, the choices persist: a sitting practice is a habit,
 * and re-picking 20 minutes every morning is friction.
 */
export function MeditationSetup({ onStart }: MeditationSetupProps) {
  const { t } = useTranslation();

  const duration = useSettingsStore((s) => s.meditationDuration);
  const setDuration = useSettingsStore((s) => s.setMeditationDuration);
  const prep = useSettingsStore((s) => s.meditationPrep);
  const setPrep = useSettingsStore((s) => s.setMeditationPrep);
  const interval = useSettingsStore((s) => s.meditationInterval);
  const setInterval = useSettingsStore((s) => s.setMeditationInterval);
  const bell = useSettingsStore((s) => s.meditationBell);
  const setBell = useSettingsStore((s) => s.setMeditationBell);

  const minutes = (seconds: number) => `${seconds / 60} ${t.common.minutesShort}`;

  const durationOptions: ChipOption<number>[] = MEDITATION_DURATIONS.map((value) => ({
    value,
    label: minutes(value),
  }));

  const prepOptions: ChipOption<number>[] = MEDITATION_PREPS.map((value) => ({
    value,
    label: value === 0 ? t.meditation.prepareNone : `${value} ${t.meditation.secondsShort}`,
  }));

  const intervalOptions: ChipOption<number>[] = MEDITATION_INTERVALS.map((value) => ({
    value,
    label: value === 0 ? t.meditation.intervalNone : minutes(value),
  }));

  const bellOptions: ChipOption<BellPackId>[] = BELL_PACK_IDS.map((value) => ({
    value,
    label: value === "bowl" ? t.meditation.bellBowl : t.meditation.bellGong,
  }));

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-6 px-4 py-4">
      <Text className="text-sm text-ink-mute">{t.meditation.description}</Text>

      <ChipRow label={t.meditation.duration} options={durationOptions} selected={duration} onSelect={setDuration} />
      <ChipRow label={t.meditation.prepare} options={prepOptions} selected={prep} onSelect={setPrep} />
      <ChipRow
        label={t.meditation.intervalBell}
        options={intervalOptions}
        selected={interval}
        onSelect={setInterval}
      />
      <ChipRow label={t.meditation.bellSound} options={bellOptions} selected={bell} onSelect={setBell} />

      <Button size="lg" onPress={onStart}>
        {t.meditation.start}
      </Button>
    </ScrollView>
  );
}

/** BreathingSetup's duration chip row, generalised — this screen needs four of them. */
function ChipRow<T extends string | number>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: ChipOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View className="gap-2.5">
      <Text className="px-1 text-sm font-medium text-ink-soft">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = option.value === selected;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(option.value)}
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
  );
}
