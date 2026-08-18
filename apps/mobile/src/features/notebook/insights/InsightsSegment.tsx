import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { ArrowLeft, Lightbulb, Pencil, Pin, PinOff, Plus, Search, Trash2 } from "lucide-react-native";
import { getDateLocale, useTranslation } from "@opengnothia/shared/i18n";
import { cn } from "@opengnothia/shared/lib/cn";
import type { Insight, InsightGroup } from "@opengnothia/shared/types";
import { getQueries } from "@/db";
import { formatRelativeTime, formatTimestamp } from "@/lib/date";
import { useThemeColors } from "@/theme/useAppTheme";
import { Badge, Button, Card, ConfirmSheet, Input } from "@/ui";
import { EntryComposer } from "../EntryComposer";
import { EditGroupModal, NewInsightModal } from "./GroupFormModals";

type SegmentView = "groups" | "detail";

/** Which flow the single NoteSheet instance is currently serving. */
type NoteTarget =
  | { kind: "quick"; groupId: string }
  | { kind: "new" }
  | { kind: "edit"; insight: Insight };

type DeleteTarget = { kind: "insight"; id: string } | { kind: "group" };

const PIN_COLOR = "#F59E0B"; // desktop's amber-400/500 pin accent

/**
 * Desktop's InsightsPage on RN: group list (search, quick add) → group detail
 * (notes with pin/edit/delete). Entirely free, no AI anywhere (M3) — session
 * insight capture arrives separately in Faz 5.
 */
