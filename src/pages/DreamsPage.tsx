import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useAppStore } from "@/stores/useAppStore";
import { streamMessage } from "@/services/ai/aiService";
import { calculateCost } from "@/services/ai/costCalculator";
import { buildDreamAnalysisPrompt, buildPatientNotesUpdatePrompt } from "@/services/ai/promptBuilder";
import { takeBackgroundNotes } from "@/services/ai/backgroundNotes";
import {
  getDreams,
  getDreamById,
  saveDream,
  updateDreamAnalysis,
  updateDreamContent,
  deleteDream,
  getPatientNotes,
  saveTokenUsage,
} from "@/services/db/queries";
import { Moon, Plus, ArrowLeft, Sparkles, Trash2, Loader2, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Dream, AIProvider, TokenUsage } from "@/types";

type View = "list" | "new" | "detail";

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

export default function DreamsPage() {
  const settings = useSettingsStore();
  const setSidebarHidden = useAppStore((s) => s.setSidebarHidden);

  const [view, setView] = useState<View>("list");
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [editingDreamId, setEditingDreamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hide sidebar in new dream view
  useEffect(() => {
    if (view === "new") {
      setSidebarHidden(true);
    } else {
      setSidebarHidden(false);
    }
    return () => setSidebarHidden(false);
  }, [view, setSidebarHidden]);

  const loadDreams = useCallback(async () => {
    const data = await getDreams();
    setDreams(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDreams();
  }, [loadDreams]);

  const handleSave = async () => {
    if (!newContent.trim()) return;
    setSaving(true);
    try {
      if (editingDreamId) {
        await updateDreamContent(editingDreamId, newContent.trim());
        const updated = await getDreamById(editingDreamId);
        if (updated) setSelectedDream(updated);
        setEditingDreamId(null);
      } else {
        const id = await saveDream(newContent.trim());
        const dream = await getDreamById(id);
        if (dream) setSelectedDream(dream);
      }
      setNewContent("");
      setView("detail");
      await loadDreams();
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedDream) return;
    setAnalyzing(true);
    setError(null);
    setAnalysisModalOpen(true);

    try {
      const patientNotes = await getPatientNotes();

      // 1. Dream analysis (streaming)
      const analysisPrompt = buildDreamAnalysisPrompt(patientNotes);
      let fullAnalysis = "";
      let streamUsage: TokenUsage | null = null;
      let streamError: Error | null = null;

      await streamMessage({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: [
          {
            id: crypto.randomUUID(),
            role: "user",
            content: selectedDream.content,
            timestamp: new Date().toISOString(),
          },
        ],
        systemPrompt: analysisPrompt,
        customBaseUrl: settings.customBaseUrl || undefined,
        thinkingEnabled: false,
        onThinking: () => {},
        onContent: (chunk) => {
          fullAnalysis += chunk;
          setSelectedDream((prev) =>
            prev ? { ...prev, analysis: fullAnalysis } : null,
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
      await updateDreamAnalysis(selectedDream.id, fullAnalysis);
      await trackUsage(settings.provider, settings.model, "dream_analysis", streamUsage);

      // 2. Update patient notes in background
      const notesPrompt = buildPatientNotesUpdatePrompt(patientNotes);
      takeBackgroundNotes({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: [
          {
            id: crypto.randomUUID(),
            role: "user",
            content: `Danışan şu rüyayı paylaştı: ${selectedDream.content}\n\nRüya analizi: ${fullAnalysis}`,
            timestamp: new Date().toISOString(),
          },
        ],
        systemPrompt: notesPrompt,
        customBaseUrl: settings.customBaseUrl || undefined,
        callType: "patient_notes",
      });

      // Refresh dream data
      const updated = await getDreamById(selectedDream.id);
      if (updated) setSelectedDream(updated);
      await loadDreams();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu. Lütfen API ayarlarını kontrol et.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDream) return;
    await deleteDream(selectedDream.id);
    setSelectedDream(null);
    setDeleteConfirmOpen(false);
    setView("list");
    await loadDreams();
  };

  const openDetail = async (dream: Dream) => {
    const full = await getDreamById(dream.id);
    if (full) {
      setSelectedDream(full);
      setError(null);
      setView("detail");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Rüyalar</h1>
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Yükleniyor...</span>
        </div>
      </div>
    );
  }

  // New dream view (fullscreen)
  if (view === "new") {
    const wordCount = newContent.trim() ? newContent.trim().split(/\s+/).length : 0;
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
            onClick={() => { if (editingDreamId) { setEditingDreamId(null); setNewContent(""); setView("detail"); } else { setView("list"); } }}
            className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri
          </button>
          <span className="text-sm text-[var(--text-muted)] capitalize">{dateLabel}</span>
          <Button
            onClick={handleSave}
            disabled={!newContent.trim() || saving}
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
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Rüyanda neler gördün..."
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

  // Detail view
  if (view === "detail" && selectedDream) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => { if (!analyzing) { setView("list"); setSelectedDream(null); setError(null); } }}
          disabled={analyzing}
          className={`flex items-center gap-1.5 text-sm transition-colors mb-6 ${analyzing ? "text-[var(--text-muted)] opacity-50 cursor-not-allowed" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
        >
          <ArrowLeft className="w-4 h-4" />
          Geri
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Rüya Detayı</h1>
            <p className="text-sm text-[var(--text-muted)]">
              {new Date(selectedDream.created_at + "Z").toLocaleString("tr-TR", {
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
              onClick={() => { setNewContent(selectedDream.content); setEditingDreamId(selectedDream.id); setView("new"); }}
              disabled={analyzing}
            >
              <Pencil className="w-4 h-4" />
              Düzenle
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (selectedDream.analysis) {
                  setAnalysisModalOpen(true);
                } else {
                  handleAnalyze();
                }
              }}
              disabled={analyzing}
            >
              {analyzing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analiz ediliyor...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {selectedDream.analysis ? "Analizi Göster" : "Analiz Et"}
                </span>
              )}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={analyzing}
            >
              <Trash2 className="w-4 h-4" />
              Sil
            </Button>
          </div>
        </div>

        {/* Dream content */}
        <Card>
          <p className="text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{selectedDream.content}</p>
        </Card>

        {/* Analysis modal */}
        <Modal
          isOpen={analysisModalOpen}
          onClose={() => { if (!analyzing) setAnalysisModalOpen(false); }}
          title="AI Analizi"
          className="max-w-2xl max-h-[80vh] flex flex-col"
        >
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            {selectedDream.analysis ? (
              <div
                className="prose prose-invert prose-sm max-w-none text-[var(--text-primary)] [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-semibold [&_h3]:font-medium [&_strong]:text-[var(--text-primary)] [&_p]:text-[var(--text-secondary)] [&_li]:text-[var(--text-secondary)] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedDream.analysis}
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
        <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Rüyayı Sil">
          <p className="text-[var(--text-secondary)] mb-6">
            Bu rüyayı silmek istediğinden emin misin? Bu işlem geri alınamaz.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>
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

  // List view (default)
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Rüyalar</h1>
          <p className="text-sm text-[var(--text-muted)]">Rüya günlüğün</p>
        </div>
        <Button onClick={() => setView("new")}>
          <Plus className="w-4 h-4" />
          Yeni Rüya
        </Button>
      </div>

      {dreams.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Moon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <h2 className="text-lg font-medium mb-2">Henüz rüya kaydın yok</h2>
            <p className="text-[var(--text-muted)] mb-6">
              Rüyalarını kaydet ve AI destekli analizlerle iç dünyanı keşfet.
            </p>
            <Button onClick={() => setView("new")}>
              <Plus className="w-4 h-4" />
              İlk Rüyanı Kaydet
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {dreams.map((dream) => (
            <Card
              key={dream.id}
              className="cursor-pointer hover:border-[var(--text-muted)] transition-colors"
              onClick={() => openDetail(dream)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--text-muted)] mb-1">
                    {new Date(dream.created_at + "Z").toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-[var(--text-primary)] line-clamp-2">
                    {dream.content.length > 100
                      ? dream.content.slice(0, 100) + "..."
                      : dream.content}
                  </p>
                </div>
                {dream.analysis && (
                  <Badge variant="primary" className="shrink-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Analiz Edildi
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}