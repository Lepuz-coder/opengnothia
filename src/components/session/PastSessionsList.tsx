import { useEffect, useState } from "react";
import { Clock, Calendar, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getCompletedSessions, deleteSession } from "@/services/db/queries";
import type { Session } from "@/types";

interface PastSessionsListProps {
  onViewSession: (sessionId: string) => void;
}

export function PastSessionsList({ onViewSession }: PastSessionsListProps) {
  const [sessions, setSessions] = useState<Omit<Session, "messages">[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getCompletedSessions().then(setSessions);
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteSession(deleteTarget);
    setSessions((prev) => prev.filter((s) => s.id !== deleteTarget));
    setDeleteTarget(null);
    setDeleting(false);
  };

  if (sessions.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3">Geçmiş Seanslar</h3>
      <div className="space-y-2">
        {sessions.map((s) => {
          const startDate = new Date(s.started_at);
          const endDate = s.ended_at ? new Date(s.ended_at) : null;
          const durationMin = endDate
            ? Math.round((endDate.getTime() - startDate.getTime()) / 60000)
            : null;

          return (
            <div
              key={s.id}
              className="flex items-center gap-2"
            >
              <button
                onClick={() => onViewSession(s.id)}
                className="flex-1 text-left p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--text-muted)] transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Calendar className="w-3.5 h-3.5" />
                    {startDate.toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  {durationMin != null && (
                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Clock className="w-3 h-3" />
                      {durationMin} dk
                    </div>
                  )}
                </div>
                {s.summary && s.summary.themes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {s.summary.themes.map((t) => (
                      <Badge key={t} variant="primary">{t}</Badge>
                    ))}
                  </div>
                )}
              </button>
              <button
                onClick={() => setDeleteTarget(s.id)}
                className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-red-400 hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-all duration-200"
                title="Seansı sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <Modal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Seansı Sil">
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Bu seansı silmek istediğine emin misin? Bu işlem geri alınamaz.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
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
