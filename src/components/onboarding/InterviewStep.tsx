import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { cn } from "@/lib/cn";

interface InterviewStepProps {
  onNext: (data: { goals: string[]; approach: string; sessionTime: string }) => void;
  onBack: () => void;
}

const goalOptions = [
  "Stres ve kaygı yönetimi",
  "Kendini daha iyi tanıma",
  "İlişki sorunları",
  "Özsaygı ve özgüven",
  "Yas ve kayıp",
  "İş/okul stresi",
  "Uyku sorunları",
  "Motivasyon eksikliği",
  "Duygu düzenleme",
  "Genel destek",
];

const approachOptions = [
  { id: "practical", label: "Pratik", desc: "Somut teknikler ve egzersizler" },
  { id: "depth", label: "Derinlik", desc: "Bilinçaltı keşif ve analiz" },
  { id: "balanced", label: "Dengeli", desc: "İkisinin dengeli karışımı" },
];

export function InterviewStep({ onNext, onBack }: InterviewStepProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const { approach, setApproach, preferredSessionTime, setPreferredSessionTime } = useSettingsStore();

  function toggleGoal(goal: string) {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Seni Tanıyalım</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Deneyimini kişiselleştirmek için birkaç soru.
        </p>
      </div>

      {/* Goals */}
      <div>
        <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">
          Seni buraya ne getirdi? (birden fazla seçebilirsin)
        </p>
        <div className="flex flex-wrap gap-2">
          {goalOptions.map((goal) => (
            <Badge
              key={goal}
              selected={selectedGoals.includes(goal)}
              onClick={() => toggleGoal(goal)}
            >
              {goal}
            </Badge>
          ))}
        </div>
      </div>

      {/* Approach */}
      <div>
        <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">
          Yaklaşım tercihin
        </p>
        <div className="grid grid-cols-3 gap-2">
          {approachOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setApproach(opt.id as any)}
              className={cn(
                "p-3 rounded-xl border text-center transition-all duration-200",
                approach === opt.id
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-[var(--border-color)] hover:border-primary-300"
              )}
            >
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Session time */}
      <div>
        <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">
          Tercih ettiğin seans saati
        </p>
        <input
          type="time"
          value={preferredSessionTime}
          onChange={(e) => setPreferredSessionTime(e.target.value)}
          className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="ghost" onClick={onBack} className="flex-1">
          Geri
        </Button>
        <Button
          onClick={() => onNext({ goals: selectedGoals, approach, sessionTime: preferredSessionTime })}
          disabled={selectedGoals.length === 0}
          className="flex-1"
        >
          Devam
        </Button>
      </div>
    </div>
  );
}
