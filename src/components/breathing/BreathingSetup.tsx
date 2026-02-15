import { Wind } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import {
  breathingTechniques,
  durationOptions,
} from "@/constants/breathingTechniques";

interface BreathingSetupProps {
  selectedTechniqueId: string;
  onSelectTechnique: (id: string) => void;
  selectedDuration: string;
  onSelectDuration: (value: string) => void;
  onStart: () => void;
}

export function BreathingSetup({
  selectedTechniqueId,
  onSelectTechnique,
  selectedDuration,
  onSelectDuration,
  onStart,
}: BreathingSetupProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-900/30 flex items-center justify-center">
          <Wind className="w-5 h-5 text-primary-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Nefes Egzersizi
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Bir teknik ve süre seçerek egzersize başlayın
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
          Teknik Seçin
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {breathingTechniques.map((technique) => {
            const isSelected = technique.id === selectedTechniqueId;
            return (
              <button
                key={technique.id}
                onClick={() => onSelectTechnique(technique.id)}
                className="text-left"
              >
                <Card
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "border-primary-500 bg-primary-500/10"
                      : "hover:border-[var(--text-muted)]"
                  }`}
                  padding="sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-[var(--text-primary)]">
                        {technique.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        {technique.phases.map((phase, i) => (
                          <span key={i} className="text-xs text-primary-400 font-mono">
                            {i > 0 && "-"}
                            {phase.duration}s
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      {technique.description}
                    </p>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-xs">
        <Select
          label="Süre"
          options={durationOptions}
          value={selectedDuration}
          onChange={(e) => onSelectDuration(e.target.value)}
        />
      </div>

      <Button size="lg" className="w-full" onClick={onStart}>
        Egzersizi Başlat
      </Button>
    </div>
  );
}
