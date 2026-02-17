import { Button } from "@/components/ui/Button";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/cn";
import type { Language } from "@/types";

interface LanguageStepProps {
  onNext: () => void;
}

const languages: { id: Language; label: string; flag: string }[] = [
  { id: "tr", label: "Türkçe", flag: "TR" },
  { id: "en", label: "English", flag: "EN" },
];

export function LanguageStep({ onNext }: LanguageStepProps) {
  const { language, setLanguage } = useSettingsStore();
  const { t } = useTranslation();

  return (
    <div className="text-center space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t.settings.language}</h1>

      <div className="space-y-3">
        {languages.map((lang) => (
          <button
            key={lang.id}
            onClick={() => setLanguage(lang.id)}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-xl border transition-all",
              language === lang.id
                ? "border-primary-500 bg-primary-500/10"
                : "border-[var(--border-color)] hover:border-[var(--text-muted)]"
            )}
          >
            <span className="text-2xl font-bold text-[var(--text-muted)]">{lang.flag}</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">{lang.label}</span>
          </button>
        ))}
      </div>

      <Button onClick={onNext} size="lg" className="w-full">
        {t.common.continue}
      </Button>
    </div>
  );
}
