import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { useTranslation } from "@/i18n";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  showSettingsLink: boolean;
  settingsButtonLabel?: string;
  onGoToSettings?: () => void;
  details?: string;
}

export function ErrorModal({
  isOpen,
  onClose,
  title,
  message,
  showSettingsLink,
  settingsButtonLabel,
  onGoToSettings,
  details,
}: ErrorModalProps) {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!details) return;
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore clipboard errors
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed pt-2">
          {message}
        </p>
      </div>

      {details && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showDetails ? t.errors.hideDetails : t.errors.showDetails}
          </button>
          {showDetails && (
            <div className="relative mt-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]">
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t.errors.copied : t.errors.copyDetails}
              </button>
              <pre className="max-h-64 overflow-auto p-3 pr-20 text-xs text-[var(--text-secondary)] whitespace-pre-wrap break-words font-mono">
                {details}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        {showSettingsLink && onGoToSettings && (
          <Button variant="secondary" onClick={onGoToSettings}>
            {settingsButtonLabel || t.session.goToSettings}
          </Button>
        )}
        <Button variant="secondary" onClick={onClose}>
          {t.errors.dismissButton}
        </Button>
      </div>
    </Modal>
  );
}
