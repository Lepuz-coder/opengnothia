import { Shield, Lock, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const { t } = useTranslation();
  return (
    <div className="text-center space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t.onboarding.welcome}</h1>
      <p className="text-[var(--text-secondary)]">
        {t.onboarding.welcomeDescription}
      </p>

      <div className="space-y-3 text-left">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-primary)]">
          <Lock className="w-5 h-5 text-primary-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">{t.onboarding.completelyLocal}</p>
            <p className="text-xs text-[var(--text-muted)]">{t.onboarding.completelyLocalDescription}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-primary)]">
          <Shield className="w-5 h-5 text-primary-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">{t.onboarding.ownApiKey}</p>
            <p className="text-xs text-[var(--text-muted)]">{t.onboarding.ownApiKeyDescription}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-primary)]">
          <Heart className="w-5 h-5 text-primary-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">{t.onboarding.openSource}</p>
            <p className="text-xs text-[var(--text-muted)]">{t.onboarding.openSourceDescription}</p>
          </div>
        </div>
      </div>

      <Button onClick={onNext} size="lg" className="w-full">
        {t.onboarding.letsStart}
      </Button>
    </div>
  );
}
