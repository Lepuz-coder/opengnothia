import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card } from "@/components/ui/Card";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

interface SessionEndSummaryProps {
  summaryNarrative: string;
  isSummaryStreaming: boolean;
  isSummaryParsing: boolean;
  moodAfter: number;
  onMoodChange: (mood: number) => void;
  onSave: () => void;
  saving?: boolean;
}

export function SessionEndSummary({
  summaryNarrative,
  isSummaryStreaming,
  isSummaryParsing,
  moodAfter,
  onMoodChange,
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

      {/* Background processing indicator */}
      {isSummaryParsing && (
        <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Seans notları kaydediliyor...
        </div>
      )}

      {/* Mood slider - show after streaming is done */}
      {!isSummaryStreaming && (
        <Card>
          <Slider
            label="Şu anki ruh halin"
            value={moodAfter}
            onChange={onMoodChange}
            min={1}
            max={10}
          />
        </Card>
      )}

      {/* Save button */}
      <Button
        onClick={onSave}
        disabled={saving || isSummaryStreaming || isSummaryParsing}
        size="lg"
        className="w-full"
      >
        {saving ? "Kaydediliyor..." : isSummaryStreaming ? "Öneri hazırlanıyor..." : isSummaryParsing ? "Seans notları kaydediliyor..." : "Kaydet ve Kapat"}
      </Button>
    </div>
  );
}
