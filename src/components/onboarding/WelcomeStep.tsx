import { useState } from "react";
import { Shield, Lock, Heart, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n";
import { pickAndReadImportFile, importAllData } from "@/services/data/dataPortService";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const { t } = useTranslation();
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");

  async function handleImport() {
    setImportError("");
    setImporting(true);
    try {
      const data = await pickAndReadImportFile();
      if (!data) {
        setImporting(false);
        return;
      }
      await importAllData(data);
      window.location.reload();
    } catch (err) {
      console.error("Import failed:", err);
      const msg =
        err instanceof Error && err.message === "INVALID_FILE"
          ? t.settings.importInvalidFile
          : t.settings.importFailed;
      setImportError(msg);
      setImporting(false);
    }
  }

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

      <div className="space-y-3">
        <Button onClick={onNext} size="lg" className="w-full" disabled={importing}>
          {t.onboarding.letsStart}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={handleImport}
          disabled={importing}
          className="w-full border border-[var(--border-color)] hover:border-primary-500 hover:text-primary-500"
        >
          {importing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {importing ? t.settings.importing : t.onboarding.importExistingData}
        </Button>
        {importError && (
          <p className="text-sm text-red-500">{importError}</p>
        )}
      </div>
    </div>
  );
}
