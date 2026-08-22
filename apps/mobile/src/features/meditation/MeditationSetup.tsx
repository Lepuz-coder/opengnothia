import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Plus, Square, Trash2, Volume2 } from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "@opengnothia/shared/i18n";
import { cn } from "@opengnothia/shared/lib/cn";
import { formatClock } from "@/lib/duration";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, Card, Slider } from "@/ui";
import { useSettingsStore } from "@/stores/useSettingsStore";
import {
  BELL_PACK_IDS,
  BELL_STEP,
  DURATION_MAX,
  DURATION_MIN,
  DURATION_STEP,
  MAX_BELLS,
  PREP_MAX,
  PREP_MIN,
  PREP_STEP,
  lastBellSlot,
  nextBellSlot,
  normalizeBells,
} from "./constants";
import { useBellPreview } from "./useBellPreview";

const TABULAR = { fontVariant: ["tabular-nums" as const] };

interface MeditationSetupProps {
  onStart: () => void;
}

/**
 * Timer setup, the meditation half of the tab.
 *
 * Chip rows were the first cut and they did not survive contact: seven lengths,
 * three preparations and six gaps is twenty-two targets to read before sitting
 * down, and the grid could still only offer the values someone had thought to
 * list. Sliders say the same thing in three strips, and the length reads as a
 * clock rather than as a chosen option — the point of the screen is the number.
 *
 * Interval bells are moments inside the sitting, not a repeating gap, so "ring
 * at 15:00 and again at 18:00" is expressible. Every row's track carries the
 * other bells as marks, which turns the list into a picture of the sitting: you
 * place a bell against the ones already there rather than against a number.
 *
 * The bell pack keeps its chips. Two options is not a range.
 */
