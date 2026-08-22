import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { ChevronRight, Lightbulb, Pencil, Sparkles, Trash2 } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import type { Insight, InsightGroup } from "@opengnothia/shared/types";
import { getQueries } from "@/db";
import { useSessionStore } from "@/stores/useSessionStore";
import { showToast } from "@/stores/useToastStore";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, Card } from "@/ui";
import { EntryComposer } from "@/features/notebook/EntryComposer";
import { Markdown } from "./Markdown";
import { generateSummary, saveAndCloseSession } from "./sessionActions";

interface SessionEndScreenProps {
  onAIError: (error: unknown) => void;
}

/**
 * Step 44's ending flow, desktop's SessionEndSummary reinterpreted: summary is
 * generated on demand (same manual trigger as desktop) and the insights captured
 * during the session are editable here (the desktop side panel's edit/delete,
 * relocated).
 */
export function SessionEndScreen({ onAIError }: SessionEndScreenProps) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const summaryNarrative = useSessionStore((s) => s.summaryNarrative);
  const isSummaryStreaming = useSessionStore((s) => s.isSummaryStreaming);
  const sessionInsightIds = useSessionStore((s) => s.sessionInsightIds);
  const removeSessionInsightId = useSessionStore((s) => s.removeSessionInsightId);

  const [saving, setSaving] = useState(false);
  const [editingSaving, setEditingSaving] = useState(false);
  const [deletingInsightId, setDeletingInsightId] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [groups, setGroups] = useState<InsightGroup[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsLoadError, setInsightsLoadError] = useState(false);
  const [editingInsight, setEditingInsight] = useState<Insight | null>(null);

  const loadInsights = useCallback(async () => {
    if (sessionInsightIds.length === 0) {
      setInsights([]);
      setGroups([]);
      setInsightsLoadError(false);
      setInsightsLoading(false);
      return;
    }
    setInsightsLoading(true);
    setInsightsLoadError(false);
    try {
      const queries = await getQueries();
      const [list, groupList] = await Promise.all([
        queries.getInsightsByIds(sessionInsightIds),
        queries.getInsightGroups(),
      ]);
      const order = new Map(sessionInsightIds.map((id, idx) => [id, idx]));
      list.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      setInsights(list);
      setGroups(groupList);
    } catch (err) {
      console.error("Failed to load session insights:", err);
      setInsightsLoadError(true);
    } finally {
      setInsightsLoading(false);
    }
  }, [sessionInsightIds]);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  const handleDeleteInsight = async (id: string) => {
    if (deletingInsightId !== null) return;
    setDeletingInsightId(id);
    try {
      const queries = await getQueries();
      await queries.deleteInsight(id);
      removeSessionInsightId(id);
      setInsights((current) => current.filter((insight) => insight.id !== id));
    } catch {
      showToast(t.errors.generic, "error");
    } finally {
      setDeletingInsightId(null);
    }
  };

  const handleSaveEdit = async (content: string) => {
    if (!editingInsight || editingSaving) return;
    const target = editingInsight;
    setEditingSaving(true);
    try {
      const queries = await getQueries();
      await queries.updateInsightContent(target.id, content);
      setInsights((current) => current.map((insight) => (
        insight.id === target.id ? { ...insight, content } : insight
      )));
      setEditingInsight(null);
    } catch {
      showToast(t.errors.generic, "error");
    } finally {
      setEditingSaving(false);
    }
  };

  const handleSaveAndClose = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveAndCloseSession();
    } catch {
      showToast(t.errors.generic, "error");
    } finally {
      setSaving(false);
    }
  };

  const groupedInsights = (() => {
    const byGroup = new Map<string, { group: InsightGroup | null; items: Insight[] }>();
    for (const insight of insights) {
      const existing = byGroup.get(insight.group_id);
      if (existing) existing.items.push(insight);
      else byGroup.set(insight.group_id, { group: groups.find((g) => g.id === insight.group_id) ?? null, items: [insight] });
    }
    return Array.from(byGroup.values());
  })();

  const saveDisabled = saving || isSummaryStreaming;

  return (
    <>
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 py-6">
        <View className="items-center">
          <Text className="text-2xl font-bold text-ink">{t.session.sessionCompleted}</Text>
        </View>

        {/* Summary */}
        <Card>
          <View className="mb-3 flex-row items-center gap-2">
            <Text className="text-base font-semibold text-ink">{t.session.sessionSummary}</Text>
            {isSummaryStreaming && <ActivityIndicator size="small" color={colors.tint} />}
          </View>
          {summaryNarrative !== "" ? (
            <Markdown>{summaryNarrative}</Markdown>
          ) : isSummaryStreaming ? (
            <View className="gap-2.5">
              <View className="h-3 w-full rounded bg-raised" />
              <View className="h-3 w-5/6 rounded bg-raised" />
              <View className="h-3 w-4/6 rounded bg-raised" />
            </View>
          ) : (
            <Button
              variant="secondary"
              icon={<Sparkles size={16} color={colors.ink} />}
              onPress={() => generateSummary(onAIError)}
              className="self-center"
            >
              {t.session.generateSummary}
            </Button>
          )}
        </Card>

        {/* Insights captured during the session */}
        {sessionInsightIds.length > 0 && (insightsLoading || insightsLoadError) && (
          <Card>
            <View accessibilityRole={insightsLoadError ? "alert" : undefined} className="items-center gap-3 py-4">
              {insightsLoading ? (
                <ActivityIndicator color={colors.tint} />
              ) : (
                <>
                  <Text className="text-center text-sm text-ink-soft">{t.errors.generic}</Text>
                  <Button variant="secondary" size="sm" onPress={() => void loadInsights()}>
                    {t.errors.retryButton}
                  </Button>
                </>
              )}
            </View>
          </Card>
        )}

        {!insightsLoading && !insightsLoadError && insights.length > 0 && (
          <Card>
            <View className="mb-3 flex-row items-center gap-2">
              <Lightbulb size={16} color={colors.tint} />
              <Text className="text-base font-semibold text-ink">{t.session.yourSessionInsights}</Text>
              <Text className="text-xs text-ink-mute" style={{ fontVariant: ["tabular-nums"] }}>
                · {insights.length}
              </Text>
            </View>
            <View className="gap-4">
              {groupedInsights.map(({ group, items }) => (
                <View key={group?.id ?? "unknown"} className="gap-2">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base">{group?.emoji ?? "💡"}</Text>
                    <Text className="text-sm font-medium text-ink">{group?.name ?? "—"}</Text>
                  </View>
                  {items.map((insight) => (
                    <View key={insight.id} className="flex-row items-start gap-2 pl-7">
                      <Text className="flex-1 text-sm leading-relaxed text-ink-soft">{insight.content}</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t.common.edit}
                        onPress={() => setEditingInsight(insight)}
                        className="rounded-lg p-1 active:bg-raised"
                      >
                        <Pencil size={14} color={colors.inkMute} />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t.common.delete}
                        onPress={() => handleDeleteInsight(insight.id)}
                        disabled={deletingInsightId !== null}
                        className="rounded-lg p-1 active:bg-raised"
                      >
                        {deletingInsightId === insight.id ? (
                          <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                          <Trash2 size={14} color="#EF4444" />
                        )}
                      </Pressable>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </Card>
        )}

        <Button size="lg" onPress={handleSaveAndClose} disabled={saveDisabled} loading={saving}>
          {isSummaryStreaming ? t.session.preparingSummary : t.session.saveAndClose}
        </Button>
      </ScrollView>

      <EntryComposer
        visible={editingInsight !== null}
        label={editingInsight ? (groups.find((g) => g.id === editingInsight.group_id)?.name ?? t.insights.insightLabel) : ""}
        placeholder={t.insights.notePlaceholder}
        initialContent={editingInsight?.content ?? ""}
        saving={editingSaving}
        onClose={() => {
          if (!editingSaving) setEditingInsight(null);
        }}
        onSave={handleSaveEdit}
      />
    </>
  );
}
