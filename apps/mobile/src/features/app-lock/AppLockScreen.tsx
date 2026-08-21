import { Modal, Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FullWindowOverlay } from "react-native-screens";
import { LockKeyhole } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button } from "@/ui";
import type { DeviceAuthenticationError } from "./authenticate";

interface AppLockScreenProps {
  authenticating: boolean;
  error: DeviceAuthenticationError | null;
  onUnlock: () => void;
}

export function AppLockScreen({ authenticating, error, onUnlock }: AppLockScreenProps) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();

  const content = (
    <View
      className="flex-1 items-center justify-center bg-canvas px-7"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
    >
      <View className="mb-6 h-20 w-20 items-center justify-center rounded-3xl bg-primary-100 dark:bg-primary-900/40">
        <LockKeyhole size={36} color={colors.tint} />
      </View>
      <Text className="text-center text-2xl font-bold text-ink">{t.settings.unlockTitle}</Text>
      <Text className="mt-2 max-w-sm text-center text-base leading-6 text-ink-soft">
        {t.settings.unlockDescription}
      </Text>
      {error !== null && (
        <Text className="mt-4 max-w-sm text-center text-sm leading-5 text-red-600 dark:text-red-400">
          {error === "unavailable" ? t.settings.appLockUnavailable : t.settings.appLockFailed}
        </Text>
      )}
      <Button
        size="lg"
        loading={authenticating}
        disabled={authenticating}
        onPress={onUnlock}
        className="mt-7 min-w-48"
      >
        {t.settings.unlockButton}
      </Button>
    </View>
  );

  // iOS cannot reliably present a second RN Modal while a session/editor
  // modal is already open. FullWindowOverlay attaches directly to UIWindow,
  // stays above every presented controller, and leaves their React trees
  // mounted. Android dialogs can stack, so retain the native Modal there.
  if (Platform.OS === "ios") {
    return (
      <FullWindowOverlay unstable_accessibilityContainerViewIsModal>
        {content}
      </FullWindowOverlay>
    );
  }

  return (
    <Modal
      visible
      animationType="none"
      presentationStyle="fullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => undefined}
    >
      {content}
    </Modal>
  );
}
