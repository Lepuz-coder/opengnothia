import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { FileText, Sparkles, Trash2 } from "lucide-react-native";
import { getDateLocale, useTranslation } from "@opengnothia/shared/i18n";
import { SESSION_SUMMARY_SYSTEM_PROMPT, buildSummaryPrompt } from "@opengnothia/shared/ai/promptBuilder";
import { createBufferedTextStream } from "@opengnothia/shared/lib/createBufferedTextStream";
import type { ChatMessage, Session } from "@opengnothia/shared/types";
import { streamChat } from "@/ai/client";
import { useAIErrorHandler } from "@/ai/useAIErrorHandler";
import { getQueries } from "@/db";
import { useProGate } from "@/hooks/useProGate";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, ConfirmSheet, LockBadge, ToastContainer } from "@/ui";
import { ChatMessages } from "@/features/session/ChatMessages";
import { Markdown } from "@/features/session/Markdown";

/**
 * Step 46: past-session detail — transcript, summary and delete. Reading is
 * free for everyone (M4); generating a missing summary is a new AI call, so
 * that one button carries the badge and the gate (M3).
 */
export default function PastSessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, language } = useTranslation();
  const locale = getDateLocale(language);
  const { colors } = useThemeColors();
  const { isPro, gate } = useProGate();
  // The summary generator streams inside a pageSheet — errors must not try to
  // push the paywall route under it.
  const handleAIError = useAIErrorHandler({ modalHosted: true });

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getQueries()
      .then((queries) => queries.getSessionById(id))
      .then((s) => {
        setSession(s);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(
    () => () => {
      cancelledRef.current = true;
    },
    []
  );

  // The generate button lives inside the summary pageSheet: a paywall route
  // pushed while the sheet is up would present BELOW it, so for free users the
  // sheet closes first and the gate fires after its dismissal.
  const handleGeneratePress = () => {
    if (isPro) {
      void handleGenerateSummary();
      return;
    }
    setSummaryOpen(false);
    setTimeout(() => gate(() => undefined), 400);
  };

  const handleDelete = async () => {
    if (!session) return;
    setDeleting(true);
    const queries = await getQueries();
    await queries.deleteSession(session.id);
    setDeleting(false);
    setDeleteConfirmOpen(false);
    router.back();
  };

  const handleGenerateSummary = useCallback(async () => {
    if (generating || !session) return;
    cancelledRef.current = false;
    setGenerating(true);
    setStreamContent("");

    try {
      const queries = await getQueries();
      const patientNotes = await queries.getPatientNotes();
      const summaryPrompt = buildSummaryPrompt(patientNotes, language);
      const conversationForSummary: ChatMessage[] = [
        ...session.messages,
        { id: "summary-request", role: "user", content: summaryPrompt, timestamp: new Date().toISOString() },
      ];

      let fullContent = "";
      const buffered = createBufferedTextStream((chunk) => {
        if (!cancelledRef.current) setStreamContent((prev) => prev + chunk);
      });

      await streamChat({
        messages: conversationForSummary,
        systemPrompt: SESSION_SUMMARY_SYSTEM_PROMPT,
        onContent: (chunk) => {
          fullContent += chunk;
          buffered.push(chunk);
        },
        onDone: () => buffered.flush(),
        onUsage: (usage) => {
          void queries.saveTokenUsage({
            session_id: session.id,
            provider: "openai",
            model: "proxy",
            input_tokens: usage.inputTokens,
            output_tokens: usage.outputTokens,
            cost: 0,
            call_type: "summary",
          });
        },
        onError: (error) => {
          buffered.cancel();
          if (!cancelledRef.current) handleAIError(error);
        },
      });

      if (fullContent.trim().length > 0) {
        await queries.updateSessionNarrative(session.id, fullContent);
        if (!cancelledRef.current) {
          setSession((prev) => (prev ? { ...prev, summary_narrative: fullContent } : prev));
        }
      }
    } catch (err) {
      if (!cancelledRef.current) handleAIError(err);
    } finally {
      if (!cancelledRef.current) setGenerating(false);
    }
  }, [generating, session, language, handleAIError]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-canvas px-6">
        <Text className="text-ink-mute">{t.session.sessionNotFound}</Text>
        <Button variant="ghost" onPress={() => router.back()}>
          {t.session.goBack}
        </Button>
      </View>
    );
  }

  const startDate = new Date(session.started_at);
  const endDate = session.ended_at ? new Date(session.ended_at) : null;
  const durationMin = endDate ? Math.round((endDate.getTime() - startDate.getTime()) / 60000) : null;
  const dateLabel = startDate.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  const timeLabel = startDate.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

  return (
    <View className="flex-1 bg-canvas">
      <Stack.Screen options={{ title: dateLabel }} />

      {/* Meta + actions */}
      <View className="flex-row items-center gap-3 border-b border-line bg-card px-4 py-2.5">
        <View className="flex-1">
          <Text className="text-xs text-ink-mute" style={{ fontVariant: ["tabular-nums"] }}>
            {timeLabel}
            {durationMin !== null ? ` · ${durationMin} ${t.common.minutesShort}` : ""}
          </Text>
        </View>
        <Button
          variant="ghost"
          size="sm"
          icon={<FileText size={15} color={colors.inkMute} />}
          onPress={() => setSummaryOpen(true)}
        >
          {t.session.sessionSummary}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Trash2 size={15} color="#EF4444" />}
          onPress={() => setDeleteConfirmOpen(true)}
        />
      </View>

      {/* Read-only transcript (M4: readable without a subscription) */}
      <ChatMessages messages={session.messages} />

      {/* Summary viewer / generator */}
      <Modal
        visible={summaryOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (!generating) setSummaryOpen(false);
        }}
      >
        <View className="flex-1 bg-canvas">
          <View className="flex-row items-center justify-between border-b border-line px-3 py-2.5">
            <Text className="ml-2 text-base font-semibold text-ink">{t.session.sessionSummary}</Text>
            <Button variant="ghost" size="sm" onPress={() => setSummaryOpen(false)} disabled={generating}>
              {t.common.close}
            </Button>
          </View>
          <ScrollView className="flex-1" contentContainerClassName="px-5 py-4">
            {session.summary_narrative ? (
              <Markdown>{session.summary_narrative}</Markdown>
            ) : generating ? (
              <>
                <View className="mb-3 flex-row items-center gap-2">
                  <ActivityIndicator size="small" color={colors.tint} />
                  <Text className="text-sm text-ink-mute">{t.session.preparingSummary}</Text>
                </View>
                {streamContent !== "" && <Markdown>{streamContent}</Markdown>}
              </>
            ) : (
              <View className="items-center gap-4 py-10">
                <Text className="text-center text-sm leading-relaxed text-ink-mute">
                  {t.session.summaryNotGeneratedYet}
                </Text>
                <View className="flex-row items-center gap-2.5">
                  <Button icon={<Sparkles size={16} color="#fff" />} onPress={handleGeneratePress}>
                    {t.session.generateSummary}
                  </Button>
                  <LockBadge />
                </View>
              </View>
            )}
          </ScrollView>
          {/* Root ToastContainer sits below this pageSheet; host one inside. */}
          <ToastContainer />
        </View>
      </Modal>

      <ConfirmSheet
        isOpen={deleteConfirmOpen}
        title={t.session.deleteSession}
        message={t.session.deleteSessionConfirm}
        confirmLabel={deleting ? t.session.deleting : t.common.delete}
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </View>
  );
}
