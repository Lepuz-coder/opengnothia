import { Text, View } from "react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { Button } from "./Button";
import { Sheet } from "./Sheet";

interface ConfirmSheetProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

// Mobile counterpart of desktop's delete-confirmation Modals: destructive
// actions get a bottom sheet with an explicit cancel, per iOS convention.
export function ConfirmSheet({ isOpen, title, message, confirmLabel, onConfirm, onClose }: ConfirmSheetProps) {
  const { t } = useTranslation();

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={title}>
      <Text className="mb-6 text-base leading-relaxed text-ink-soft">{message}</Text>
      <View className="flex-row gap-3">
        <Button variant="secondary" className="flex-1" onPress={onClose}>
          {t.common.cancel}
        </Button>
        <Button variant="danger" className="flex-1" onPress={onConfirm}>
          {confirmLabel}
        </Button>
      </View>
    </Sheet>
  );
}
