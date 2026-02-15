import { Card } from "@/components/ui/Card";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Coins } from "lucide-react";
import type { SessionSummary } from "@/types";

interface SessionEndSummaryProps {
  summary: SessionSummary;
  moodAfter: number;
  onMoodChange: (mood: number) => void;
  onSave: () => void;
  saving?: boolean;
  totalInputTokens?: number;
  totalOutputTokens?: number;
  totalCost?: number;
  modelUsed?: string | null;
}

function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
  return tokens.toString();
}

export function SessionEndSummary({ summary, moodAfter, onMoodChange, onSave, saving, totalInputTokens, totalOutputTokens, totalCost, modelUsed }: SessionEndSummaryProps) {
  const hasCostData = (totalInputTokens ?? 0) > 0 || (totalOutputTokens ?? 0) > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Seans Özeti</h2>
        <p className="text-[var(--text-muted)] mt-1">Bugünkü seansın tamamlandı</p>
      </div>

      {hasCostData && (
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Seans Harcaması</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {formatCost(totalCost ?? 0)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Toplam maliyet</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-[var(--text-secondary)]">
                    <span className="text-[var(--text-muted)]">Giriş:</span> {formatTokens(totalInputTokens ?? 0)} token
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    <span className="text-[var(--text-muted)]">Çıkış:</span> {formatTokens(totalOutputTokens ?? 0)} token
                  </p>
                  {modelUsed && (
                    <p className="text-xs text-[var(--text-muted)]">
                      Model: {modelUsed}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

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

      <Card>
        <Slider
          label="Şu anki ruh halin"
          value={moodAfter}
          onChange={onMoodChange}
          min={1}
          max={10}
        />
      </Card>

      <Button onClick={onSave} disabled={saving} size="lg" className="w-full">
        {saving ? "Kaydediliyor..." : "Kaydet ve Kapat"}
      </Button>
    </div>
  );
}
