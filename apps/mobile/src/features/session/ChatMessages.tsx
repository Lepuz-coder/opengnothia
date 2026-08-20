import { memo, useCallback, useRef, useState } from "react";
import { ScrollView, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { getDateLocale, useTranslation } from "@opengnothia/shared/i18n";
import type { ChatMessage } from "@opengnothia/shared/types";
import { Markdown } from "./Markdown";

const NEAR_BOTTOM_PX = 80;

function TypingDots() {
  return (
    <View className="flex-row gap-1.5 py-2">
      <View className="h-2 w-2 rounded-full bg-primary-400" />
      <View className="h-2 w-2 rounded-full bg-primary-400 opacity-70" />
      <View className="h-2 w-2 rounded-full bg-primary-400 opacity-40" />
    </View>
  );
}

// Memoized so the 48ms streaming flushes re-render only the growing message —
// settled messages keep their object identity and skip the markdown re-parse.
const MessageBubble = memo(function MessageBubble({ message, locale }: { message: ChatMessage; locale: string }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <View className="w-full items-end">
        <View className="max-w-[80%] rounded-2xl rounded-br-md border border-primary-500/20 bg-primary-500/10 px-4 py-3">
          <Text className="text-base leading-relaxed text-ink">{message.content}</Text>
        </View>
        <Text className="mt-1 text-[10px] text-ink-mute">
          {new Date(message.timestamp).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    );
  }

  return (
    <View className="w-full">
      {/* Desktop's mini-orb identity marker, flattened to a tinted dot. */}
      <View className="mb-1.5 h-3 w-3 rounded-full bg-primary-500/60" />
      {message.isStreaming && !message.content ? (
        <TypingDots />
      ) : message.isStreaming ? (
        // Plain text while streaming (session replies are prose by prompt
        // design); the markdown pass runs once the message settles.
        <Text className="text-base leading-relaxed text-ink">{message.content}</Text>
      ) : (
        <>
          <Markdown>{message.content}</Markdown>
          <Text className="text-[10px] text-ink-mute">
            {new Date(message.timestamp).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </>
      )}
    </View>
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
    >
      {messages.length === 0 && (
        <View className="flex-1 items-center justify-center py-24">
          <View className="mb-3 h-12 w-12 rounded-full bg-primary-500/30" />
          <Text className="text-sm text-ink-mute">{t.chat.preparing}</Text>
        </View>
      )}
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} locale={locale} />
      ))}
    </ScrollView>
  );
}
