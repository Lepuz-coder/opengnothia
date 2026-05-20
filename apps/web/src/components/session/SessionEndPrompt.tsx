import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n";

interface SessionEndPromptProps {
  onClose: () => void;
  onContinue: () => void;
}

export function SessionEndPrompt({ onClose, onContinue }: SessionEndPromptProps) {
  const { t } = useTranslation();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return (
    <div className="px-4 pb-4 pt-2">
      <div
        role="status"
        aria-live="polite"
        className="max-w-3xl mx-auto rounded-2xl border border-primary-500/30 bg-[var(--bg-secondary)] shadow-lg shadow-black/20 px-6 py-5"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-500/15 text-primary-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
              {t.session.sessionEndedTitle}
            </h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              {t.session.sessionEndedDescription}
            </p>
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="secondary" size="md" onClick={onContinue}>
            {t.session.continueSession}
          </Button>
          <Button ref={closeButtonRef} variant="primary" size="md" onClick={onClose}>
            {t.session.closeSession}
          </Button>
        </div>
      </div>
    </div>
  );
}
