import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n";

interface SessionEndSummaryProps {
  summaryNarrative: string;
  isSummaryStreaming: boolean;
  onSave: () => void;
  saving?: boolean;
}

export function SessionEndSummary({
  summaryNarrative,
  isSummaryStreaming,
  onSave,
  saving,
}: SessionEndSummaryProps) {
  const { t } = useTranslation();
  return (
    <div className="max-w-2xl mx-auto space-y-6 p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{t.session.sessionCompleted}</h2>
        <p className="text-[var(--text-muted)] mt-1">
          {t.session.sessionSummary}
        </p>
      </div>

      {/* Summary card */}
      <Card>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          {t.session.sessionSummary}
          {isSummaryStreaming && (
            <Loader2 className="w-4 h-4 text-accent-400 animate-spin" />
          )}
        </h3>
        {summaryNarrative ? (
          <div className="text-sm text-[var(--text-secondary)] leading-relaxed markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {summaryNarrative}
            </ReactMarkdown>
            {isSummaryStreaming && (
              <span className="inline-block w-1.5 h-3.5 bg-[var(--text-primary)] ml-0.5 animate-pulse" />
            )}
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
        disabled={saving || isSummaryStreaming}
        size="lg"
        className="w-full"
      >
        {saving ? t.common.saving : isSummaryStreaming ? t.session.preparingSummary : t.session.saveAndClose}
      </Button>
    </div>
  );
}
