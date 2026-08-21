import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertCircle, Check, Info, X } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { useToastStore, type Toast as ToastData } from "@/stores/useToastStore";
import { useThemeColors } from "@/theme/useAppTheme";

const ICONS = { success: Check, info: Info, error: AlertCircle } as const;
const ICON_COLORS = { success: "#4ADE80", info: "#60A5FA", error: "#F87171" } as const;

// Mounted once by the root layout, above the navigator, so a toast survives
// navigation the same way desktop's fixed container does.
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View className="absolute left-0 right-0 z-50 gap-2 px-4" style={{ top: insets.top + 8 }} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

function ToastItem({ toast }: { toast: ToastData }) {
  const { t } = useTranslation();
  const dismiss = useToastStore((s) => s.dismiss);
  const { colors } = useThemeColors();
  const Icon = ICONS[toast.type];

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className="flex-row items-start gap-2.5 rounded-xl border border-line bg-card px-3.5 py-2.5 shadow-lg"
    >
      <Icon size={16} color={ICON_COLORS[toast.type]} />
      <Text className="flex-1 text-sm leading-snug text-ink">{toast.message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.common.close}
        onPress={() => dismiss(toast.id)}
        className="rounded p-0.5 active:bg-raised"
      >
        <X size={14} color={colors.inkMute} />
      </Pressable>
    </View>
  );
}
