import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useAppStore } from "@/stores/useAppStore";
import { streamMessage } from "@/services/ai/aiService";
import { calculateCost } from "@/services/ai/costCalculator";
import { buildJournalAnalysisPrompt, buildJournalPatientNotesUpdatePrompt } from "@/services/ai/promptBuilder";
import { takeBackgroundNotes } from "@/services/ai/backgroundNotes";
import {
  createJournalEntry,
  getJournalEntries,
  getJournalEntryById,
  updateJournalAnalysis,
  updateJournalEntryContent,
  deleteJournalEntry,
  getUserProfile,
  getPatientNotes,
  saveTokenUsage,
} from "@/services/db/queries";
import { BookOpen, Plus, ArrowLeft, Trash2, Sparkles, Loader2, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { JournalEntry, AIProvider, TokenUsage } from "@/types";

type View = "list" | "write" | "detail";

async function trackUsage(
  provider: AIProvider,
  model: string,
  callType: string,
  usage: TokenUsage | null,
) {
  if (!usage) return;
  const cost = calculateCost(provider, model, usage.inputTokens, usage.outputTokens);
  await saveTokenUsage({
    session_id: null,
    provider,
    model,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    cost,
    call_type: callType,
  });
}

export default function JournalPage() {
  const settings = useSettingsStore();
  const setSidebarHidden = useAppStore((s) => s.setSidebarHidden);

  // View state
  const [view, setView] = useState<View>("list");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);

  // Write form state
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  // Delete state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);

  // Hide sidebar in write view
  useEffect(() => {
    if (view === "write") {
      setSidebarHidden(true);
    } else {
      setSidebarHidden(false);
    }
    return () => setSidebarHidden(false);
  }, [view, setSidebarHidden]);

  // Load entries
  const loadEntries = useCallback(async () => {
    const data = await getJournalEntries(50);
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Navigate to write view
  const handleNewEntry = () => {
    setContent("");
    setView("write");
  };

  // Save entry
  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      if (editingEntryId) {
        await updateJournalEntryContent(editingEntryId, content.trim());
        const updated = await getJournalEntryById(editingEntryId);
        if (updated) setSelectedEntry(updated);
        setEditingEntryId(null);
      } else {
        const entry = await createJournalEntry({
          content: content.trim(),
          mood: null,
          tags: [],
        });
        setSelectedEntry(entry);
      }
      setView("detail");
      setContent("");
      await loadEntries();
    } finally {
      setSaving(false);
    }
  };

  // View detail
  const handleViewEntry = async (id: string) => {
    const entry = await getJournalEntryById(id);
    if (entry) {
      setSelectedEntry(entry);
      setError(null);
      setView("detail");
    }
  };

  // Delete entry
  const handleDelete = async () => {
    if (!selectedEntry) return;
    await deleteJournalEntry(selectedEntry.id);
    setSelectedEntry(null);
    setDeleteModalOpen(false);
    setView("list");
    await loadEntries();
  };

  // AI Analysis
  const handleAnalyze = async () => {
    if (!selectedEntry || isAnalyzing) return;
    setIsAnalyzing(true);
    setError(null);
    setAnalysisModalOpen(true);

    try {
      const [profile, patientNotes] = await Promise.all([
        getUserProfile(),
        getPatientNotes(),
      ]);

      const analysisPrompt = buildJournalAnalysisPrompt({
        journalContent: selectedEntry.content,
        mood: selectedEntry.mood,
        tags: selectedEntry.tags,
        patientNotes,
        profile,
        therapySchool: settings.therapySchool,
      });

      let fullAnalysis = "";
      let streamUsage: TokenUsage | null = null;
      let streamError: Error | null = null;

      await streamMessage({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: [{ id: "journal-analysis", role: "user", content: "Günlük yazımı analiz et.", timestamp: new Date().toISOString() }],
        systemPrompt: analysisPrompt,
        customBaseUrl: settings.customBaseUrl || undefined,
        thinkingEnabled: settings.thinkingEnabled,
        thinkingLevel: settings.thinkingLevel,
        abortSignal: new AbortController().signal,
        onThinking: () => {},
        onContent: (chunk) => {
          fullAnalysis += chunk;
          setSelectedEntry((prev) =>
            prev ? { ...prev, ai_analysis: fullAnalysis } : prev,
          );
        },
        onDone: () => {},
        onError: (err) => {
          streamError = err;
        },
        onUsage: (usage) => {
          streamUsage = usage;
        },
      });

      if (streamError) {
        throw streamError;
      }

      // Save analysis to DB
      await updateJournalAnalysis(selectedEntry.id, fullAnalysis);
      await trackUsage(settings.provider, settings.model, "journal_analysis", streamUsage);

      // Update patient notes in background
      const existingNotes = await getPatientNotes();
      const notesPrompt = buildJournalPatientNotesUpdatePrompt(existingNotes, selectedEntry.content);
      takeBackgroundNotes({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: [{ id: "journal-notes", role: "user", content: notesPrompt, timestamp: new Date().toISOString() }],
        systemPrompt: "Sen deneyimli bir klinik psikolog. Hasta notlarını güncelle.",
        customBaseUrl: settings.customBaseUrl || undefined,
        callType: "patient_notes",
      });

      // Refresh data
      const updated = await getJournalEntryById(selectedEntry.id);
      if (updated) setSelectedEntry(updated);
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu. Lütfen API ayarlarını kontrol et.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // ─── Loading ───
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Günlük</h1>
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Yükleniyor...</span>
        </div>
      </div>
    );
  }

  // ─── Write View ───
  if (view === "write") {
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const today = new Date();
    const dateLabel = today.toLocaleDateString("tr-TR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return (
      <div className="flex flex-col h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <button
            onClick={() => { if (editingEntryId) { setEditingEntryId(null); setContent(""); setView("detail"); } else { setView("list"); } }}
            className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri
          </button>
          <span className="text-sm text-[var(--text-muted)] capitalize">{dateLabel}</span>
          <Button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            size="sm"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Kaydediliyor...
              </span>
            ) : (
              "Kaydet"
            )}
          </Button>
        </div>

        {/* Writing area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-10">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bugün neler hissettin, neler yaşadın?"
              autoFocus
              className="w-full bg-transparent text-[var(--text-primary)] text-lg leading-relaxed placeholder:text-[var(--text-muted)]/40 resize-none focus:outline-none"
              style={{ minHeight: "calc(100vh - 180px)" }}
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-[var(--border-color)]">
          <span className="text-xs text-[var(--text-muted)]">
            {wordCount} kelime
          </span>
        </div>
      </div>
    );
  }

  // ─── Detail View ───
  if (view === "detail" && selectedEntry) {
    const isBusy = isAnalyzing;

    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => { if (!isBusy) { setView("list"); setSelectedEntry(null); setError(null); } }}
          disabled={isBusy}
          className={`flex items-center gap-1.5 text-sm transition-colors mb-6 ${isBusy ? "text-[var(--text-muted)] opacity-50 cursor-not-allowed" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
        >
          <ArrowLeft className="w-4 h-4" />
          Geri
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Günlük Detayı</h1>
            <p className="text-sm text-[var(--text-muted)]">
              {new Date(selectedEntry.created_at.includes("T") ? selectedEntry.created_at : selectedEntry.created_at + "Z").toLocaleString("tr-TR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setContent(selectedEntry.content); setEditingEntryId(selectedEntry.id); setView("write"); }}
              disabled={isBusy}
            >
              <Pencil className="w-4 h-4" />
              Düzenle
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (selectedEntry.ai_analysis) {
                  setAnalysisModalOpen(true);
                } else {
                  handleAnalyze();
                }
              }}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analiz ediliyor...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {selectedEntry.ai_analysis ? "Analizi Göster" : "Analiz Et"}
                </span>
              )}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
              disabled={isBusy}
            >
              <Trash2 className="w-4 h-4" />
              Sil
            </Button>
          </div>
        </div>

        {/* Entry content */}
        <Card>
          {(selectedEntry.mood !== null || selectedEntry.tags.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {selectedEntry.mood !== null && (
                <Badge variant="default">Ruh Hali: {selectedEntry.mood}/10</Badge>
              )}
              {selectedEntry.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <p className="text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{selectedEntry.content}</p>
        </Card>

        {/* Analysis modal */}
        <Modal
          isOpen={analysisModalOpen}
          onClose={() => { if (!isBusy) setAnalysisModalOpen(false); }}
          title="AI Analizi"
          className="max-w-2xl max-h-[80vh] flex flex-col"
        >
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            {selectedEntry.ai_analysis ? (
              <div
                className="prose prose-invert prose-sm max-w-none text-[var(--text-primary)] [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-semibold [&_h3]:font-medium [&_strong]:text-[var(--text-primary)] [&_p]:text-[var(--text-secondary)] [&_li]:text-[var(--text-secondary)] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedEntry.ai_analysis}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </Modal>

        {/* Delete confirmation modal */}
        <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Girişi Sil">
          <p className="text-[var(--text-secondary)] mb-6">
            Bu günlük girişini silmek istediğinden emin misin? Bu işlem geri alınamaz.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              İptal
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Evet, Sil
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  // ─── List View (default) ───
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Günlük</h1>
          <p className="text-sm text-[var(--text-muted)]">Düşüncelerini ve duygularını kaydet</p>
        </div>
        <Button onClick={handleNewEntry}>
          <Plus className="w-4 h-4" />
          Yeni Giriş
        </Button>
      </div>

      {entries.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <h2 className="text-lg font-medium mb-2">Henüz günlük girişi yok</h2>
            <p className="text-[var(--text-muted)] mb-6">
              Düşüncelerini, duygularını ve deneyimlerini yazarak kendini daha iyi anlayabilirsin.
            </p>
            <Button onClick={handleNewEntry}>
              <Plus className="w-4 h-4" />
              İlk Girişini Yaz
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className="cursor-pointer hover:border-[var(--text-muted)] transition-colors"
              onClick={() => handleViewEntry(entry.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--text-muted)] mb-1">
                    {formatDate(entry.date)}
                  </p>
                  <p className="text-[var(--text-primary)] line-clamp-2">
                    {entry.content.length > 100
                      ? entry.content.slice(0, 100) + "..."
                      : entry.content}
                  </p>
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {entry.mood !== null && (
                    <Badge variant="default">{entry.mood}/10</Badge>
                  )}
                  {entry.ai_analysis && (
                    <Badge variant="primary" className="shrink-0">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Analiz Edildi
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
