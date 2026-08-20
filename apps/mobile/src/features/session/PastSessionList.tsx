import { Pressable, Text, View } from "react-native";
import { ChevronRight, Clock, FileText, MessageCircle } from "lucide-react-native";
import { getDateLocale, useTranslation } from "@opengnothia/shared/i18n";
import type { Session } from "@opengnothia/shared/types";
import { cn } from "@opengnothia/shared/lib/cn";
import { useThemeColors } from "@/theme/useAppTheme";
import { Card } from "@/ui";

export type PastSessionRow = Omit<Session, "messages">;

interface PastSessionListProps {
  sessions: PastSessionRow[];
  onPress: (session: PastSessionRow) => void;
}

/**
 * Step 46: desktop lays past sessions on a 7-column week grid — unreadable at
 * phone width, so the mobile interpretation is a plain reverse-chronological
 * list. Reading history needs no subscription (M4). The weekly-summary
 * surface stays desktop-only (not in the M9 parity list).
 */
export function PastSessionList({ sessions, onPress }: PastSessionListProps) {
  const { t, language } = useTranslation();
  const locale = getDateLocale(language);
  const { colors } = useThemeColors();

  if (sessions.length === 0) {
    return (
      <View className="items-center px-6 py-14">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-raised">
          <MessageCircle size={30} color={colors.inkMute} />
        </View>
        <Text className="mb-1 text-base font-semibold text-ink">{t.session.noSessionsYet}</Text>
        <Text className="text-center text-sm text-ink-mute">{t.session.noSessionsDescription}</Text>
      </View>
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      {sessions.map((session, index) => {
        const startDate = new Date(session.started_at);
        const endDate = session.ended_at ? new Date(session.ended_at) : null;
        const durationMin = endDate ? Math.round((endDate.getTime() - startDate.getTime()) / 60000) : null;
        const dateLabel = startDate.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
        const timeLabel = startDate.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

        return (
          <Pressable
            key={session.id}
            accessibilityRole="button"
            onPress={() => onPress(session)}
            className={cn("flex-row items-center gap-3 px-4 py-3.5 active:bg-raised", index > 0 && "border-t border-line")}
          >
            <View className="flex-1">
              <Text className="text-base font-medium text-ink">{dateLabel}</Text>
              <View className="mt-0.5 flex-row items-center gap-2.5">
                <Text className="text-xs text-ink-mute" style={{ fontVariant: ["tabular-nums"] }}>
                  {timeLabel}
                </Text>
                {durationMin !== null && (
                  <View className="flex-row items-center gap-1">
                    <Clock size={11} color={colors.inkMute} />
                    <Text className="text-xs text-ink-mute" style={{ fontVariant: ["tabular-nums"] }}>
                      {durationMin} {t.common.minutesShort}
                    </Text>
                  </View>
                )}
                {session.summary_narrative !== null && session.summary_narrative !== "" && (
                  <FileText size={11} color={colors.inkMute} />
                )}
              </View>
            </View>
            <ChevronRight size={18} color={colors.inkMute} />
          </Pressable>
        );
      })}
    </Card>
  );
}
