import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { useTranslation, getDateLocale } from "@/i18n";
import type { Translations } from "@/i18n";
import {
  getInsightGroups,
  createInsightGroup,
  updateInsightGroup,
  deleteInsightGroup,
  getInsightsByGroupId,
  createInsight,
  updateInsightContent,
  toggleInsightPin,
  deleteInsight,
} from "@/services/db/queries";
import {
  Plus,
  ArrowLeft,
  Trash2,
  Loader2,
  Pencil,
  Pin,
  PinOff,
  Search,
  Lightbulb,
  X,
  FolderPlus,
  Check,
} from "lucide-react";
import type { InsightGroup, Insight } from "@/types";
import { EMOJI_PRESETS, COLOR_PRESETS } from "@/constants/insightPresets";

function formatRelativeTime(dateStr: string, t: Translations["common"], locale: string): string {
  const date = new Date(dateStr.includes("T") ? dateStr : dateStr + "Z");
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t.justNow;
  if (diffMins < 60) return `${diffMins} ${t.minutesAgo}`;
  if (diffHours < 24) return `${diffHours} ${t.hoursAgo}`;
  if (diffDays < 7) return `${diffDays} ${t.daysAgo}`;
  return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr.includes("T") ? dateStr : dateStr + "Z");
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type View = "groups" | "detail";

