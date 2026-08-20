import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { Angry, Frown, Laugh, Meh, Smile, type LucideIcon } from "lucide-react-native";
import { useTranslation, type Translations } from "@opengnothia/shared/i18n";
import { useThemeColors } from "@/theme/useAppTheme";
import { Sheet } from "@/ui";

/** Desktop MoodPickerScale's five bands — icons and colours per 1–10 value. */
function moodIconFor(mood: number): LucideIcon {
  if (mood <= 2) return Angry;
  if (mood <= 4) return Frown;
  if (mood <= 6) return Meh;
  if (mood <= 8) return Smile;
  return Laugh;
}

// Desktop is dark-only (red-400/amber-400/primary-300…); the light halves are
// the same hues a contrast step deeper.
function moodColorFor(mood: number, resolved: "light" | "dark", inkMute: string): string {
  if (mood <= 2) return resolved === "light" ? "#DC2626" : "#F87171";
  if (mood <= 4) return resolved === "light" ? "#D97706" : "#FBBF24";
  if (mood <= 6) return inkMute;
  if (mood <= 8) return resolved === "light" ? "#3ABAB4" : "#78D2CE";
  return resolved === "light" ? "#2D8F8B" : "#4BC3BE";
}

export function MoodIcon({ mood, size }: { mood: number; size: number }) {
  const { resolved, colors } = useThemeColors();
  const Icon = moodIconFor(mood);
  return <Icon size={size} color={moodColorFor(mood, resolved, colors.inkMute)} strokeWidth={2} />;
}

export function getMoodBandLabel(mood: number, t: Translations): string {
  if (mood <= 2) return t.dashboard.moodBandBad;
  if (mood <= 4) return t.dashboard.moodBandOkay;
  if (mood <= 6) return t.dashboard.moodBandNeutral;
  if (mood <= 8) return t.dashboard.moodBandGood;
  return t.dashboard.moodBandGreat;
}

interface MoodPickerSheetProps {
  isOpen: boolean;
  initialMood: number | null;
  onSelect: (mood: number) => void;
  onClose: () => void;
  /** Sheet title; defaults to the dashboard's daily mood question. */
  title?: string;
}

const DOT_HIT = 40;
const TRACK_INSET = DOT_HIT / 2;

/**
 * The 1–10 scale from desktop's MoodPickerScale, moved into a bottom sheet
 * (Step 23). Hover preview has no touch equivalent, so the floating icon
 * follows the selection only; a tap selects, saves and closes shortly after —
 * long enough for the thumb to register visually.
 */
export function MoodPickerSheet({ isOpen, initialMood, onSelect, onClose, title }: MoodPickerSheetProps) {
  const { t } = useTranslation();
  const { resolved, colors } = useThemeColors();
  const [selected, setSelected] = useState<number | null>(initialMood);
  const [trackWidth, setTrackWidth] = useState(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) setSelected(initialMood);
  }, [isOpen, initialMood]);
  useEffect(
    () => () => {
      if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    },
    []
  );

  const fractionFor = (mood: number) => (mood - 1) / 9;

  const handlePick = (mood: number) => {
    setSelected(mood);
    onSelect(mood);
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(onClose, 450);
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={title ?? t.dashboard.moodQuestion}>
      <View className="pb-2">
        <View className="h-16">
          {selected !== null && trackWidth > 0 && (
            <View
              className="absolute items-center"
              style={{ left: TRACK_INSET + fractionFor(selected) * trackWidth - 28, width: 56 }}
            >
              <MoodIcon mood={selected} size={30} />
              <Text className="mt-0.5 text-xs font-semibold text-ink" style={{ fontVariant: ["tabular-nums"] }}>
                {selected}/10
              </Text>
            </View>
          )}
        </View>

        <View className="h-10 justify-center">
          <View
            className="mx-5 h-2 overflow-hidden rounded-full bg-raised"
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          >
            {selected !== null && trackWidth > 0 && (
              <View
                className="h-full overflow-hidden rounded-full"
                style={{ width: Math.max(fractionFor(selected) * trackWidth, 8) }}
              >
                {/* Desktop's from-red-400 via-amber-400 to-primary-400 fill; the Svg
                    spans the full track so the gradient stays put as the fill grows. */}
                <Svg width={trackWidth} height={8}>
                  <Defs>
                    <LinearGradient id="moodTrackGradient" x1="0" y1="0" x2="1" y2="0">
                      <Stop offset="0" stopColor="#F87171" />
                      <Stop offset="0.5" stopColor="#FBBF24" />
                      <Stop offset="1" stopColor="#4BC3BE" />
                    </LinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width={trackWidth} height={8} fill="url(#moodTrackGradient)" />
                </Svg>
              </View>
            )}
          </View>

          {trackWidth > 0 &&
            Array.from({ length: 10 }, (_, i) => i + 1).map((mood) => {
              const isSelected = selected === mood;
              return (
                <Pressable
                  key={mood}
                  accessibilityRole="button"
                  accessibilityLabel={`${mood}/10`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => handlePick(mood)}
                  className="absolute top-0 items-center justify-center"
                  style={{ left: fractionFor(mood) * trackWidth, width: DOT_HIT, height: DOT_HIT }}
                >
                  {isSelected ? (
                    <View
                      className="h-5 w-5 rounded-full"
                      style={{
                        backgroundColor: colors.canvas,
                        borderWidth: 3,
                        borderColor: moodColorFor(mood, resolved, colors.inkMute),
                      }}
                    />
                  ) : (
                    <View className="h-1.5 w-1.5 rounded-full bg-ink-mute/60" />
                  )}
                </Pressable>
              );
            })}
        </View>

        <View className="mt-1 flex-row justify-between px-5">
          <Text className="text-xs text-ink-mute">{t.dashboard.moodBandBad}</Text>
          <Text className="text-xs text-ink-mute">{t.dashboard.moodBandGreat}</Text>
        </View>
      </View>
    </Sheet>
  );
}
