import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { getDateLocale, useTranslation } from "@opengnothia/shared/i18n";
import type { ChatMessage } from "@opengnothia/shared/types";
import { GLASS, USER_BUBBLE_GRADIENT } from "@/theme/sessionAmbience";
import { useThemeColors } from "@/theme/useAppTheme";
import { MiniOrb } from "@/ui";
import { Markdown, PROSE_PARAGRAPH_GAP, PROSE_TEXT } from "./Markdown";

const NEAR_BOTTOM_PX = 80;

/** Desktop's `msg-enter`: 0.35s ease-out, opacity 0→1 over an 8px rise. */
const MESSAGE_ENTRANCE = FadeInDown.duration(350)
  .easing(Easing.out(Easing.ease))
  .withInitialValues({ transform: [{ translateY: 8 }] })
  .reduceMotion(ReduceMotion.System);

/** One of desktop's three bouncing gradient dots (ChatContainer.tsx:138-142). */
function TypingDot({ delay, glow }: { delay: number; glow: string }) {
  const bounce = useSharedValue(0);

  useEffect(() => {
    bounce.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
        undefined,
        ReduceMotion.System,
      ),
    );
  }, [bounce, delay]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -4 * bounce.value }] }));

  return (
    <Animated.View style={[{ height: 8, width: 8, borderRadius: 4, boxShadow: glow }, animatedStyle]}>
      <Svg width={8} height={8} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="typingDotTeal" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#4BC3BE" />
            <Stop offset="1" stopColor="#2D8F8B" />
          </LinearGradient>
        </Defs>
        <Rect width="100" height="100" rx="50" fill="url(#typingDotTeal)" />
      </Svg>
    </Animated.View>
  );
}

/**
 * The streaming half of the AI message. It must land pixel-identical to the
 * markdown pass that replaces it once the message settles, so it borrows the
 * renderer's metrics and mirrors its paragraph spacing — splitting on blank
 * lines is far cheaper than a markdown parse on every 48ms flush.
 */
function StreamingProse({ content }: { content: string }) {
  const paragraphs = content.split(/\n{2,}/);

  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <Text
          key={index}
          className="text-ink"
          style={[PROSE_TEXT, index < paragraphs.length - 1 ? { marginBottom: PROSE_PARAGRAPH_GAP } : null]}
        >
          {paragraph}
        </Text>
      ))}
    </>
  );
}

function TypingDots({ glow }: { glow: string }) {
  return (
    <View className="flex-row gap-1.5 py-2">
      <TypingDot delay={0} glow={glow} />
      <TypingDot delay={150} glow={glow} />
      <TypingDot delay={300} glow={glow} />
    </View>
  );
}

// Memoized so the 48ms streaming flushes re-render only the growing message —
// settled messages keep their object identity and skip the markdown re-parse.
const MessageBubble = memo(function MessageBubble({
  message,
  locale,
  animate,
}: {
  message: ChatMessage;
  locale: string;
  animate: boolean;
}) {
  const { resolved } = useThemeColors();
  const isUser = message.role === "user";
  const glass = GLASS[resolved];
  const entering = animate ? MESSAGE_ENTRANCE : undefined;

  if (isUser) {
    const fill = USER_BUBBLE_GRADIENT[resolved];
    return (
      <Animated.View className="w-full items-end" entering={entering}>
        {/* boxShadow lives on the outer view: `overflow: hidden` sets
            masksToBounds on iOS, which would clip the shadow away. Same split
            as LockBadge. */}
        <View
          className="max-w-[80%] rounded-2xl rounded-br-md"
          style={{ boxShadow: glass.bubbleShadow }}
        >
          <View className="overflow-hidden rounded-2xl rounded-br-md border border-primary-500/20 px-4 py-3">
            {/* Desktop's `bg-gradient-to-br from-primary-500/[0.13] to-surface-800/90`. */}
            <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id={`userBubble-${resolved}`} x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={fill.from} stopOpacity={fill.fromOpacity} />
                  <Stop offset="1" stopColor={fill.to} stopOpacity={fill.toOpacity} />
                </LinearGradient>
              </Defs>
              <Rect width="100" height="100" fill={`url(#userBubble-${resolved})`} />
            </Svg>
            <Text className="text-ink" style={PROSE_TEXT}>
              {message.content}
            </Text>
          </View>
        </View>
        <Text className="mt-1 text-[10px] text-ink-mute">
          {new Date(message.timestamp).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      className="w-full"
      entering={entering}
      // Desktop's min-h-[3.5rem] while streaming, so the reply doesn't jump.
      style={message.isStreaming ? { minHeight: 56 } : undefined}
    >
      <View className="mb-1.5">
        <MiniOrb size={16} />
      </View>
      {message.isStreaming && !message.content ? (
        <TypingDots glow={glass.dotGlow} />
      ) : message.isStreaming ? (
        // Plain text while streaming; the markdown pass runs once the message
        // settles, and StreamingProse matches it so the swap is invisible.
        <StreamingProse content={message.content} />
      ) : (
        <>
          <Markdown>{message.content}</Markdown>
          <Text className="text-[10px] text-ink-mute">
            {new Date(message.timestamp).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </>
      )}
    </Animated.View>
  );
});

/**
 * Step 40's message list. Desktop anchors the last user message to the top;
 * the phone-native reading pattern is simpler — follow the bottom while the
 * user is there, stop following the moment they scroll up.
 */
export function ChatMessages({ messages }: { messages: ChatMessage[] }) {
  const { t, language } = useTranslation();
  const locale = getDateLocale(language);
  const scrollRef = useRef<ScrollView>(null);
  const [followBottom, setFollowBottom] = useState(true);

  // Only messages that arrive after mount animate in. Without this the
  // read-only transcript (app/session/[id].tsx) would fade its whole history
  // in at once on open.
  const presentAtMountRef = useRef<Set<string> | null>(null);
  if (presentAtMountRef.current === null) {
    presentAtMountRef.current = new Set(messages.map((m) => m.id));
  }

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    setFollowBottom(distanceFromBottom < NEAR_BOTTOM_PX);
  }, []);

  const handleContentSizeChange = useCallback(() => {
    if (followBottom) {
      scrollRef.current?.scrollToEnd({ animated: false });
    }
  }, [followBottom]);

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1"
      contentContainerClassName="gap-5 px-4 py-4"
      onScroll={handleScroll}
      scrollEventThrottle={64}
      onContentSizeChange={handleContentSizeChange}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
    >
      {messages.length === 0 && (
        <View className="flex-1 items-center justify-center py-24">
          <View className="mb-3">
            <MiniOrb size={48} />
          </View>
          <Text className="text-sm text-ink-mute">{t.chat.preparing}</Text>
        </View>
      )}
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          locale={locale}
          animate={!presentAtMountRef.current?.has(msg.id)}
        />
      ))}
    </ScrollView>
  );
}
