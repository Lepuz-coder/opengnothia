import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { MessageSquare, Mic } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { cn } from "@opengnothia/shared/lib/cn";
import type { SessionMode } from "@opengnothia/shared/types";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, Card, Sheet } from "@/ui";

interface StartSessionSheetProps {
  visible: boolean;
  initialMode: SessionMode;
  onClose: () => void;
  onStart: (mode: SessionMode) => void;
}

interface ModeCardProps {
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
}

function ModeCard({ selected, icon, title, description, onPress }: ModeCardProps) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress}>
      <Card className={cn(selected && "border-primary-500 bg-primary-500/10")}>
        <View className="flex-row items-start gap-3">
          <View
            className={cn(
              "h-10 w-10 items-center justify-center rounded-xl",
              selected ? "bg-primary-500/20" : "bg-raised",
            )}
          >
            {icon}
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-ink">{title}</Text>
            <Text className="mt-1 text-xs leading-relaxed text-ink-mute">{description}</Text>
          </View>
          {/* Desktop's radio dot, same 2px ring and filled centre. */}
          <View
            className={cn(
              "h-[18px] w-[18px] items-center justify-center rounded-full border-2",
              selected ? "border-primary-500" : "border-line",
            )}
          >
            {selected && <View className="h-2 w-2 rounded-full bg-primary-500" />}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

/**
 * Desktop's start-session modal (SessionPage.tsx:1000-1150), trimmed to the
 * one thing a phone start needs: the session mode. The therapy school is not
 * repeated here — it is already a badge in the session's own top bar, and it
 * is picked by the quiz rather than a manual list (M2).
 *
 * Desktop's API-key test chain has no counterpart either: mobile talks to the
 * Worker proxy, so there is no key to validate before starting.
 */
export function StartSessionSheet({ visible, initialMode, onClose, onStart }: StartSessionSheetProps) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const [mode, setMode] = useState<SessionMode>(initialMode);

  // Each opening starts from the remembered preference, not from whatever was
  // highlighted when the sheet was last dismissed.
  useEffect(() => {
    if (visible) setMode(initialMode);
  }, [visible, initialMode]);

  return (
    <Sheet isOpen={visible} onClose={onClose} title={t.session.startSessionModal}>
      <Text className="px-1 text-sm font-medium text-ink-soft">{t.voice.modeSelection}</Text>
      <Text className="mb-3 mt-1 px-1 text-xs leading-relaxed text-ink-mute">
        {t.voice.modeSelectionDescription}
      </Text>

      {/* Single column: desktop's 2-col grid cannot hold these descriptions at
          phone width — the BreathingSetup technique cards made the same call. */}
      <View className="gap-2.5">
        <ModeCard
          selected={mode === "chat"}
          icon={<MessageSquare size={20} color={mode === "chat" ? colors.tint : colors.inkMute} />}
          title={t.voice.chatConversation}
          description={t.voice.chatDescription}
          onPress={() => setMode("chat")}
        />
        <ModeCard
          selected={mode === "voice"}
          icon={<Mic size={20} color={mode === "voice" ? colors.tint : colors.inkMute} />}
          title={t.voice.voiceConversation}
          description={t.voice.voiceDescription}
          onPress={() => setMode("voice")}
        />
      </View>

      <Button size="lg" className="mt-5" onPress={() => onStart(mode)}>
        {t.session.startSession}
      </Button>
    </Sheet>
  );
}
