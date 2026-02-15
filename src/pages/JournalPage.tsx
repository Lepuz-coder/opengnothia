import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { streamMessage, sendMessage } from "@/services/ai/aiService";
import { calculateCost } from "@/services/ai/costCalculator";
import { buildJournalAnalysisPrompt, buildJournalPatientNotesUpdatePrompt } from "@/services/ai/promptBuilder";
import {
  createJournalEntry,
  getJournalEntries,
  getJournalEntryById,
  updateJournalAnalysis,
  deleteJournalEntry,
  getUserProfile,
  getPatientNotes,
  upsertPatientNotes,
  saveTokenUsage,
} from "@/services/db/queries";
import { BookOpen, Plus, ArrowLeft, Trash2, Sparkles, Loader2, X } from "lucide-react";
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

  // View state
  const [view, setView] = useState<View>("list");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);

  // Write form state
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Analysis state
  const [analysisStream, setAnalysisStream] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Delete state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load entries
  const loadEntries = useCallback(async () => {
    setLoading(true);
    const data = await getJournalEntries(50);
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.max(200, textareaRef.current.scrollHeight) + "px";
    }
  }, [content]);

  // Navigate to write view
  const handleNewEntry = () => {
    setContent("");
    setMood(null);
    setTags([]);
    setTagInput("");
    setView("write");
  };

  // Save entry
  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    const entry = await createJournalEntry({
      content: content.trim(),
      mood,
      tags,
    });
    setSaving(false);
    setSelectedEntry(entry);
    setView("detail");
    loadEntries();
  };

  // View detail
  const handleViewEntry = async (id: string) => {
    const entry = await getJournalEntryById(id);
    if (entry) {
      setSelectedEntry(entry);
      setAnalysisStream("");
      setView("detail");
    }
  };

  // Delete entry
  const handleDelete = async () => {
    if (!selectedEntry) return;
    await deleteJournalEntry(selectedEntry.id);
    setDeleteModalOpen(false);
    setSelectedEntry(null);
    setView("list");
    loadEntries();
  };

  // Add tag
  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  // AI Analysis
  const handleAnalyze = async () => {
    if (!selectedEntry || isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisStream("");

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
          setAnalysisStream((prev) => prev + chunk);
        },
        onDone: async () => {
          // Save analysis to DB
          await updateJournalAnalysis(selectedEntry.id, fullAnalysis);
          setSelectedEntry((prev) => prev ? { ...prev, ai_analysis: fullAnalysis } : prev);
          setIsAnalyzing(false);

          // Update entries list
          loadEntries();

          // Background: update patient notes silently
          try {
            const existingNotes = await getPatientNotes();
            const notesPrompt = buildJournalPatientNotesUpdatePrompt(existingNotes, selectedEntry.content);

            const notesResult = await sendMessage({
              provider: settings.provider,
              apiKey: settings.apiKey,
              model: settings.model,
              messages: [{ id: "journal-notes", role: "user", content: notesPrompt, timestamp: new Date().toISOString() }],
              systemPrompt: "Sen deneyimli bir klinik psikolog. Hasta notlarını güncelle.",
              customBaseUrl: settings.customBaseUrl || undefined,
            });

            if (notesResult.content && notesResult.content.trim().length > 0) {
              await upsertPatientNotes(notesResult.content.trim());
            }
            trackUsage(settings.provider, settings.model, "patient_notes", notesResult.usage);
          } catch {
            // Silent failure for background notes update
          }
        },
        onUsage: (usage) => {
          trackUsage(settings.provider, settings.model, "journal_analysis", usage);
        },
        onError: (error) => {
          setAnalysisStream(`Bir hata oluştu: ${error.message}`);
          setIsAnalyzing(false);
        },
      });
    } catch (err) {
      setAnalysisStream(`Bir hata oluştu: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`);
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

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr.includes("T") ? dateStr : dateStr + "Z");
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ─── List View ───
  if (view === "list") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold">Günlük</h2>
            <p className="text-sm text-[var(--text-muted)]">Düşüncelerini ve duygularını kaydet</p>
          </div>
          <Button onClick={handleNewEntry} size="lg">
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Yeni Giriş
            </span>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Yükleniyor...</span>
          </div>
        ) : entries.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="w-12 h-12 text-[var(--text-muted)] mb-4" />
              <h3 className="font-medium mb-2">Henüz günlük girişi yok</h3>
              <p className="text-sm text-[var(--text-muted)] max-w-sm">
                Düşüncelerini, duygularını ve deneyimlerini yazarak kendini daha iyi anlayabilirsin.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <Card key={entry.id}>
                <button
                  onClick={() => handleViewEntry(entry.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-[var(--text-muted)]">
                      {formatDate(entry.date)}
                    </span>
                    {entry.mood !== null && (
                      <Badge variant="default">{entry.mood}/10</Badge>
                    )}
                    {entry.ai_analysis && (
                      <Badge variant="primary">Analiz</Badge>
                    )}
                  </div>
                  <p className="text-[var(--text-primary)] line-clamp-2">
                    {entry.content}
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
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Write View ───
  if (view === "write") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setView("list")}
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold">Yeni Günlük Girişi</h2>
        </div>

        <div className="space-y-6">
          {/* Content textarea */}
          <div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bugün neler hissettin, neler yaşadın?"
              className="w-full min-h-[200px] p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
            />
          </div>

          {/* Mood slider */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Ruh Hali {mood !== null ? `(${mood}/10)` : "(isteğe bağlı)"}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={10}
                value={mood ?? 5}
                onChange={(e) => setMood(Number(e.target.value))}
                className="flex-1 accent-[var(--primary-500)]"
              />
              {mood !== null && (
                <button
                  onClick={() => setMood(null)}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  Temizle
                </button>
              )}
              {mood === null && (
                <button
                  onClick={() => setMood(5)}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  Ekle
                </button>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">Etiketler</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                >
                  {tag}
                  <button
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="hover:text-[var(--text-primary)] transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Etiket ekle..."
                className="flex-1 px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
              <Button variant="secondary" size="sm" onClick={handleAddTag} disabled={!tagInput.trim()}>
                Ekle
              </Button>
            </div>
          </div>

          {/* Save button */}
          <Button
            onClick={handleSave}
            size="lg"
            className="w-full"
            disabled={!content.trim() || saving}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Kaydediliyor...
              </span>
            ) : (
              "Kaydet"
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ─── Detail View ───
  if (view === "detail" && selectedEntry) {
    const hasAnalysis = selectedEntry.ai_analysis && selectedEntry.ai_analysis.trim().length > 0;
    const showStreamingAnalysis = isAnalyzing || analysisStream.length > 0;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setView("list"); setAnalysisStream(""); }}
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold">Günlük Girişi</h2>
              <p className="text-sm text-[var(--text-muted)]">{formatDateTime(selectedEntry.created_at)}</p>
            </div>
          </div>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Entry content */}
        <Card>
          <div className="space-y-4">
            {/* Mood & Tags */}
            {(selectedEntry.mood !== null || selectedEntry.tags.length > 0) && (
              <div className="flex flex-wrap items-center gap-2">
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

            {/* Content */}
            <div className="whitespace-pre-wrap text-[var(--text-primary)] leading-relaxed">
              {selectedEntry.content}
            </div>
          </div>
        </Card>

        {/* AI Analysis section */}
        <div className="mt-6">
          {!hasAnalysis && !showStreamingAnalysis && (
            <Button onClick={handleAnalyze} variant="secondary" className="w-full">
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Analiz
              </span>
            </Button>
          )}

          {showStreamingAnalysis && !hasAnalysis && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary-500" />
                <h3 className="font-medium">AI Analiz</h3>
                {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />}
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-[var(--text-secondary)]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {analysisStream}
                </ReactMarkdown>
              </div>
            </Card>
          )}

          {hasAnalysis && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary-500" />
                <h3 className="font-medium">AI Analiz</h3>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-[var(--text-secondary)]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedEntry.ai_analysis!}
                </ReactMarkdown>
              </div>
            </Card>
          )}
        </div>

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

  return null;
}
