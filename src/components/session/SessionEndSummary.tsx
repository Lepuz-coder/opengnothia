import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loader2, Lightbulb, X } from "lucide-react";
import { useTranslation } from "@/i18n";
import type { ExtractedInsight } from "@/types";

interface SessionEndSummaryProps {
  summaryNarrative: string;
  isSummaryStreaming: boolean;
  onSave: () => void;
  saving?: boolean;
  extractedInsights: ExtractedInsight[];
  isExtractingInsights: boolean;
  insightExtractionError: boolean;
  onRemoveInsight: (id: string) => void;
}

function groupInsightsForDisplay(insights: ExtractedInsight[]) {
  const grouped = new Map<string, {
    key: string;
    name: string;
    emoji: string;
    isNew: boolean;
    insights: ExtractedInsight[];
  }>();

  for (const insight of insights) {
    const key = insight.group_id ?? `new:${insight.new_group?.name}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        name: insight.group_name ?? insight.new_group?.name ?? "",
        emoji: insight.group_emoji ?? insight.new_group?.emoji ?? "💡",
        isNew: !insight.group_id,
        insights: [],
      });
    }
    grouped.get(key)!.insights.push(insight);
  }

  return Array.from(grouped.values());
}

export function SessionEndSummary({
  summaryNarrative,
  isSummaryStreaming,
  onSave,
  saving,
  extractedInsights,
  isExtractingInsights,
  insightExtractionError,
  onRemoveInsight,
}: SessionEndSummaryProps) {
  const { t } = useTranslation();

  // Fake progress state
  const [progress, setProgress] = useState(0);
  const wasExtracting = useRef(false);

  useEffect(() => {
    if (isExtractingInsights) {
      wasExtracting.current = true;
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => prev + (95 - prev) * 0.03);
      }, 500);
      return () => clearInterval(interval);
    } else if (wasExtracting.current) {
      setProgress(100);
      wasExtracting.current = false;
    }
  }, [isExtractingInsights]);

  const stepThresholds = [0, 10, 25, 45, 65, 80];
  let stepIndex = 0;
  for (let i = stepThresholds.length - 1; i >= 0; i--) {
    if (progress >= stepThresholds[i]) { stepIndex = i; break; }
  }

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

      {/* Extracted insights */}
      {(isExtractingInsights || extractedInsights.length > 0 || insightExtractionError) && (
        <Card>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            {t.session.extractedInsights}
          </h3>

          {isExtractingInsights ? (
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-muted)] animate-pulse">
                {t.session.insightSteps[Math.min(stepIndex, t.session.insightSteps.length - 1)]}
              </p>
              <div className="w-full h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] text-right tabular-nums">
                {Math.round(Math.min(progress, 99))}%
              </p>
            </div>
          ) : insightExtractionError ? (
            <p className="text-sm text-[var(--text-muted)]">
              {t.session.insightExtractionError}
            </p>
          ) : (
            <div className="space-y-4">
              {groupInsightsForDisplay(extractedInsights).map((group) => (
                <div key={group.key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{group.emoji}</span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {group.name}
                    </span>
                    {group.isNew && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-400">
                        {t.session.newGroup}
                      </span>
                    )}
                  </div>
                  {group.insights.map((insight) => (
                    <div
                      key={insight.id}
                      className="flex items-start gap-2 pl-7 group"
                    >
                      <p className="flex-1 text-sm text-[var(--text-secondary)] leading-relaxed">
                        {insight.content}
                      </p>
                      <button
                        onClick={() => onRemoveInsight(insight.id)}
                        className="flex-shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
                        title={t.common.delete}
                      >
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Save button */}
      <Button
        onClick={onSave}
        disabled={saving || isSummaryStreaming || isExtractingInsights}
        size="lg"
        className="w-full"
      >
        {saving
          ? t.common.saving
          : isSummaryStreaming
            ? t.session.preparingSummary
            : isExtractingInsights
              ? t.session.extractingInsights
              : t.session.saveAndClose}
      </Button>
    </div>
  );
}
