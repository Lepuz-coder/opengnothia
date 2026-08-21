import { Text, View } from "react-native";
import { AlertCircle } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { Button } from "./Button";

interface DataLoadErrorProps {
  onRetry: () => void;
}

/** A visible, retryable fallback for local data queries that fail after startup. */
export function DataLoadError({ onRetry }: DataLoadErrorProps) {
  const { t } = useTranslation();

  return (
    <View
      accessibilityRole="alert"
      className="flex-1 items-center justify-center gap-3 bg-canvas px-8"
    >
      <AlertCircle size={32} color="#EF4444" />
      <Text className="text-center text-lg font-semibold text-ink">{t.errors.databaseError}</Text>
      <Text className="text-center text-sm text-ink-mute">{t.errors.generic}</Text>
      <Button variant="secondary" className="mt-2" onPress={onRetry}>
        {t.errors.retryButton}
      </Button>
    </View>
  );
}
