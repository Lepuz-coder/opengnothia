import { useCallback, useEffect, useMemo, useState } from "react";
import { X, Plus, Loader2, Trash2, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n";
import { useSessionStore } from "@/stores/useSessionStore";
import {
  createInsight,
  createInsightGroup,
  deleteInsight,
  getInsightGroups,
  getInsightsByIds,
  updateInsightContent,
} from "@/services/db/queries";
import type { Insight, InsightGroup } from "@/types";
import { InlineGroupPicker } from "@/components/insights/InlineGroupPicker";
import { InlineCreateGroupForm, type NewGroupDraft } from "@/components/insights/InlineCreateGroupForm";

interface SessionInsightsPanelProps {
  onClose: () => void;
}

export function SessionInsightsPanel({ onClose }: SessionInsightsPanelProps) {
  const { t } = useTranslation();
  const sessionInsightIds = useSessionStore((s) => s.sessionInsightIds);
  const pendingGroupId = useSessionStore((s) => s.pendingGroupId);
  const pendingInsightDraft = useSessionStore((s) => s.pendingInsightDraft);
  const setPendingGroupId = useSessionStore((s) => s.setPendingGroupId);
  const setPendingInsightDraft = useSessionStore((s) => s.setPendingInsightDraft);
  const addSessionInsightId = useSessionStore((s) => s.addSessionInsightId);
  const removeSessionInsightId = useSessionStore((s) => s.removeSessionInsightId);

  const [groups, setGroups] = useState<InsightGroup[]>([]);
  const [sessionInsights, setSessionInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const loadGroups = useCallback(async () => {
    try {
      const list = await getInsightGroups();
      setGroups(list);
      return list;
    } catch {
      return [] as InsightGroup[];
    }
  }, []);

  const loadSessionInsights = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      setSessionInsights([]);
      return;
    }
    try {
      const list = await getInsightsByIds(ids);
      const order = new Map(ids.map((id, idx) => [id, idx]));
      list.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      setSessionInsights(list);
    } catch {
      setSessionInsights([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadGroups(), loadSessionInsights(sessionInsightIds)]).finally(() => setLoading(false));
  }, [loadGroups, loadSessionInsights, sessionInsightIds]);

  const groupsById = useMemo(() => {
    const map = new Map<string, InsightGroup>();
    for (const g of groups) map.set(g.id, g);
    return map;
  }, [groups]);

  const groupedInsights = useMemo(() => {
    const byGroup = new Map<string, { group: InsightGroup | null; insights: Insight[] }>();
    for (const insight of sessionInsights) {
      const key = insight.group_id;
      const existing = byGroup.get(key);
      if (existing) {
        existing.insights.push(insight);
      } else {
        byGroup.set(key, { group: groupsById.get(key) ?? null, insights: [insight] });
      }
    }
    return Array.from(byGroup.values());
  }, [sessionInsights, groupsById]);

  const handleCreateGroup = useCallback(
    async (draft: NewGroupDraft) => {
      try {
        setCreatingGroup(true);
        const id = await createInsightGroup(draft);
        await loadGroups();
        setPendingGroupId(id);
      } catch (err) {
        console.error("Failed to create insight group", err);
      } finally {
        setCreatingGroup(false);
      }
    },
    [loadGroups, setPendingGroupId],
  );

  const handleAdd = useCallback(async () => {
    const content = pendingInsightDraft.trim();
    if (!content || !pendingGroupId) return;
    try {
      setSaving(true);
      const newId = await createInsight({ group_id: pendingGroupId, content });
      addSessionInsightId(newId);
      setPendingInsightDraft("");
    } catch (err) {
      console.error("Failed to create insight", err);
    } finally {
      setSaving(false);
    }
  }, [pendingInsightDraft, pendingGroupId, addSessionInsightId, setPendingInsightDraft]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteInsight(id);
        removeSessionInsightId(id);
      } catch (err) {
        console.error("Failed to delete insight", err);
      }
    },
    [removeSessionInsightId],
  );

  const startEdit = useCallback((insight: Insight) => {
    setEditingId(insight.id);
    setEditContent(insight.content);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditContent("");
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingId) return;
    const content = editContent.trim();
    if (!content) return;
    try {
      await updateInsightContent(editingId, content);
      setSessionInsights((list) =>
        list.map((i) => (i.id === editingId ? { ...i, content } : i)),
      );
    } catch (err) {
      console.error("Failed to update insight", err);
    } finally {
      setEditingId(null);
      setEditContent("");
    }
  }, [editingId, editContent]);

  const canSubmit =
    pendingInsightDraft.trim().length > 0 && !!pendingGroupId && !saving && !creatingGroup;

  return (
    <aside className="flex flex-col w-96 border-l border-[var(--border-color)] bg-[var(--bg-primary)] h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]/60">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{t.session.insightsPanelTitle}</h3>
          {sessionInsightIds.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary-500/15 text-primary-400 text-xs tabular-nums">
              {sessionInsightIds.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          aria-label={t.common.close}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-[var(--text-muted)]">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : sessionInsights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="text-3xl mb-2">💡</div>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-[240px]">
              {t.session.noSessionInsights}
            </p>
          </div>
        ) : (
          groupedInsights.map(({ group, insights }) => (
            <div key={group?.id ?? "unknown"} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{group?.emoji ?? "💡"}</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {group?.name ?? "—"}
                </span>
              </div>
              {insights.map((insight) => (
                <div key={insight.id} className="pl-7">
                  {editingId === insight.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        autoFocus
                        className="w-full bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={cancelEdit}>
                          {t.common.cancel}
                        </Button>
                        <Button
                          size="sm"
                          disabled={!editContent.trim()}
                          onClick={saveEdit}
                        >
                          <Check className="w-3.5 h-3.5" />
                          {t.common.save}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="group/insight flex items-start gap-2">
                      <p className="flex-1 text-sm text-[var(--text-secondary)] leading-relaxed">
                        {insight.content}
                      </p>
                      <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover/insight:opacity-100 transition-all">
                        <button
                          onClick={() => startEdit(insight)}
                          className="p-1 rounded-lg hover:bg-[var(--bg-tertiary)] transition-all"
                          aria-label={t.common.edit}
                          title={t.common.edit}
                        >
                          <Pencil className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        </button>
                        <button
                          onClick={() => handleDelete(insight.id)}
                          className="p-1 rounded-lg hover:bg-red-500/10 transition-all"
                          aria-label={t.common.delete}
                          title={t.common.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <div className="border-t border-[var(--border-color)]/60 p-4 space-y-3 bg-[var(--bg-secondary)]/30">
        {creatingGroup ? (
          <InlineCreateGroupForm
            onCreate={handleCreateGroup}
            onCancel={() => setCreatingGroup(false)}
          />
        ) : (
          <InlineGroupPicker
            groups={groups}
            value={pendingGroupId}
            onChange={setPendingGroupId}
            onRequestCreate={() => setCreatingGroup(true)}
          />
        )}
        <textarea
          value={pendingInsightDraft}
          onChange={(e) => setPendingInsightDraft(e.target.value)}
          placeholder={t.session.insightPlaceholder}
          rows={3}
          className="w-full bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
        />
        {!pendingGroupId && !creatingGroup && (
          <p className="text-xs text-[var(--text-muted)]">{t.session.selectGroupFirst}</p>
        )}
        <Button
          disabled={!canSubmit}
          onClick={handleAdd}
          size="sm"
          className="w-full"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {t.common.saving}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              {t.session.addInsight}
            </span>
          )}
        </Button>
      </div>
    </aside>
  );
}
