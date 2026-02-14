import { Card } from "@/components/ui/Card";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loader2 } from "lucide-react";
import type { SessionSummary } from "@/types";

interface SessionEndSummaryProps {
  summaryNarrative: string;
  isSummaryStreaming: boolean;
  isSummaryParsing: boolean;
  summary: SessionSummary | null;
  moodAfter: number;
  onMoodChange: (mood: number) => void;
  onSave: () => void;
  saving?: boolean;
}

export function SessionEndSummary({
  summaryNarrative,
  isSummaryStreaming,
  isSummaryParsing,
  summary,
  moodAfter,
  onMoodChange,
  onSave,
  saving,
}: SessionEndSummaryProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6 p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Seans Özeti</h2>
        <p className="text-[var(--text-muted)] mt-1">
          {isSummaryStreaming ? "Seans analiz ediliyor..." : "Bugünkü seansın tamamlandı"}
        </p>
      </div>

      {/* Streaming narrative section */}
      <Card>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          Seans Değerlendirmesi
          {isSummaryStreaming && (
            <Loader2 className="w-4 h-4 text-accent-400 animate-spin" />
          )}
        </h3>
        {summaryNarrative ? (
          <div className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
            {summaryNarrative}
            {isSummaryStreaming && (
              <span className="inline-block w-1.5 h-3.5 bg-[var(--text-primary)] ml-0.5 animate-pulse" />
            )}
          </div>
        ) : (
          <div className="space-y-3 animate-pulse">
            <div className="h-3 bg-[var(--bg-tertiary)] rounded w-full" />
            <div className="h-3 bg-[var(--bg-tertiary)] rounded w-5/6" />
            <div className="h-3 bg-[var(--bg-tertiary)] rounded w-4/6" />
            <div className="h-3 bg-[var(--bg-tertiary)] rounded w-full" />
            <div className="h-3 bg-[var(--bg-tertiary)] rounded w-3/6" />
          </div>
        )}
      </Card>

      {/* Skeleton while structured data is being parsed */}
      {isSummaryParsing && (
        <div className="space-y-4 animate-pulse">
          <Card>
            <div className="h-4 bg-[var(--bg-tertiary)] rounded w-24 mb-3" />
            <div className="flex gap-2">
              <div className="h-6 bg-[var(--bg-tertiary)] rounded-full w-20" />
              <div className="h-6 bg-[var(--bg-tertiary)] rounded-full w-28" />
              <div className="h-6 bg-[var(--bg-tertiary)] rounded-full w-16" />
            </div>
          </Card>
          <Card>
            <div className="h-4 bg-[var(--bg-tertiary)] rounded w-20 mb-3" />
            <div className="space-y-2">
              <div className="h-3 bg-[var(--bg-tertiary)] rounded w-full" />
              <div className="h-3 bg-[var(--bg-tertiary)] rounded w-4/5" />
            </div>
          </Card>
        </div>
      )}

      {/* Structured data cards */}
      {summary && !isSummaryParsing && (
        <>
          {summary.themes.length > 0 && (
            <Card>
              <h3 className="font-semibold mb-2">Temalar</h3>
              <div className="flex flex-wrap gap-2">
                {summary.themes.map((t) => (
                  <Badge key={t} variant="primary">{t}</Badge>
                ))}
              </div>
            </Card>
          )}

          {summary.insights.length > 0 && (
            <Card>
              <h3 className="font-semibold mb-2">İçgörüler</h3>
              <ul className="space-y-1">
                {summary.insights.map((i) => (
                  <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                    <span className="text-primary-500 mt-1">-</span> {i}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {summary.defenses.length > 0 && (
            <Card>
              <h3 className="font-semibold mb-2">Savunma Mekanizmaları</h3>
              <div className="flex flex-wrap gap-2">
                {summary.defenses.map((d) => (
                  <Badge key={d} variant="warning">{d}</Badge>
                ))}
              </div>
            </Card>
          )}

          {summary.homework.length > 0 && (
            <Card>
              <h3 className="font-semibold mb-2">Ödev</h3>
              <ul className="space-y-1">
                {summary.homework.map((h) => (
                  <li key={h} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                    <span className="text-accent-500 mt-1">-</span> {h}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
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
        {saving ? "Kaydediliyor..." : isSummaryStreaming ? "Analiz ediliyor..." : isSummaryParsing ? "Özet hazırlanıyor..." : "Kaydet ve Kapat"}
      </Button>
    </div>
  );
}
