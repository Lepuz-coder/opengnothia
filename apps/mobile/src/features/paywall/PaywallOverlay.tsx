import { Modal, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FullWindowOverlay } from "react-native-screens";
import { PaywallContent } from "./PaywallContent";
import { usePaywallOverlayStore } from "./usePaywallOverlayStore";

/** Worker-gate paywall that remains visible above an already-presented Modal. */
export function PaywallOverlay() {
  const visible = usePaywallOverlayStore((state) => state.visible);
  const hide = usePaywallOverlayStore((state) => state.hide);
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const content = (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <PaywallContent variant="modal" onDone={hide} />
    </View>
  );

  // Match the app-lock layering strategy: UIWindow overlay on iOS avoids the
  // one-presented-controller limit; Android supports a top-level dialog.
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
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={hide}
    >
      {content}
    </Modal>
  );
}
