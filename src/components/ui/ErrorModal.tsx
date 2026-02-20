import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "@/i18n";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  showSettingsLink: boolean;
  settingsButtonLabel?: string;
  onGoToSettings?: () => void;
}

export function ErrorModal({
  isOpen,
  onClose,
  title,
  message,
  showSettingsLink,
  settingsButtonLabel,
  onGoToSettings,
}: ErrorModalProps) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex items-start gap-3 mb-6">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed pt-2">
          {message}
        </p>
      </div>

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
