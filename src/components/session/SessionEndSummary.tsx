import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card } from "@/components/ui/Card";

import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

interface SessionEndSummaryProps {
  summaryNarrative: string;
  isSummaryStreaming: boolean;
  isSummaryParsing: boolean;
  onSave: () => void;
  saving?: boolean;
}

export function SessionEndSummary({
  summaryNarrative,
  isSummaryStreaming,
  isSummaryParsing,
  onSave,
  saving,
}: SessionEndSummaryProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6 p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Seans Tamamlandı</h2>
        <p className="text-[var(--text-muted)] mt-1">
          Psikologunuzdan Öneriler
        </p>
      </div>

      {/* Recommendation card */}
      <Card>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          Psikolog Önerisi
          {(isSummaryStreaming || isSummaryParsing) && (
            <Loader2 className="w-4 h-4 text-accent-400 animate-spin" />
          )}
        </h3>
        {summaryNarrative ? (
          <div className="text-sm text-[var(--text-secondary)] leading-relaxed markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {summaryNarrative}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="space-y-3 animate-pulse">
            <div className="h-3 bg-[var(--bg-tertiary)] rounded w-full" />
            <div className="h-3 bg-[var(--bg-tertiary)] rounded w-5/6" />
            <div className="h-3 bg-[var(--bg-tertiary)] rounded w-4/6" />
          </div>
        )}
      </Card>

      {/* Save button */}
      <Button
        onClick={onSave}
        disabled={saving || isSummaryStreaming || isSummaryParsing}
        size="lg"
        className="w-full"
      >
        {saving ? "Kaydediliyor..." : (isSummaryStreaming || isSummaryParsing) ? "Seans özeti hazırlanıyor..." : "Kaydet ve Kapat"}
      </Button>
    </div>
  );
}
