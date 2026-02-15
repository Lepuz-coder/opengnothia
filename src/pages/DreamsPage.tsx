import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { sendMessage, streamMessage } from "@/services/ai/aiService";
import { calculateCost } from "@/services/ai/costCalculator";
import { buildDreamAnalysisPrompt, buildPatientNotesUpdatePrompt } from "@/services/ai/promptBuilder";
import {
  getDreams,
  getDreamById,
  saveDream,
  updateDreamAnalysis,
  deleteDream,
  getPatientNotes,
  upsertPatientNotes,
  saveTokenUsage,
} from "@/services/db/queries";
import { Moon, Plus, ArrowLeft, Sparkles, Trash2, Loader2 } from "lucide-react";
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

  const [view, setView] = useState<View>("list");
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const id = await saveDream(newContent.trim());
      const dream = await getDreamById(id);
      if (dream) {
        setSelectedDream(dream);
        setView("detail");
      }
      setNewContent("");
      await loadDreams();
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedDream) return;
    setAnalyzing(true);
    setError(null);

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

      // 2. Update patient notes with dream info
      const existingNotes = patientNotes;
      const notesPrompt = buildPatientNotesUpdatePrompt(existingNotes);
      const notesResult = await sendMessage({
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
      });

      await trackUsage(settings.provider, settings.model, "patient_notes", notesResult.usage);

      if (notesResult.content && notesResult.content.trim().length > 0) {
        await upsertPatientNotes(notesResult.content.trim());
      }

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

  // New dream view
  if (view === "new") {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri
        </button>

        <h1 className="text-2xl font-bold mb-6">Yeni Rüya</h1>

        <Card>
          <label className="block text-sm font-medium mb-2">Rüyanı anlat</label>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Rüyanda neler gördün..."
            rows={8}
            className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleSave}
              disabled={!newContent.trim() || saving}
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
        </Card>
      </div>
    );
  }

  // Detail view
  if (view === "detail" && selectedDream) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => { setView("list"); setSelectedDream(null); setError(null); }}
          className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
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
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="w-4 h-4" />
            Sil
          </Button>
        </div>

        {/* Dream content */}
        <Card className="mb-4">
          <h2 className="text-sm font-medium text-[var(--text-muted)] mb-2">Rüya İçeriği</h2>
          <p className="text-[var(--text-primary)] whitespace-pre-wrap">{selectedDream.content}</p>
        </Card>

        {/* Analysis section */}
        {selectedDream.analysis ? (
          <Card>
            <div className="flex items-center gap-2 mb-3">
              {analyzing ? (
                <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-primary-400" />
              )}
              <h2 className="text-sm font-medium text-[var(--text-muted)]">AI Analizi</h2>
            </div>
            <div
              className="prose prose-invert prose-sm max-w-none text-[var(--text-primary)] [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-semibold [&_h3]:font-medium [&_strong]:text-[var(--text-primary)] [&_p]:text-[var(--text-secondary)] [&_li]:text-[var(--text-secondary)] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedDream.analysis) }}
            />
          </Card>
        ) : (
          <Card>
            <div className="text-center py-4">
              <p className="text-[var(--text-muted)] mb-4">
                Bu rüya henüz analiz edilmedi.
              </p>
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
              <Button onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analiz ediliyor...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Analiz Et
                  </span>
                )}
              </Button>
            </div>
          </Card>
        )}

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

/** Simple markdown to HTML renderer for dream analysis */
function renderMarkdown(text: string): string {
  let html = text
    // Escape HTML first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headers
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Unordered lists
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    // Paragraphs: split by double newline
    .replace(/\n\n/g, "</p><p>")
    // Single newlines within paragraphs
    .replace(/\n/g, "<br>");

  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/(<li>.*?<\/li>(?:<br>)?)+/g, (match) => {
    const cleaned = match.replace(/<br>/g, "");
    return `<ul>${cleaned}</ul>`;
  });

  return `<p>${html}</p>`;
}
