import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Loader2, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { getSessionById, deleteSession } from "@/services/db/queries";
import type { Session } from "@/types";

interface PastSessionDetailProps {
  sessionId: string;
  onBack: () => void;
}

export function PastSessionDetail({ sessionId, onBack }: PastSessionDetailProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSessionById(sessionId).then((s) => {
      setSession(s);
      setLoading(false);
    });
  }, [sessionId]);

  const handleDelete = async () => {
    setDeleting(true);
    await deleteSession(sessionId);
    setDeleting(false);
    setDeleteConfirmOpen(false);
    onBack();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-muted)]">Seans bulunamadı.</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">
          Geri Dön
        </Button>
      </div>
    );
  }

  const startDate = new Date(session.started_at);
  const endDate = session.ended_at ? new Date(session.ended_at) : null;
  const durationMin = endDate
    ? Math.round((endDate.getTime() - startDate.getTime()) / 60000)
    : null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Geri
        </Button>
        <div className="flex-1">
          <div className="text-sm font-semibold">
            {startDate.toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {" — "}
            {startDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            {durationMin != null && <span>{durationMin} dakika</span>}
            {session.mood_before != null && <span>Ruh hali: {session.mood_before}/10</span>}
            {session.mood_after != null && <span>→ {session.mood_after}/10</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session.summary_narrative && (
            <button
              onClick={() => setSummaryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Seans Özeti
            </button>
          )}
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Seansı Sil
          </button>
        </div>
      </div>

      {/* Messages - read only */}
      <ChatContainer messages={session.messages} isLoading={false} />

      {/* Summary full-screen modal */}
      <Modal
        isOpen={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        title="Seans Özeti"
        className="!max-w-none !w-full !h-full !mx-0 !rounded-none !flex !flex-col"
      >
        <div className="flex-1 overflow-y-auto text-sm text-[var(--text-secondary)] leading-relaxed markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {session.summary_narrative ?? ""}
          </ReactMarkdown>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Seansı Sil">
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Bu seansı silmek istediğine emin misin? Bu işlem geri alınamaz.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>
            Vazgeç
          </Button>
          <Button onClick={handleDelete} disabled={deleting} className="!bg-red-500 hover:!bg-red-600 !border-red-500">
            {deleting ? "Siliniyor..." : "Sil"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