export default function InsightsPage() {
  const { t, language } = useTranslation();
  const locale = getDateLocale(language);
  const [view, setView] = useState<View>("groups");
  const [groups, setGroups] = useState<InsightGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<InsightGroup | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // New insight modal
  const [newInsightModalOpen, setNewInsightModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving] = useState(false);

  // New group form (inside modal)
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupEmoji, setNewGroupEmoji] = useState("💡");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("#3ABAB4");

  // Edit group modal
  const [editGroupModalOpen, setEditGroupModalOpen] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupEmoji, setEditGroupEmoji] = useState("💡");
  const [editGroupDescription, setEditGroupDescription] = useState("");
  const [editGroupColor, setEditGroupColor] = useState("#3ABAB4");

  // Delete confirmation
  const [deleteGroupModalOpen, setDeleteGroupModalOpen] = useState(false);
  const [deleteInsightId, setDeleteInsightId] = useState<string | null>(null);

  // Inline edit insight
  const [editingInsightId, setEditingInsightId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Quick add from group card
  const [quickAddGroupId, setQuickAddGroupId] = useState<string | null>(null);
  const [quickAddContent, setQuickAddContent] = useState("");

  // New note in detail view
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");

  const loadGroups = useCallback(async () => {
    try {
      const data = await getInsightGroups();
      setGroups(data);
    } catch (err) {
      console.error("Failed to load insight groups:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInsights = useCallback(async (groupId: string) => {
    try {
      const data = await getInsightsByGroupId(groupId);
      setInsights(data);
    } catch (err) {
      console.error("Failed to load insights:", err);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q))
    );
  }, [groups, searchQuery]);

  const totalInsights = useMemo(
    () => groups.reduce((sum, g) => sum + g.insight_count, 0),
    [groups]
  );

  const handleGroupClick = async (group: InsightGroup) => {
    setSelectedGroup(group);
    await loadInsights(group.id);
    setView("detail");
  };

  const handleBackToGroups = () => {
    setView("groups");
    setSelectedGroup(null);
    setInsights([]);
    setShowNewNote(false);
    setEditingInsightId(null);
    loadGroups();
  };

  // New insight modal handlers
  const openNewInsightModal = () => {
    setNewInsightModalOpen(true);
    setSelectedGroupId(selectedGroup?.id ?? (groups.length > 0 ? groups[0].id : ""));
    setNewContent("");
    setShowNewGroupForm(false);
    resetNewGroupForm();
  };

  const resetNewGroupForm = () => {
    setNewGroupName("");
    setNewGroupEmoji("💡");
    setNewGroupDescription("");
    setNewGroupColor("#3ABAB4");
  };

  const handleCreateGroupInModal = async () => {
    if (!newGroupName.trim()) return;
    try {
      const id = await createInsightGroup({
        name: newGroupName.trim(),
        emoji: newGroupEmoji,
        description: newGroupDescription.trim() || undefined,
        color: newGroupColor,
      });
      await loadGroups();
      setSelectedGroupId(id);
      setShowNewGroupForm(false);
      resetNewGroupForm();
    } catch (err) {
      console.error("Failed to create group:", err);
    }
  };

  const handleSaveNewInsight = async () => {
    if (!newContent.trim() || !selectedGroupId) return;
    setSaving(true);
    try {
      await createInsight({ group_id: selectedGroupId, content: newContent.trim() });
      setNewInsightModalOpen(false);
      setNewContent("");
      await loadGroups();
      if (view === "detail" && selectedGroup?.id === selectedGroupId) {
        await loadInsights(selectedGroupId);
        // Refresh the selected group data
        const updatedGroups = await getInsightGroups();
        const updated = updatedGroups.find((g) => g.id === selectedGroupId);
        if (updated) setSelectedGroup(updated);
      }
    } catch (err) {
      console.error("Failed to save insight:", err);
    } finally {
      setSaving(false);
    }
  };

  // Quick add handlers
  const handleQuickAdd = (groupId: string) => {
    setQuickAddGroupId(quickAddGroupId === groupId ? null : groupId);
    setQuickAddContent("");
  };

  const handleSaveQuickAdd = async (groupId: string) => {
    if (!quickAddContent.trim()) return;
    try {
      await createInsight({ group_id: groupId, content: quickAddContent.trim() });
      setQuickAddGroupId(null);
      setQuickAddContent("");
      await loadGroups();
    } catch (err) {
      console.error("Failed to quick add:", err);
    }
  };

  // Detail view - new note
  const handleSaveNewNote = async () => {
    if (!newNoteContent.trim() || !selectedGroup) return;
    try {
      await createInsight({ group_id: selectedGroup.id, content: newNoteContent.trim() });
      setNewNoteContent("");
      setShowNewNote(false);
      await loadInsights(selectedGroup.id);
      const updatedGroups = await getInsightGroups();
      const updated = updatedGroups.find((g) => g.id === selectedGroup.id);
      if (updated) setSelectedGroup(updated);
    } catch (err) {
      console.error("Failed to add note:", err);
    }
  };

  // Edit insight
  const startEditing = (insight: Insight) => {
    setEditingInsightId(insight.id);
    setEditContent(insight.content);
  };

  const handleUpdateInsight = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      await updateInsightContent(id, editContent.trim());
      setEditingInsightId(null);
      if (selectedGroup) await loadInsights(selectedGroup.id);
    } catch (err) {
      console.error("Failed to update insight:", err);
    }
  };

  // Pin/unpin
  const handleTogglePin = async (insight: Insight) => {
    try {
      await toggleInsightPin(insight.id, !insight.is_pinned);
      if (selectedGroup) await loadInsights(selectedGroup.id);
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  // Delete insight
  const handleDeleteInsight = async () => {
    if (!deleteInsightId) return;
    try {
      await deleteInsight(deleteInsightId);
      setDeleteInsightId(null);
      if (selectedGroup) {
        await loadInsights(selectedGroup.id);
        const updatedGroups = await getInsightGroups();
        const updated = updatedGroups.find((g) => g.id === selectedGroup.id);
        if (updated) setSelectedGroup(updated);
      }
    } catch (err) {
      console.error("Failed to delete insight:", err);
    }
  };

  // Edit group
  const openEditGroupModal = () => {
    if (!selectedGroup) return;
    setEditGroupName(selectedGroup.name);
    setEditGroupEmoji(selectedGroup.emoji);
    setEditGroupDescription(selectedGroup.description ?? "");
    setEditGroupColor(selectedGroup.color);
    setEditGroupModalOpen(true);
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup || !editGroupName.trim()) return;
    try {
      await updateInsightGroup(selectedGroup.id, {
        name: editGroupName.trim(),
        emoji: editGroupEmoji,
        description: editGroupDescription.trim() || undefined,
        color: editGroupColor,
      });
      const updatedGroups = await getInsightGroups();
      const updated = updatedGroups.find((g) => g.id === selectedGroup.id);
      if (updated) setSelectedGroup(updated);
      setEditGroupModalOpen(false);
    } catch (err) {
      console.error("Failed to update group:", err);
    }
  };

  // Delete group
  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    try {
      await deleteInsightGroup(selectedGroup.id);
      setDeleteGroupModalOpen(false);
      handleBackToGroups();
    } catch (err) {
      console.error("Failed to delete group:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  // ─── Group Detail View ───
  if (view === "detail" && selectedGroup) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={handleBackToGroups}
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.common.back}
        </button>

        {/* Group header */}
        <div
          className="rounded-2xl p-6 border border-[var(--border-color)]"
          style={{
            background: `linear-gradient(135deg, ${selectedGroup.color}15 0%, var(--bg-secondary) 60%)`,
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedGroup.emoji}</span>
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">
                  {selectedGroup.name}
                </h1>
                {selectedGroup.description && (
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {selectedGroup.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{selectedGroup.insight_count} {t.common.note}</Badge>
              <Button variant="ghost" size="sm" onClick={openEditGroupModal}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteGroupModalOpen(true)}
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            </div>
          </div>
        </div>

        {/* New note button / form */}
        {showNewNote ? (
          <Card>
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder={t.insights.notePlaceholder}
              className="w-full bg-[var(--bg-primary)] rounded-xl p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 min-h-[100px]"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowNewNote(false);
                  setNewNoteContent("");
                }}
              >
                {t.common.cancel}
              </Button>
              <Button
                size="sm"
                onClick={handleSaveNewNote}
                disabled={!newNoteContent.trim()}
              >
                <Check className="w-3.5 h-3.5" />
                {t.common.save}
              </Button>
            </div>
          </Card>
        ) : (
          <Button onClick={() => setShowNewNote(true)} className="w-full">
            <Plus className="w-4 h-4" />
            {t.insights.newNote}
          </Button>
        )}

        {/* Insights list */}
        <div className="space-y-3">
          {insights.length === 0 ? (
            <Card className="text-center py-12">
              <Lightbulb className="w-10 h-10 mx-auto text-[var(--text-muted)] mb-3" />
              <p className="text-[var(--text-muted)]">{t.insights.noNotesInGroup}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {t.insights.addFirstNote}
              </p>
            </Card>
          ) : (
            insights.map((insight) => (
              <Card
                key={insight.id}
                className={cn(
                  "transition-all duration-200",
                  insight.is_pinned && "border-l-2"
                )}
                style={
                  insight.is_pinned
                    ? { borderLeftColor: "rgb(245, 158, 11)" }
                    : undefined
                }
              >
                {editingInsightId === insight.id ? (
                  <>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-[var(--bg-primary)] rounded-xl p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 min-h-[80px]"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingInsightId(null)}
                      >
                        {t.common.cancel}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateInsight(insight.id)}
                        disabled={!editContent.trim()}
                      >
                        {t.common.save}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {insight.is_pinned && (
                      <div className="flex items-center gap-1 mb-2">
                        <Pin className="w-3 h-3 text-amber-400" />
                        <span className="text-xs text-amber-400 font-medium">
                          {t.insights.pinned}
                        </span>
                      </div>
                    )}
                    <p className="text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed text-sm">
                      {insight.content}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-color)]">
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatDate(insight.created_at, locale)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePin(insight)}
                          title={insight.is_pinned ? t.insights.unpin : t.insights.pin}
                        >
                          {insight.is_pinned ? (
                            <PinOff className="w-3.5 h-3.5" />
                          ) : (
                            <Pin className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(insight)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteInsightId(insight.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Delete insight confirmation */}
        <Modal
          isOpen={!!deleteInsightId}
          onClose={() => setDeleteInsightId(null)}
          title={t.insights.deleteNote}
        >
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {t.insights.deleteNoteConfirm}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleteInsightId(null)}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteInsight}>
              {t.common.delete}
            </Button>
          </div>
        </Modal>

        {/* Delete group confirmation */}
        <Modal
          isOpen={deleteGroupModalOpen}
          onClose={() => setDeleteGroupModalOpen(false)}
          title={t.insights.deleteGroup}
        >
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            <strong>"{selectedGroup.name}"</strong> {t.insights.deleteGroupConfirm}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteGroupModalOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteGroup}>
              {t.insights.deleteGroup}
            </Button>
          </div>
        </Modal>

        {/* Edit group modal */}
        <Modal
          isOpen={editGroupModalOpen}
          onClose={() => setEditGroupModalOpen(false)}
          title={t.insights.editGroup}
        >
          <div className="space-y-4">
            <Input
              label={t.insights.groupName}
              value={editGroupName}
              onChange={(e) => setEditGroupName(e.target.value)}
              placeholder={t.insights.groupNamePlaceholder}
            />

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                {t.insights.emoji}
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {EMOJI_PRESETS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setEditGroupEmoji(emoji)}
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all",
                      editGroupEmoji === emoji
                        ? "bg-primary-500/20 ring-2 ring-primary-500"
                        : "bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)]"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editGroupEmoji}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) setEditGroupEmoji(val.slice(-2));
                  }}
                  className="w-12 h-9 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-center text-lg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
                <span className="text-xs text-[var(--text-muted)]">{t.insights.emojiCustom}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                {t.insights.descriptionOptional}
              </label>
              <textarea
                value={editGroupDescription}
                onChange={(e) => setEditGroupDescription(e.target.value)}
                placeholder={t.insights.descriptionPlaceholder}
                className="w-full bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none min-h-[60px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                {t.insights.color}
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setEditGroupColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      editGroupColor === color
                        ? "ring-2 ring-offset-2 ring-offset-[var(--bg-secondary)]"
                        : "hover:scale-110"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditGroupModalOpen(false)}
              >
                {t.common.cancel}
              </Button>
              <Button
                size="sm"
                onClick={handleUpdateGroup}
                disabled={!editGroupName.trim()}
              >
                {t.common.save}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // ─── Groups List View ───
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t.insights.title}</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {t.insights.description}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {groups.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge>{groups.length} {t.common.group}</Badge>
              <Badge variant="primary">{totalInsights} {t.common.note}</Badge>
            </div>
          )}
          <Button onClick={openNewInsightModal}>
            <Plus className="w-4 h-4" />
            {t.insights.newInsight}
          </Button>
        </div>
      </div>

      {/* Search bar */}
      {groups.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.insights.searchGroups}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Groups grid */}
      {filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGroups.map((group) => (
            <div key={group.id}>
              <Card
                className="cursor-pointer hover:border-[var(--text-muted)] transition-all duration-200 relative overflow-hidden h-full"
                onClick={() => handleGroupClick(group)}
              >
                {/* Color accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: group.color }}
                />
                <div className="pl-2 flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl flex-shrink-0">{group.emoji}</span>
                      <h3 className="font-semibold text-[var(--text-primary)] truncate">
                        {group.name}
                      </h3>
                    </div>
                    <Badge className="flex-shrink-0 ml-2">
                      {group.insight_count} {t.common.note}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3 flex-1">
                    {group.description || "\u00A0"}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs text-[var(--text-muted)]">
                      {group.last_insight_at
                        ? formatRelativeTime(group.last_insight_at, t.common, locale)
                        : formatRelativeTime(group.updated_at, t.common, locale)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAdd(group.id);
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t.insights.quickAdd}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Quick add area */}
              {quickAddGroupId === group.id && (
                <div className="mt-2 p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                  <textarea
                    value={quickAddContent}
                    onChange={(e) => setQuickAddContent(e.target.value)}
                    placeholder={t.insights.quickNotePlaceholder}
                    className="w-full bg-[var(--bg-primary)] rounded-lg p-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 min-h-[60px]"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickAddGroupId(null);
                      }}
                    >
                      {t.common.cancel}
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveQuickAdd(group.id);
                      }}
                      disabled={!quickAddContent.trim()}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {t.common.add}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        // Empty state - no groups at all
        <Card className="text-center py-16">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: "rgba(58, 186, 180, 0.1)" }}
          >
            <Lightbulb className="w-8 h-8 text-primary-500" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {t.insights.noGroups}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">
            {t.insights.noGroupsDescription}
          </p>
          <Button onClick={openNewInsightModal}>
            <Plus className="w-4 h-4" />
            {t.insights.addFirstInsight}
          </Button>
        </Card>
      ) : (
        // No results for search
        <Card className="text-center py-12">
          <Search className="w-8 h-8 mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-muted)]">
            "{searchQuery}" {t.insights.noSearchResults}
          </p>
        </Card>
      )}

      {/* New Insight Modal */}
      <Modal
        isOpen={newInsightModalOpen}
        onClose={() => setNewInsightModalOpen(false)}
        title={t.insights.newInsight}
        className="max-w-xl"
      >
        <div className="space-y-4">
          {/* Group selector */}
          {!showNewGroupForm ? (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                {t.insights.selectGroup}
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="flex-1 appearance-none rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                >
                  {groups.length === 0 && (
                    <option value="">{t.insights.createGroupFirst}</option>
                  )}
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.emoji} {g.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowNewGroupForm(true)}
                  title={t.insights.createNewGroup}
                >
                  <FolderPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {t.insights.createNewGroupTitle}
                </span>
                <button
                  onClick={() => {
                    setShowNewGroupForm(false);
                    resetNewGroupForm();
                  }}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder={t.insights.groupNamePlaceholder}
                autoFocus
              />

              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  {t.insights.emoji}
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {EMOJI_PRESETS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setNewGroupEmoji(emoji)}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all",
                        newGroupEmoji === emoji
                          ? "bg-primary-500/20 ring-2 ring-primary-500"
                          : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newGroupEmoji}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) setNewGroupEmoji(val.slice(-2));
                    }}
                    className="w-10 h-8 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-center text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                  />
                  <span className="text-xs text-[var(--text-muted)]">{t.insights.emojiCustom}</span>
                </div>
              </div>

              <textarea
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder={t.insights.descriptionOptionalPlaceholder}
                className="w-full bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none min-h-[50px]"
              />

              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  {t.insights.color}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewGroupColor(color)}
                      className={cn(
                        "w-7 h-7 rounded-full transition-all",
                        newGroupColor === color
                          ? "ring-2 ring-offset-2 ring-offset-[var(--bg-primary)]"
                          : "hover:scale-110"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <Button
                size="sm"
                onClick={handleCreateGroupInModal}
                disabled={!newGroupName.trim()}
                className="w-full"
              >
                <Check className="w-3.5 h-3.5" />
                {t.insights.createGroup}
              </Button>
            </div>
          )}

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              {t.insights.insightLabel}
            </label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder={t.insights.notePlaceholder}
              className="w-full bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none min-h-[120px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setNewInsightModalOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleSaveNewInsight}
              disabled={!newContent.trim() || !selectedGroupId || saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {t.common.save}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
