import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { getSessionById } from "@/services/db/queries";
import type { Session } from "@/types";

interface PastSessionDetailProps {
  sessionId: string;
  onBack: () => void;
}

export function PastSessionDetail({ sessionId, onBack }: PastSessionDetailProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSessionById(sessionId).then((s) => {
      setSession(s);
      setLoading(false);
    });
  }, [sessionId]);

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
      </div>

      {/* Messages - read only */}
      <ChatContainer messages={session.messages} isLoading={false} />

      {/* Summary */}
      {session.summary && (
        <div className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 space-y-3 overflow-y-auto max-h-64">
          {session.summary.themes.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-[var(--text-muted)]">Temalar</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {session.summary.themes.map((t) => (
                  <Badge key={t} variant="primary">{t}</Badge>
                ))}
              </div>
            </div>
          )}
          {session.summary.insights.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-[var(--text-muted)]">İçgörüler</span>
              <ul className="mt-1 space-y-0.5">
                {session.summary.insights.map((i) => (
                  <li key={i} className="text-sm text-[var(--text-secondary)]">- {i}</li>
                ))}
              </ul>
            </div>
          )}
          {session.summary.homework.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-[var(--text-muted)]">Ödev</span>
              <ul className="mt-1 space-y-0.5">
                {session.summary.homework.map((h) => (
                  <li key={h} className="text-sm text-[var(--text-secondary)]">- {h}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