export function MeditationSetup({ onStart }: MeditationSetupProps) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();

  const storedDuration = useSettingsStore((s) => s.meditationDuration);
  const setDuration = useSettingsStore((s) => s.setMeditationDuration);
  const storedPrep = useSettingsStore((s) => s.meditationPrep);
  const setPrep = useSettingsStore((s) => s.setMeditationPrep);
  const bells = useSettingsStore((s) => s.meditationBells);
  const setBells = useSettingsStore((s) => s.setMeditationBells);
  const bell = useSettingsStore((s) => s.meditationBell);
  const setBell = useSettingsStore((s) => s.setMeditationBell);

  const preview = useBellPreview();

  // A bell that follows the user to another tab is a bell nobody asked for.
  useFocusEffect(useCallback(() => () => preview.stop(), [preview.stop]));

  // Every store write here is persisted, and a slider reports every step the
  // finger crosses: writing them through would put sixty AsyncStorage round
  // trips through one drag of the length track. The draft carries the value
  // under the finger and the store takes it on release — which is the whole
  // reason Slider separates onChange from onCommit.
  const [draft, setDraft] = useState<{ key: string; value: number } | null>(null);
  const live = (key: string, stored: number) => (draft?.key === key ? draft.value : stored);
  const drag = (key: string) => (value: number) => setDraft({ key, value });

  const duration = live("duration", storedDuration);
  const prep = live("prep", storedPrep);
  const bellCeiling = Math.max(BELL_STEP, lastBellSlot(duration));
  const canAddBell = bells.length < MAX_BELLS && nextBellSlot(bells, duration) !== null;

  // Each commit works from its own argument rather than re-reading what it just
  // wrote: React batches the last onChange with the onCommit that follows it,
  // so a store read inside a commit is one step behind the finger.
  const commitDuration = (next: number) => {
    setDraft(null);
    setDuration(next);
    const fitted = normalizeBells(bells, next);
    if (fitted.length !== bells.length || fitted.some((at, index) => at !== bells[index])) setBells(fitted);
  };

  const commitPrep = (next: number) => {
    setDraft(null);
    setPrep(next);
  };

  const commitBell = (index: number, next: number) => {
    setDraft(null);
    const updated = [...bells];
    updated[index] = next;
    setBells(normalizeBells(updated, storedDuration));
  };

  const addBell = () => {
    const at = nextBellSlot(bells, duration);
    if (at === null || bells.length >= MAX_BELLS) return;
    setBells([...bells, at].sort((a, b) => a - b));
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-3 px-4 py-3 pb-8">
      <Text className="px-1 text-sm text-ink-mute">{t.meditation.description}</Text>

      {/* Length and preparation share a card: both are the shape of the sitting
          rather than of its bells, and one fewer card is what lets the start
          button sit on the first screen instead of under the fold. */}
      <Card padding="lg" className="gap-1">
        <Text className="text-center text-xs font-semibold uppercase tracking-widest text-ink-mute">
          {t.meditation.duration}
        </Text>
        <Text className="text-center text-5xl font-bold text-ink" style={TABULAR}>
          {formatClock(duration)}
        </Text>
        <Slider
          className="mt-2"
          value={duration}
          min={DURATION_MIN}
          max={DURATION_MAX}
          step={DURATION_STEP}
          onChange={drag("duration")}
          onCommit={commitDuration}
          accessibilityLabel={t.meditation.duration}
        />
        <View className="flex-row justify-between px-0.5">
          <Text className="text-xs text-ink-mute">{`${DURATION_MIN / 60} ${t.common.minutesShort}`}</Text>
          <Text className="text-xs text-ink-mute">{`${DURATION_MAX / 60} ${t.common.minutesShort}`}</Text>
        </View>

        <View className="my-3 h-px bg-line" />

        <View className="flex-row items-baseline justify-between">
          <Text className="text-sm font-medium text-ink-soft">{t.meditation.prepare}</Text>
          <Text className="text-base font-semibold text-ink" style={TABULAR}>
            {prep === 0 ? t.meditation.prepareNone : `${prep} ${t.meditation.secondsShort}`}
          </Text>
        </View>
        <Slider
          value={prep}
          min={PREP_MIN}
          max={PREP_MAX}
          step={PREP_STEP}
          onChange={drag("prep")}
          onCommit={commitPrep}
          accessibilityLabel={t.meditation.prepare}
        />
      </Card>

      <Card className="gap-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-ink-soft">{t.meditation.intervalBell}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canAddBell }}
            disabled={!canAddBell}
            onPress={addBell}
            className={cn(
              "flex-row items-center gap-1.5 rounded-full px-3 py-1.5",
              canAddBell ? "bg-raised active:bg-line" : "opacity-40"
            )}
          >
            <Plus size={14} color={colors.tint} strokeWidth={2.5} />
            <Text className="text-xs font-semibold text-ink">{t.meditation.addBell}</Text>
          </Pressable>
        </View>

        {bells.length === 0 ? (
          <View className="items-center gap-1 py-4">
            <Text className="text-sm font-medium text-ink-soft">{t.meditation.noBells}</Text>
            <Text className="text-center text-xs text-ink-mute">{t.meditation.noBellsHint}</Text>
          </View>
        ) : (
          bells.map((at, index) => (
            // Index keys on purpose: a commit re-sorts the list, and the rows are
            // positions on a timeline rather than things with an identity of
            // their own — row two is always the second bell of the sitting.
            <View key={index} className="mt-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-ink" style={TABULAR}>
                  {formatClock(live(`bell:${index}`, at))}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.meditation.removeBell}
                  hitSlop={8}
                  onPress={() => setBells(bells.filter((_, other) => other !== index))}
                  className="rounded-lg p-1.5 active:bg-raised"
                >
                  <Trash2 size={16} color={colors.inkMute} />
                </Pressable>
              </View>
              <Slider
                value={live(`bell:${index}`, at)}
                min={BELL_STEP}
                max={bellCeiling}
                step={BELL_STEP}
                marks={bells.filter((_, other) => other !== index)}
                onChange={drag(`bell:${index}`)}
                onCommit={(next) => commitBell(index, next)}
                accessibilityLabel={t.meditation.intervalBell}
              />
            </View>
          ))
        )}
      </Card>

      <Card className="gap-2.5">
        <Text className="text-sm font-medium text-ink-soft">{t.meditation.bellSound}</Text>
        <View className="flex-row gap-2">
          {BELL_PACK_IDS.map((id) => {
            const isSelected = id === bell;
            const isSounding = preview.playing === id;
            // Picking and hearing are one gesture: comparing two bells is the
            // only reason to be here, and a separate listen button would make
            // that two taps per comparison instead of one. The speaker says so
            // up front, and a second tap cuts a bell short rather than making
            // the user wait out thirteen seconds of decay.
            const iconColor = isSelected ? "#FFFFFF" : colors.tint;
            return (
              <Pressable
                key={id}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityHint={t.meditation.bellPreviewHint}
                onPress={() => {
                  setBell(id);
                  preview.toggle(id);
                }}
                className={cn(
                  "flex-row items-center gap-2 rounded-full border px-4 py-2",
                  isSelected ? "border-transparent bg-primary-500" : "border-line bg-card active:bg-raised"
                )}
              >
                {isSounding ? (
                  <Square size={13} color={iconColor} fill={iconColor} />
                ) : (
                  <Volume2 size={15} color={iconColor} />
                )}
                <Text className={cn("text-sm font-medium", isSelected ? "text-white" : "text-ink-soft")}>
                  {id === "bowl" ? t.meditation.bellBowl : t.meditation.bellGong}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Button
        size="lg"
        onPress={() => {
          // The session opens on its own start bell; a preview still decaying
          // underneath would land on top of it.
          preview.stop();
          onStart();
        }}
      >
        {t.meditation.start}
      </Button>
    </ScrollView>
  );
}
