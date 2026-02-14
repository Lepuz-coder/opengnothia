import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSettingsStore } from "@/stores/useSettingsStore";

interface ReadyStepProps {
  onComplete: () => void;
}

export function ReadyStep({ onComplete }: ReadyStepProps) {
  const { preferredSessionTime } = useSettingsStore();

  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-white" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Her şey hazır!</h2>
        <p className="text-[var(--text-secondary)] mt-2">
          Seni her gün <span className="font-semibold text-primary-400">{preferredSessionTime}</span>'de bekliyorum.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-primary-900/20 text-sm text-[var(--text-secondary)]">
        <p>
          Unutma, ben bir profesyonel terapist değilim. Ciddi psikolojik sorunlarda mutlaka bir uzmana başvur. Ben sana günlük destek ve farkındalık konusunda yardımcı olabilirim.
        </p>
      </div>

      <Button onClick={onComplete} size="lg" className="w-full">
        Başlayalım
      </Button>
    </div>
  );
}
