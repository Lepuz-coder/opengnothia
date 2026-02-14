import { Card } from "@/components/ui/Card";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { SessionSummary } from "@/types";

interface SessionEndSummaryProps {
  summary: SessionSummary;
  moodAfter: number;
  onMoodChange: (mood: number) => void;
  onSave: () => void;
  saving?: boolean;
}

export function SessionEndSummary({ summary, moodAfter, onMoodChange, onSave, saving }: SessionEndSummaryProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6 p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Seans Özeti</h2>
        <p className="text-[var(--text-muted)] mt-1">Bugünkü seansın tamamlandı</p>
      </div>

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
