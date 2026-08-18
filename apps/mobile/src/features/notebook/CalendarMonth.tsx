import { Pressable, Text, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { cn } from "@opengnothia/shared/lib/cn";
import { useThemeColors } from "@/theme/useAppTheme";
import { formatMonthYear, formatYMD, getCalendarDays } from "@/lib/date";

interface CalendarMonthProps {
  year: number;
  month: number;
  dayNames: string[];
  locale: string;
  /** YMD strings that have an entry — rendered filled. */
  markedDates: ReadonlySet<string>;
  onDayPress: (dateStr: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
}

/**
 * Month grid shared by the Günlük and Rüyalar segments. Desktop's calendar
 * cells carry a three-line text preview; at ~50pt per cell that is illegible,
 * so a cell reduces to the day number — filled when the day has an entry —
 * and the preview lives in the detail view a tap away. Interaction contract
 * is desktop's: tap an empty day to write, a filled day to open, future and
 * out-of-month days disabled, forward navigation capped at the current month.
 */
export function CalendarMonth({
  year,
  month,
  dayNames,
  locale,
  markedDates,
  onDayPress,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
}: CalendarMonthProps) {
  const { colors } = useThemeColors();
  const now = new Date();
  const todayStr = formatYMD(now);
  const days = getCalendarDays(year, month);
  const isNextDisabled = year === now.getFullYear() && month >= now.getMonth();

  return (
    <View>
      {/* Month navigation */}
      <View className="mb-2 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          onPress={onPrevMonth}
          className="rounded-lg p-2 active:bg-raised"
        >
          <ChevronLeft size={20} color={colors.inkMute} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onGoToToday}>
          <Text className="text-sm font-semibold capitalize text-ink-soft">
            {formatMonthYear(year, month, locale)}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onNextMonth}
          disabled={isNextDisabled}
          className={cn("rounded-lg p-2 active:bg-raised", isNextDisabled && "opacity-30")}
        >
          <ChevronRight size={20} color={colors.inkMute} />
        </Pressable>
      </View>

      {/* Day headers */}
      <View className="flex-row">
        {dayNames.map((name) => (
          <View key={name} className="w-[14.2857%] items-center py-1.5">
            <Text className="text-xs font-medium text-ink-mute">{name}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View className="flex-row flex-wrap">
        {days.map((day) => {
          const dateStr = formatYMD(day);
          const isCurrentMonth = day.getMonth() === month;
          const isToday = dateStr === todayStr;
          const isFuture = dateStr > todayStr;
          const isMarked = markedDates.has(dateStr);
          const disabled = isFuture || !isCurrentMonth;

          return (
            <Pressable
              key={dateStr}
              accessibilityRole="button"
              accessibilityState={{ disabled }}
              disabled={disabled}
              onPress={() => onDayPress(dateStr)}
              className="w-[14.2857%] items-center py-1"
            >
              <View
                className={cn(
                  "h-11 w-11 items-center justify-center rounded-full",
                  isMarked && "bg-primary-100 dark:bg-primary-900/40",
                  isToday && "border-2 border-tint",
                  !isCurrentMonth && "opacity-0",
                  isFuture && isCurrentMonth && "opacity-30"
                )}
              >
                <Text
                  className={cn(
                    "text-base",
                    isMarked
                      ? "font-semibold text-primary-700 dark:text-primary-300"
                      : isToday
                        ? "font-semibold text-tint"
                        : "text-ink"
                  )}
                >
                  {day.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
