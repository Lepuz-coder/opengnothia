import { View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PaywallContent } from "@/features/paywall/PaywallContent";

/** M6/M3: the gate's paywall, always presented as a modal sheet (root layout). */
export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <PaywallContent variant="modal" onDone={() => router.back()} />
    </View>
  );
}
