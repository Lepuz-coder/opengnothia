import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTranslation } from "@/i18n";

interface ReadyStepProps {
  onComplete: () => void;
}

export function ReadyStep({ onComplete }: ReadyStepProps) {
  const { preferredSessionTime } = useSettingsStore();
  const { t } = useTranslation();

  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-white" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t.onboarding.ready}</h2>
        <p className="text-[var(--text-secondary)] mt-2">
          {t.onboarding.readyDescription.replace("{time}", preferredSessionTime)}
        </p>
      </div>

      <div className="p-4 rounded-xl bg-primary-900/20 text-sm text-[var(--text-secondary)]">
        <p>
          {t.onboarding.readyDisclaimer}
        </p>
      </div>

      <Button onClick={onComplete} size="lg" className="w-full">
        {t.onboarding.letsStart}
      </Button>
    </div>
  );
}
