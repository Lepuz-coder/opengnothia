import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n";
import { Mic } from "lucide-react";

interface TranscriptApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
}

export function TranscriptApiKeyModal({ isOpen, onClose, onSave }: TranscriptApiKeyModalProps) {
  const { t } = useTranslation();
  const [key, setKey] = useState("");

  function handleSave() {
    const trimmed = key.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setKey("");
  }

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setKey(""); }} title={t.transcript.apiKeyRequired}>
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center">
          <Mic className="w-5 h-5 text-primary-400" />
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed pt-2">
          {t.transcript.apiKeyDescription}
        </p>
      </div>
      <div className="space-y-4">
        <Input
          label={t.transcript.openaiApiKey}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-..."
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={() => { onClose(); setKey(""); }}>
            {t.common.cancel}
          </Button>
          <Button size="sm" disabled={!key.trim()} onClick={handleSave}>
            {t.transcript.saveAndRecord}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
