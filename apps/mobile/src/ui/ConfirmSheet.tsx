import { Text, View } from "react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { Button } from "./Button";
import { Sheet } from "./Sheet";

interface ConfirmSheetProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

// Mobile counterpart of desktop's delete-confirmation Modals: destructive
// actions get a bottom sheet with an explicit cancel, per iOS convention.
export function ConfirmSheet({
  isOpen,
  title,
  message,
  confirmLabel,
  confirming = false,
  onConfirm,
  onClose,
}: ConfirmSheetProps) {
  const { t } = useTranslation();
  const handleClose = () => {
    if (!confirming) onClose();
  };

  return (
    <Sheet isOpen={isOpen} onClose={handleClose} title={title} dismissible={!confirming}>
      <Text className="mb-6 text-base leading-relaxed text-ink-soft">{message}</Text>
      <View className="flex-row gap-3">
        <Button variant="secondary" className="flex-1" onPress={handleClose} disabled={confirming}>
          {t.common.cancel}
        </Button>
        <Button variant="danger" className="flex-1" onPress={onConfirm} loading={confirming}>
          {confirmLabel}
        </Button>
      </View>
    </Sheet>
  );
}
