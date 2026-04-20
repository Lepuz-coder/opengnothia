import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loader2, Lightbulb, X, Pencil, Plus, Check, Sparkles } from "lucide-react";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/cn";
import { getInsightGroups, getInsightsByIds } from "@/services/db/queries";
import { EMOJI_PRESETS, COLOR_PRESETS } from "@/constants/insightPresets";
import { showToast } from "@/stores/useToastStore";
import type { ExtractedInsight, Insight, InsightGroup } from "@/types";

interface SessionEndSummaryProps {
  summaryNarrative: string;
  isSummaryStreaming: boolean;
  onSave: () => void;
  saving?: boolean;
  extractedInsights: ExtractedInsight[];
  isExtractingInsights: boolean;
  insightExtractionError: boolean;
  onRemoveInsight: (id: string) => void;
  onUpdateInsight: (id: string, content: string) => void;
  onAddInsight: (insight: ExtractedInsight) => void;
  sessionInsightIds: string[];
  onAcceptExtractedInsight: (insight: ExtractedInsight) => Promise<void>;
}

function groupInsightsForDisplay(insights: ExtractedInsight[]) {
  const grouped = new Map<string, {
    key: string;
    name: string;
    emoji: string;
    isNew: boolean;
    insights: ExtractedInsight[];
  }>();

  for (const insight of insights) {
    const key = insight.group_id ?? `new:${insight.new_group?.name}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        name: insight.group_name ?? insight.new_group?.name ?? "",
        emoji: insight.group_emoji ?? insight.new_group?.emoji ?? "💡",
        isNew: !insight.group_id,
        insights: [],
      });
    }
    grouped.get(key)!.insights.push(insight);
  }

  return Array.from(grouped.values());
}

/** Collect unique new groups from extracted insights (for the group selector). */
function getNewGroupsFromInsights(insights: ExtractedInsight[]) {
  const seen = new Set<string>();
  const result: { name: string; emoji: string; description: string; color: string }[] = [];
  for (const i of insights) {
    if (i.new_group && !seen.has(i.new_group.name)) {
      seen.add(i.new_group.name);
      result.push(i.new_group);
    }
  }
  return result;
}

export function SessionEndSummary({
  summaryNarrative,
  isSummaryStreaming,
  onSave,
  saving,
  extractedInsights,
  isExtractingInsights,
  insightExtractionError,
  onRemoveInsight,
  onUpdateInsight,
  onAddInsight,
  sessionInsightIds,
  onAcceptExtractedInsight,
}: SessionEndSummaryProps) {
  const { t } = useTranslation();

  // Fake progress state
  const [progress, setProgress] = useState(0);
  const wasExtracting = useRef(false);

  useEffect(() => {
    if (isExtractingInsights) {
      wasExtracting.current = true;
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => prev + (95 - prev) * 0.03);
      }, 500);
      return () => clearInterval(interval);
    } else if (wasExtracting.current) {
      setProgress(100);
      wasExtracting.current = false;
    }
  }, [isExtractingInsights]);

  const stepThresholds = [0, 10, 25, 45, 65, 80];
  let stepIndex = 0;
  for (let i = stepThresholds.length - 1; i >= 0; i--) {
    if (progress >= stepThresholds[i]) { stepIndex = i; break; }
  }

  // User-added insights from the active session (persisted via panel)
  const [userInsights, setUserInsights] = useState<Insight[]>([]);
  const [userInsightsLoading, setUserInsightsLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Add insight state
  const [showAddForm, setShowAddForm] = useState(false);
  const [dbGroups, setDbGroups] = useState<InsightGroup[]>([]);
  const [dbGroupsLoaded, setDbGroupsLoaded] = useState(false);
  const [addGroupSelection, setAddGroupSelection] = useState<string>(""); // group_id, "new:GroupName", or "__create__"
  const [addContent, setAddContent] = useState("");

  // New group creation state (inside add form)
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupEmoji, setNewGroupEmoji] = useState("💡");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("#3ABAB4");

  const loadDbGroups = async () => {
    if (dbGroupsLoaded) return [];
    try {
      const groups = await getInsightGroups();
      setDbGroups(groups);
      setDbGroupsLoaded(true);
      return groups;
    } catch {
      setDbGroupsLoaded(true);
      return [];
    }
  };

  // Load user-added insights (from panel) + keep dbGroups fresh to display them
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (sessionInsightIds.length === 0) {
        setUserInsights([]);
        return;
      }
      setUserInsightsLoading(true);
      try {
        const [insights, groups] = await Promise.all([
          getInsightsByIds(sessionInsightIds),
          dbGroupsLoaded ? Promise.resolve(dbGroups) : getInsightGroups(),
        ]);
        if (cancelled) return;
        const order = new Map(sessionInsightIds.map((id, idx) => [id, idx]));
        insights.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
        setUserInsights(insights);
        if (!dbGroupsLoaded) {
          setDbGroups(groups);
          setDbGroupsLoaded(true);
        }
      } catch {
        if (!cancelled) setUserInsights([]);
      } finally {
        if (!cancelled) setUserInsightsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionInsightIds]);

  const selectFirstGroup = (groups: InsightGroup[]) => {
    const sessionNewGroups = getNewGroupsFromInsights(extractedInsights);
    if (groups.length > 0) {
      setAddGroupSelection(groups[0].id);
    } else if (sessionNewGroups.length > 0) {
      setAddGroupSelection(`new:${sessionNewGroups[0].name}`);
    } else {
      setAddGroupSelection("__create__");
    }
  };

  const openAddForm = async () => {
    setShowAddForm(true);
    setAddContent("");
    resetNewGroup();
    if (dbGroupsLoaded) {
      selectFirstGroup(dbGroups);
    } else {
      const groups = await loadDbGroups();
      selectFirstGroup(groups);
    }
  };

  const resetNewGroup = () => {
    setNewGroupName("");
    setNewGroupEmoji("💡");
    setNewGroupDescription("");
    setNewGroupColor("#3ABAB4");
  };

  const handleSaveEdit = (id: string) => {
    if (!editContent.trim()) return;
    onUpdateInsight(id, editContent.trim());
    setEditingId(null);
  };

  const handleAddInsight = () => {
    if (!addContent.trim()) return;

    const isCreatingNew = addGroupSelection === "__create__";
    const isSessionNewGroup = addGroupSelection.startsWith("new:");

    if (isCreatingNew) {
      if (!newGroupName.trim()) return;
      const newGroup = {
        name: newGroupName.trim(),
        emoji: newGroupEmoji,
        description: newGroupDescription.trim(),
        color: newGroupColor,
      };
      onAddInsight({
        id: crypto.randomUUID(),
        group_id: null,
        new_group: newGroup,
        content: addContent.trim(),
        group_name: newGroup.name,
        group_emoji: newGroup.emoji,
      });
    } else if (isSessionNewGroup) {
      const groupName = addGroupSelection.slice(4); // remove "new:"
      const sessionGroups = getNewGroupsFromInsights(extractedInsights);
      const existingNewGroup = sessionGroups.find((g) => g.name === groupName);
      onAddInsight({
        id: crypto.randomUUID(),
        group_id: null,
        new_group: existingNewGroup ?? { name: groupName, emoji: "💡", description: "", color: "#3ABAB4" },
        content: addContent.trim(),
        group_name: groupName,
        group_emoji: existingNewGroup?.emoji ?? "💡",
      });
    } else {
      // Existing DB group
      const dbGroup = dbGroups.find((g) => g.id === addGroupSelection);
      onAddInsight({
        id: crypto.randomUUID(),
        group_id: addGroupSelection,
        new_group: null,
        content: addContent.trim(),
        group_name: dbGroup?.name,
        group_emoji: dbGroup?.emoji,
      });
    }

    setAddContent("");
    setShowAddForm(false);
    resetNewGroup();
  };

  const newGroupsFromSession = getNewGroupsFromInsights(extractedInsights);
  const isCreatingNewGroup = addGroupSelection === "__create__";

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{t.session.sessionCompleted}</h2>
        <p className="text-[var(--text-muted)] mt-1">
          {t.session.sessionSummary}
        </p>
      </div>

      {/* Summary card */}
      <Card>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          {t.session.sessionSummary}
          {isSummaryStreaming && (
            <Loader2 className="w-4 h-4 text-accent-400 animate-spin" />
          )}
        </h3>
        {summaryNarrative ? (
          <div className="text-sm text-[var(--text-secondary)] leading-relaxed markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {summaryNarrative}
            </ReactMarkdown>
            {isSummaryStreaming && (
              <span className="inline-block w-1.5 h-3.5 bg-[var(--text-primary)] ml-0.5 animate-pulse" />
            )}
          </div>
        ) : (
          <div className="space-y-3 animate-pulse">
            <div className="h-3 bg-[var(--bg-tertiary)] rounded w-full" />
            <div className="h-3 bg-[var(--bg-tertiary)] rounded w-5/6" />
            <div className="h-3 bg-[var(--bg-tertiary)] rounded w-4/6" />
          </div>
        )}
      </Card>

      {/* User-added insights (from the active session panel) */}
      {(userInsights.length > 0 || userInsightsLoading) && (
        <Card>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            {t.session.yourSessionInsights}
            <span className="text-xs font-normal text-[var(--text-muted)] tabular-nums">
              · {userInsights.length}
            </span>
          </h3>
          {userInsightsLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-3 bg-[var(--bg-tertiary)] rounded w-full" />
              <div className="h-3 bg-[var(--bg-tertiary)] rounded w-5/6" />
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                const byGroup = new Map<string, { group: InsightGroup | null; insights: Insight[] }>();
                for (const insight of userInsights) {
                  const key = insight.group_id;
                  const group = dbGroups.find((g) => g.id === key) ?? null;
                  const existing = byGroup.get(key);
                  if (existing) existing.insights.push(insight);
                  else byGroup.set(key, { group, insights: [insight] });
                }
                return Array.from(byGroup.values()).map(({ group, insights }) => (
                  <div key={group?.id ?? "unknown"} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{group?.emoji ?? "💡"}</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {group?.name ?? "—"}
                      </span>
                    </div>
                    {insights.map((insight) => (
                      <div key={insight.id} className="pl-7">
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                          {insight.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          )}
        </Card>
      )}

      {/* AI-suggested insights */}
      {(isExtractingInsights || extractedInsights.length > 0 || insightExtractionError || showAddForm) && (
        <Card>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            {t.session.aiSuggestedInsights}
          </h3>

          {isExtractingInsights ? (
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-muted)] animate-pulse">
                {t.session.insightSteps[Math.min(stepIndex, t.session.insightSteps.length - 1)]}
              </p>
              <div className="w-full h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] text-right tabular-nums">
                {Math.round(Math.min(progress, 99))}%
              </p>
            </div>
          ) : insightExtractionError ? (
            <p className="text-sm text-[var(--text-muted)]">
              {t.session.insightExtractionError}
            </p>
          ) : (
            <>
              <div className="space-y-4">
                {groupInsightsForDisplay(extractedInsights).map((group) => (
                  <div key={group.key} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{group.emoji}</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {group.name}
                      </span>
                      {group.isNew && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-400">
                          {t.session.newGroup}
                        </span>
                      )}
                    </div>
                    {group.insights.map((insight) => (
                      <div key={insight.id} className="pl-7">
                        {editingId === insight.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 min-h-[80px]"
                              autoFocus
                            />
                            <div className="flex justify-end gap-2">
                              <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>
                                {t.common.cancel}
                              </Button>
                              <Button size="sm" onClick={() => handleSaveEdit(insight.id)} disabled={!editContent.trim()}>
                                {t.common.save}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-[var(--border-color)]/60 bg-[var(--bg-primary)] p-3 space-y-2.5 group/insight">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium uppercase tracking-wide">
                                <Sparkles className="w-3 h-3" />
                                {t.session.aiCreatedBadge}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingId(insight.id);
                                  setEditContent(insight.content);
                                }}
                                className="ml-auto p-1 rounded-lg hover:bg-[var(--bg-tertiary)] transition-all opacity-0 group-hover/insight:opacity-100"
                                title={t.common.edit}
                              >
                                <Pencil className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                              </button>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                              {insight.content}
                            </p>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <Button
                                size="sm"
                                disabled={acceptingId !== null}
                                onClick={async () => {
                                  setAcceptingId(insight.id);
                                  try {
                                    await onAcceptExtractedInsight(insight);
                                    showToast(t.session.addedToInsightsToast, "success");
                                  } finally {
                                    setAcceptingId(null);
                                  }
                                }}
                              >
                                {acceptingId === insight.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                {t.session.addToMyInsights}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Add insight form */}
              {showAddForm ? (
                <div className="mt-4 p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] space-y-3">
                  {/* Group selector */}
                  {!isCreatingNewGroup ? (
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                        {t.session.selectGroupForInsight}
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={addGroupSelection}
                          onChange={(e) => setAddGroupSelection(e.target.value)}
                          className="flex-1 appearance-none rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                        >
                          {dbGroups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.emoji} {g.name}
                            </option>
                          ))}
                          {newGroupsFromSession.map((g) => (
                            <option key={`new:${g.name}`} value={`new:${g.name}`}>
                              {g.emoji} {g.name} ✦
                            </option>
                          ))}
                          <option value="__create__">{t.session.createNewGroup}</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[var(--text-primary)]">
                          {t.session.createNewGroup}
                        </span>
                        <button
                          onClick={() => {
                            // go back to selector if we have options
                            if (dbGroups.length > 0) {
                              setAddGroupSelection(dbGroups[0].id);
                            } else if (newGroupsFromSession.length > 0) {
                              setAddGroupSelection(`new:${newGroupsFromSession[0].name}`);
                            }
                            resetNewGroup();
                          }}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder={t.session.newGroupName}
                        className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                        autoFocus
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {EMOJI_PRESETS.slice(0, 10).map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => setNewGroupEmoji(emoji)}
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all",
                              newGroupEmoji === emoji
                                ? "bg-primary-500/20 ring-2 ring-primary-500"
                                : "bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {COLOR_PRESETS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewGroupColor(color)}
                            className={cn(
                              "w-6 h-6 rounded-full transition-all",
                              newGroupColor === color
                                ? "ring-2 ring-offset-2 ring-offset-[var(--bg-secondary)]"
                                : "hover:scale-110"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <textarea
                    value={addContent}
                    onChange={(e) => setAddContent(e.target.value)}
                    placeholder={t.session.insightPlaceholder}
                    className="w-full bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none min-h-[80px]"
                  />

                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => { setShowAddForm(false); resetNewGroup(); }}>
                      {t.common.cancel}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddInsight}
                      disabled={!addContent.trim() || (isCreatingNewGroup && !newGroupName.trim())}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {t.common.add}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={openAddForm}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[var(--border-color)] text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  {t.session.addInsight}
                </button>
              )}
            </>
          )}
        </Card>
      )}

      {/* Save button */}
      <Button
        onClick={onSave}
        disabled={saving || isSummaryStreaming || isExtractingInsights}
        size="lg"
        className="w-full"
      >
        {saving
          ? t.common.saving
          : isSummaryStreaming
            ? t.session.preparingSummary
            : isExtractingInsights
              ? t.session.extractingInsights
              : t.session.saveAndClose}
      </Button>
    </div>
  );
}