export function InsightsSegment() {
  const { t, language } = useTranslation();
  const locale = getDateLocale(language);
  const { colors } = useThemeColors();

  const [view, setView] = useState<SegmentView>("groups");
  const [groups, setGroups] = useState<InsightGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<InsightGroup | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [newInsightOpen, setNewInsightOpen] = useState(false);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [noteTarget, setNoteTarget] = useState<NoteTarget | null>(null);
  const [noteSaving, setNoteSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const loadGroups = useCallback(async () => {
    const queries = await getQueries();
    setGroups(await queries.getInsightGroups());
    setLoading(false);
  }, []);

  const loadInsights = useCallback(async (groupId: string) => {
    const queries = await getQueries();
    setInsights(await queries.getInsightsByGroupId(groupId));
  }, []);

  /** Reload groups and re-point selectedGroup at its fresh row (counts change). */
  const refreshGroups = useCallback(
    async (selectedId?: string) => {
      const queries = await getQueries();
      const data = await queries.getInsightGroups();
      setGroups(data);
      if (selectedId) {
        const updated = data.find((g) => g.id === selectedId);
        if (updated) setSelectedGroup(updated);
      }
    },
    []
  );

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return groups.filter(
      (g) => g.name.toLowerCase().includes(q) || (g.description && g.description.toLowerCase().includes(q))
    );
  }, [groups, searchQuery]);

  const totalInsights = useMemo(() => groups.reduce((sum, g) => sum + g.insight_count, 0), [groups]);

  const openGroup = async (group: InsightGroup) => {
    setSelectedGroup(group);
    await loadInsights(group.id);
    setView("detail");
  };

  const backToGroups = () => {
    setView("groups");
    setSelectedGroup(null);
    setInsights([]);
    loadGroups();
  };

  // ── Note composer: one instance serves quick add, new note and edit.
  // Same fullscreen page sheet as journal/dream writing — the bottom-sheet
  // editor this started with left too little room to write (user feedback).
  const noteComposerLabel =
    noteTarget?.kind === "edit" ? t.common.edit : noteTarget?.kind === "quick" ? t.insights.quickAdd : t.insights.newNote;

  const handleNoteSave = async (content: string) => {
    if (!noteTarget || !content) return;
    setNoteSaving(true);
    try {
      const queries = await getQueries();
      if (noteTarget.kind === "quick") {
        await queries.createInsight({ group_id: noteTarget.groupId, content });
        await refreshGroups();
      } else if (noteTarget.kind === "new") {
        if (!selectedGroup) return;
        await queries.createInsight({ group_id: selectedGroup.id, content });
        await loadInsights(selectedGroup.id);
        await refreshGroups(selectedGroup.id);
      } else {
        await queries.updateInsightContent(noteTarget.insight.id, content);
        if (selectedGroup) await loadInsights(selectedGroup.id);
      }
      setNoteTarget(null);
    } finally {
      setNoteSaving(false);
    }
  };

  const handleTogglePin = async (insight: Insight) => {
    const queries = await getQueries();
    await queries.toggleInsightPin(insight.id, !insight.is_pinned);
    if (selectedGroup) await loadInsights(selectedGroup.id);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const queries = await getQueries();
    if (deleteTarget.kind === "insight") {
      await queries.deleteInsight(deleteTarget.id);
      setDeleteTarget(null);
      if (selectedGroup) {
        await loadInsights(selectedGroup.id);
        await refreshGroups(selectedGroup.id);
      }
    } else {
      if (!selectedGroup) return;
      await queries.deleteInsightGroup(selectedGroup.id);
      setDeleteTarget(null);
      backToGroups();
    }
  };

  const handleInsightSaved = async (groupId: string) => {
    if (view === "detail" && selectedGroup) {
      await refreshGroups(selectedGroup.id);
      if (selectedGroup.id === groupId) await loadInsights(groupId);
    } else {
      await refreshGroups();
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  // ─── Group detail ───
  if (view === "detail" && selectedGroup) {
    return (
      <>
        <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 py-4">
          <Pressable
            accessibilityRole="button"
            onPress={backToGroups}
            className="flex-row items-center gap-1.5 self-start rounded-lg py-1 pr-2 active:opacity-60"
          >
            <ArrowLeft size={16} color={colors.inkMute} />
            <Text className="text-sm text-ink-mute">{t.common.back}</Text>
          </Pressable>

          {/* Group header — desktop uses a colour gradient; a flat tint of the
              group colour reads the same and needs no gradient dependency. */}
          <View
            className="rounded-2xl border border-line p-5"
            style={{ backgroundColor: selectedGroup.color + "1F" }}
          >
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 flex-row items-center gap-3">
                <Text className="text-3xl">{selectedGroup.emoji}</Text>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-ink">{selectedGroup.name}</Text>
                  {selectedGroup.description ? (
                    <Text className="mt-0.5 text-sm text-ink-soft">{selectedGroup.description}</Text>
                  ) : null}
                </View>
              </View>
              <View className="flex-row items-center gap-1">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.insights.editGroup}
                  onPress={() => setEditGroupOpen(true)}
                  className="rounded-lg p-2 active:bg-raised"
                >
                  <Pencil size={16} color={colors.inkMute} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.insights.deleteGroup}
                  onPress={() => setDeleteTarget({ kind: "group" })}
                  className="rounded-lg p-2 active:bg-raised"
                >
                  <Trash2 size={16} color="#F87171" />
                </Pressable>
              </View>
            </View>
            <View className="mt-3">
              <Badge label={`${selectedGroup.insight_count} ${t.common.note}`} />
            </View>
          </View>

          <Button icon={<Plus size={16} color="#fff" />} onPress={() => setNoteTarget({ kind: "new" })}>
            {t.insights.newNote}
          </Button>

          {insights.length === 0 ? (
            <Card className="items-center py-10">
              <Lightbulb size={36} color={colors.inkMute} />
              <Text className="mt-3 text-ink-mute">{t.insights.noNotesInGroup}</Text>
              <Text className="mt-1 text-xs text-ink-mute">{t.insights.addFirstNote}</Text>
            </Card>
          ) : (
            insights.map((insight) => (
              <Card key={insight.id} className={cn(insight.is_pinned && "border-l-4 border-l-amber-500")}>
                {insight.is_pinned && (
                  <View className="mb-2 flex-row items-center gap-1">
                    <Pin size={12} color={PIN_COLOR} />
                    <Text className="text-xs font-medium text-amber-500">{t.insights.pinned}</Text>
                  </View>
                )}
                <Text className="text-base leading-relaxed text-ink">{insight.content}</Text>
                <View className="mt-3 flex-row items-center justify-between border-t border-line pt-3">
                  <Text className="text-xs text-ink-mute">{formatTimestamp(insight.created_at, locale)}</Text>
                  <View className="flex-row items-center gap-1">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={insight.is_pinned ? t.insights.unpin : t.insights.pin}
                      onPress={() => handleTogglePin(insight)}
                      className="rounded-lg p-2 active:bg-raised"
                    >
                      {insight.is_pinned ? (
                        <PinOff size={15} color={colors.inkMute} />
                      ) : (
                        <Pin size={15} color={colors.inkMute} />
                      )}
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t.common.edit}
                      onPress={() => setNoteTarget({ kind: "edit", insight })}
                      className="rounded-lg p-2 active:bg-raised"
                    >
                      <Pencil size={15} color={colors.inkMute} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t.insights.deleteNote}
                      onPress={() => setDeleteTarget({ kind: "insight", id: insight.id })}
                      className="rounded-lg p-2 active:bg-raised"
                    >
                      <Trash2 size={15} color="#F87171" />
                    </Pressable>
                  </View>
                </View>
              </Card>
            ))
          )}
        </ScrollView>

        <EntryComposer
          visible={noteTarget !== null}
          label={noteComposerLabel}
          placeholder={t.insights.notePlaceholder}
          initialContent={noteTarget?.kind === "edit" ? noteTarget.insight.content : ""}
          saving={noteSaving}
          onSave={handleNoteSave}
          onClose={() => setNoteTarget(null)}
        />

        <ConfirmSheet
          isOpen={deleteTarget !== null}
          title={deleteTarget?.kind === "group" ? t.insights.deleteGroup : t.insights.deleteNote}
          message={
            deleteTarget?.kind === "group"
              ? `"${selectedGroup.name}" ${t.insights.deleteGroupConfirm}`
              : t.insights.deleteNoteConfirm
          }
          confirmLabel={deleteTarget?.kind === "group" ? t.insights.deleteGroup : t.common.delete}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />

        <EditGroupModal
          visible={editGroupOpen}
          group={selectedGroup}
          onClose={() => setEditGroupOpen(false)}
          onSaved={() => refreshGroups(selectedGroup.id)}
        />
      </>
    );
  }

  // ─── Groups list (default) ───
  return (
    <>
      <ScrollView className="flex-1" contentContainerClassName="gap-3 px-4 py-4" keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            {groups.length > 0 && (
              <>
                <Badge label={`${groups.length} ${t.common.group}`} />
                <Badge variant="primary" label={`${totalInsights} ${t.common.note}`} />
              </>
            )}
          </View>
          <Button size="sm" icon={<Plus size={16} color="#fff" />} onPress={() => setNewInsightOpen(true)}>
            {t.insights.newInsight}
          </Button>
        </View>

        {groups.length > 0 && (
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t.insights.searchGroups}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
        )}

        {filteredGroups.length > 0 ? (
          filteredGroups.map((group) => (
            <Pressable
              key={group.id}
              accessibilityRole="button"
              onPress={() => openGroup(group)}
              className="overflow-hidden rounded-2xl border border-line bg-card active:opacity-80"
            >
              <View className="flex-row">
                <View style={{ width: 4, backgroundColor: group.color }} />
                <View className="flex-1 p-4">
                  <View className="flex-row items-center justify-between gap-2">
                    <View className="flex-1 flex-row items-center gap-2">
                      <Text className="text-xl">{group.emoji}</Text>
                      <Text className="flex-1 text-base font-semibold text-ink" numberOfLines={1}>
                        {group.name}
                      </Text>
                    </View>
                    <Badge label={`${group.insight_count} ${t.common.note}`} />
                  </View>
                  {group.description ? (
                    <Text className="mt-1.5 text-sm text-ink-soft" numberOfLines={2}>
                      {group.description}
                    </Text>
                  ) : null}
                  <View className="mt-2.5 flex-row items-center justify-between">
                    <Text className="text-xs text-ink-mute">
                      {formatRelativeTime(group.last_insight_at ?? group.updated_at, t.common, locale)}
                    </Text>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Plus size={14} color={colors.inkMute} />}
                      onPress={() => setNoteTarget({ kind: "quick", groupId: group.id })}
                    >
                      {t.insights.quickAdd}
                    </Button>
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        ) : groups.length === 0 ? (
          <Card className="items-center py-12">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/40">
              <Lightbulb size={32} color={colors.tint} />
            </View>
            <Text className="mt-4 text-lg font-semibold text-ink">{t.insights.noGroups}</Text>
            <Text className="mt-2 px-4 text-center text-sm text-ink-soft">{t.insights.noGroupsDescription}</Text>
            <Button className="mt-5" icon={<Plus size={16} color="#fff" />} onPress={() => setNewInsightOpen(true)}>
              {t.insights.addFirstInsight}
            </Button>
          </Card>
        ) : (
          <Card className="items-center py-10">
            <Search size={28} color={colors.inkMute} />
            <Text className="mt-3 text-center text-ink-mute">
              "{searchQuery}" {t.insights.noSearchResults}
            </Text>
          </Card>
        )}
      </ScrollView>

      <EntryComposer
        visible={noteTarget !== null}
        label={noteComposerLabel}
        placeholder={t.insights.notePlaceholder}
        initialContent=""
        saving={noteSaving}
        onSave={handleNoteSave}
        onClose={() => setNoteTarget(null)}
      />

      <NewInsightModal
        visible={newInsightOpen}
        groups={groups}
        onClose={() => setNewInsightOpen(false)}
        onSaved={handleInsightSaved}
        onGroupCreated={() => refreshGroups()}
      />
    </>
  );
}
