import { useState } from "react";
import { Plus, ArrowLeft, Check, Trash2, RotateCcw, Pencil, Save, CheckCircle, Search, X, Compass } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ErrorModal } from "@/components/ui/ErrorModal";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { useTranslation } from "@/i18n";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useAppStore } from "@/stores/useAppStore";
import { useSchoolsStore, getAllSchools, isBuiltInSchool, getSchoolById } from "@/stores/useSchoolsStore";
import { getLocalizedTherapySchool } from "@/i18n/therapySchools";
import { loadSettings } from "@/lib/store";
import { cn } from "@/lib/cn";
import { useSchoolRecommendation } from "@/hooks/useSchoolRecommendation";
import type { TherapySchoolDef } from "@/constants/therapySchools";

export default function SchoolsPage() {
  const { t, language } = useTranslation();
  const { therapySchool, setTherapySchool } = useSettingsStore();
  const { customSchools, promptOverrides, addSchool, updateSchool, deleteSchool, setPromptOverride, removePromptOverride } = useSchoolsStore();
  const setSidebarHidden = useAppStore((s) => s.setSidebarHidden);

  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [pendingSelectId, setPendingSelectId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saved, setSaved] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editShortName, setEditShortName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrompt, setEditPrompt] = useState("");

  // Add form state
  const [newName, setNewName] = useState("");
  const [newShortName, setNewShortName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrompt, setNewPrompt] = useState("");

  const allSchools = getAllSchools(language);
  const filteredSchools = searchQuery.trim()
    ? allSchools.filter((s) => {
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.shortName.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
      })
    : allSchools;
  const editingSchool = editingSchoolId ? getSchoolById(editingSchoolId, language) : null;

  async function persistSchoolsData() {
    const store = await loadSettings();
    await store.set("customSchools", useSchoolsStore.getState().customSchools);
    await store.set("promptOverrides", useSchoolsStore.getState().promptOverrides);
    await store.save();
  }

  async function persistSelectedSchool(id: string) {
    setTherapySchool(id);
    const store = await loadSettings();
    await store.set("therapySchool", id);
    await store.save();
  }

  // Recommendation hook
  const rec = useSchoolRecommendation({
    onSchoolSelected: async (school: TherapySchoolDef) => {
      await persistSelectedSchool(school.id);
      setSidebarHidden(false);
      setShowRecommendation(false);
    },
  });

  function openSchoolDetail(school: TherapySchoolDef) {
    setEditingSchoolId(school.id);
    setEditName(school.name);
    setEditShortName(school.shortName);
    setEditDescription(school.description);
    setEditPrompt(school.promptInstructions);
  }

  async function handleSaveEdit() {
    if (!editingSchoolId) return;

    if (isBuiltInSchool(editingSchoolId)) {
      const original = getLocalizedTherapySchool(editingSchoolId, language);
      if (original && editPrompt !== original.promptInstructions) {
        setPromptOverride(editingSchoolId, editPrompt);
      }
    } else {
      updateSchool(editingSchoolId, {
        name: editName,
        shortName: editShortName,
        description: editDescription,
        promptInstructions: editPrompt,
      });
    }

    await persistSchoolsData();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleResetPrompt() {
    if (!editingSchoolId) return;
    removePromptOverride(editingSchoolId);
    const original = getLocalizedTherapySchool(editingSchoolId, language);
    if (original) {
      setEditPrompt(original.promptInstructions);
    }
    setShowResetModal(false);
    await persistSchoolsData();
  }

  async function handleDeleteSchool() {
    const idToDelete = pendingDeleteId ?? editingSchoolId;
    if (!idToDelete) return;
    if (therapySchool === idToDelete) {
      await persistSelectedSchool("psychodynamic");
    }
    deleteSchool(idToDelete);
    setShowDeleteModal(false);
    setPendingDeleteId(null);
    if (editingSchoolId === idToDelete) setEditingSchoolId(null);
    await persistSchoolsData();
  }

  async function handleAddSchool() {
    if (!newName.trim() || !newPrompt.trim()) return;
    const id = `custom_${Date.now()}`;
    const school: TherapySchoolDef = {
      id,
      name: newName.trim(),
      shortName: newShortName.trim() || newName.trim(),
      description: newDescription.trim(),
      promptInstructions: newPrompt.trim(),
    };
    addSchool(school);
    await persistSchoolsData();
    setShowAddModal(false);
    setNewName("");
    setNewShortName("");
    setNewDescription("");
    setNewPrompt("");
  }

  function requestSelectSchool(id: string) {
    setPendingSelectId(id);
    setShowSelectModal(true);
  }

  async function confirmSelectSchool() {
    if (!pendingSelectId) return;
    await persistSelectedSchool(pendingSelectId);
    setShowSelectModal(false);
    setPendingSelectId(null);
  }

  function startRecommendation() {
    if (showRecommendation || rec.recIsStreaming) return;
    setSidebarHidden(true);
    setShowRecommendation(true);
    rec.startRecommendation();
  }

  function handleCancelRecommendation() {
    rec.resetRecommendation();
    setSidebarHidden(false);
    setShowRecommendation(false);
  }

  // Recommendation view
  if (showRecommendation) {
    return (
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-color)]/50 bg-[var(--bg-primary)]">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancelRecommendation}
              className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="font-semibold">{t.schools.findIdealSchool}</h2>
          </div>
          <button
            onClick={handleCancelRecommendation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <X className="w-4 h-4" />
            {t.common.close}
          </button>
        </div>

        {/* Chat area */}
        <ChatContainer
          messages={rec.recMessages}
          isLoading={rec.recIsLoading}
          isStreaming={rec.recIsStreaming}
        />

        {/* Result card */}
        {rec.recPhase === "result" && rec.recRecommendedSchool && (
          <div className="px-4 pb-2">
            <div className="max-w-3xl mx-auto">
              <Card className="border-primary-500 ring-1 ring-primary-500/20">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-5 h-5 text-primary-500" />
                      <h3 className="font-semibold">{rec.recRecommendedSchool.name}</h3>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">
                      {rec.recRecommendedSchool.description}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button onClick={rec.handleApplyRecommendation}>
                    <Check className="w-4 h-4" />
                    {t.schools.applySchool}
                  </Button>
                  <Button variant="secondary" onClick={handleCancelRecommendation}>
                    {t.common.cancel}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Input */}
        {rec.recPhase === "chat" && (
          <ChatInput
            onSend={rec.handleRecommendationSend}
            disabled={rec.recIsLoading || rec.recIsStreaming}
          />
        )}

        {/* Error Modal */}
        <ErrorModal
          isOpen={rec.recError !== null}
          onClose={() => rec.setRecError(null)}
          title={rec.recError?.title ?? ""}
          message={rec.recError?.message ?? ""}
          showSettingsLink={rec.recError?.showSettingsLink ?? false}
          onGoToSettings={() => rec.setRecError(null)}
        />
      </div>
    );
  }

  // Detail view
  if (editingSchoolId && editingSchool) {
    const builtIn = isBuiltInSchool(editingSchoolId);
    const hasOverride = builtIn && !!promptOverrides[editingSchoolId];

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => { setEditingSchoolId(null); setSaved(false); }}
          className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.common.back}
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{editingSchool.name}</h1>
            {builtIn ? (
              <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-primary-500/10 text-primary-400">
                {t.schools.builtIn}
              </span>
            ) : (
              <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-accent-500/10 text-accent-400">
                {t.schools.custom}
              </span>
            )}
            {hasOverride && (
              <span className="inline-block mt-1 ml-2 px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-500">
                {t.schools.promptOverridden}
              </span>
            )}
          </div>
          {therapySchool === editingSchoolId ? (
            <span className="flex items-center gap-1.5 text-sm text-green-500">
              <Check className="w-4 h-4" />
              {t.schools.activeSchool}
            </span>
          ) : (
            <Button size="sm" onClick={() => requestSelectSchool(editingSchoolId)}>
              <Check className="w-4 h-4" />
              {t.schools.selectSchool}
            </Button>
          )}
        </div>

        {!builtIn && (
          <Card>
            <div className="space-y-4">
              <Input
                label={t.schools.schoolName}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={t.schools.namePlaceholder}
              />
              <Input
                label={t.schools.schoolShortName}
                value={editShortName}
                onChange={(e) => setEditShortName(e.target.value)}
                placeholder={t.schools.shortNamePlaceholder}
              />
              <Input
                label={t.schools.schoolDescription}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder={t.schools.descriptionPlaceholder}
              />
            </div>
          </Card>
        )}

        {builtIn && (
          <Card>
            <p className="text-sm text-[var(--text-secondary)]">{editingSchool.description}</p>
          </Card>
        )}

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">{t.schools.promptInstructions}</h2>
            {builtIn && hasOverride && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResetModal(true)}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t.schools.resetPrompt}
              </Button>
            )}
          </div>
          <textarea
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            placeholder={t.schools.promptPlaceholder}
            rows={16}
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-y font-mono leading-relaxed"
          />
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={handleSaveEdit}>
            <Save className="w-4 h-4" />
            {t.common.save}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" /> {t.settings.saved}
            </span>
          )}
          {!builtIn && (
            <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
              <Trash2 className="w-4 h-4" />
              {t.schools.deleteSchool}
            </Button>
          )}
        </div>

        {/* Reset prompt modal */}
        <Modal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          title={t.schools.resetPrompt}
        >
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {t.schools.resetPromptConfirm}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setShowResetModal(false)}>
              {t.common.cancel}
            </Button>
            <Button size="sm" onClick={handleResetPrompt}>
              {t.schools.resetPrompt}
            </Button>
          </div>
        </Modal>

        {/* Delete school modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title={t.schools.deleteSchool}
        >
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {t.schools.deleteSchoolConfirm}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setShowDeleteModal(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteSchool}>
              {t.common.delete}
            </Button>
          </div>
        </Modal>

        {/* Select school confirmation modal */}
        <Modal
          isOpen={showSelectModal}
          onClose={() => { setShowSelectModal(false); setPendingSelectId(null); }}
          title={t.schools.selectSchool}
        >
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {t.schools.selectSchoolConfirm}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => { setShowSelectModal(false); setPendingSelectId(null); }}>
              {t.common.cancel}
            </Button>
            <Button size="sm" onClick={confirmSelectSchool}>
              {t.common.yes}
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  // List view
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.schools.title}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{t.schools.description}</p>
        </div>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          {t.schools.addSchool}
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.schools.searchPlaceholder}
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

      {/* Find ideal school button */}
      <Button variant="secondary" className="w-full" onClick={startRecommendation}>
        <Compass className="w-4 h-4" />
        {t.schools.findIdealSchool}
      </Button>

      <div className="space-y-3">
        {filteredSchools.length === 0 ? (
          <Card className="text-center py-12">
            <Search className="w-8 h-8 mx-auto text-[var(--text-muted)] mb-3" />
            <p className="text-[var(--text-muted)]">
              "{searchQuery}" {t.schools.noSearchResults}
            </p>
          </Card>
        ) : (
          filteredSchools.map((school) => {
            const isSelected = therapySchool === school.id;
            const builtIn = isBuiltInSchool(school.id);
            const hasOverride = builtIn && !!promptOverrides[school.id];

            return (
              <Card
                key={school.id}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary-500/30",
                  isSelected && "border-primary-500 ring-1 ring-primary-500/20"
                )}
                onClick={() => openSchoolDetail(school)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{school.name}</h3>
                      {builtIn ? (
                        <span className="shrink-0 px-2 py-0.5 text-[10px] rounded-full bg-primary-500/10 text-primary-400">
                          {t.schools.builtIn}
                        </span>
                      ) : (
                        <span className="shrink-0 px-2 py-0.5 text-[10px] rounded-full bg-accent-500/10 text-accent-400">
                          {t.schools.custom}
                        </span>
                      )}
                      {hasOverride && (
                        <span className="shrink-0 px-2 py-0.5 text-[10px] rounded-full bg-yellow-500/10 text-yellow-500">
                          {t.schools.promptOverridden}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-muted)] line-clamp-2">
                      {school.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected ? (
                      <span className="flex items-center gap-1.5 text-xs text-green-500 whitespace-nowrap">
                        <Check className="w-4 h-4" />
                        {t.schools.activeSchool}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => { e.stopPropagation(); requestSelectSchool(school.id); }}
                      >
                        {t.schools.selectSchool}
                      </Button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); openSchoolDetail(school); }}
                      className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      title={t.schools.editPrompt}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {!builtIn && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setPendingDeleteId(school.id); setShowDeleteModal(true); }}
                        className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-[var(--text-muted)] hover:text-red-500"
                        title={t.schools.deleteSchool}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Select school confirmation modal */}
      <Modal
        isOpen={showSelectModal}
        onClose={() => { setShowSelectModal(false); setPendingSelectId(null); }}
        title={t.schools.selectSchool}
      >
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          {t.schools.selectSchoolConfirm}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={() => { setShowSelectModal(false); setPendingSelectId(null); }}>
            {t.common.cancel}
          </Button>
          <Button size="sm" onClick={confirmSelectSchool}>
            {t.common.yes}
          </Button>
        </div>
      </Modal>

      {/* Delete school modal (list view) */}
      <Modal
        isOpen={showDeleteModal && !editingSchoolId}
        onClose={() => { setShowDeleteModal(false); setPendingDeleteId(null); }}
        title={t.schools.deleteSchool}
      >
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          {t.schools.deleteSchoolConfirm}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={() => { setShowDeleteModal(false); setPendingDeleteId(null); }}>
            {t.common.cancel}
          </Button>
          <Button variant="danger" size="sm" onClick={handleDeleteSchool}>
            {t.common.delete}
          </Button>
        </div>
      </Modal>

      {/* Add school modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setNewName(""); setNewShortName(""); setNewDescription(""); setNewPrompt(""); }}
        title={t.schools.newSchool}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <Input
            label={t.schools.schoolName}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t.schools.namePlaceholder}
          />
          <Input
            label={t.schools.schoolShortName}
            value={newShortName}
            onChange={(e) => setNewShortName(e.target.value)}
            placeholder={t.schools.shortNamePlaceholder}
          />
          <Input
            label={t.schools.schoolDescription}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder={t.schools.descriptionPlaceholder}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              {t.schools.promptInstructions}
            </label>
            <textarea
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder={t.schools.promptPlaceholder}
              rows={10}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-y font-mono leading-relaxed"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setShowAddModal(false); setNewName(""); setNewShortName(""); setNewDescription(""); setNewPrompt(""); }}
            >
              {t.common.cancel}
            </Button>
            <Button
              size="sm"
              disabled={!newName.trim() || !newPrompt.trim()}
              onClick={handleAddSchool}
            >
              {t.common.add}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
