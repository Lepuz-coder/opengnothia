import { View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PaywallContent } from "@/features/paywall/PaywallContent";

/**
 * M11 step 4: the same custom paywall as the gate modal (M6), in its skippable
 * onboarding dress. Subscribers (new or already-pro) continue into the AI
 * interview; skippers jump straight to ready — the interview step only exists
 * for accounts that can actually make AI calls.
 */
export default function OnboardingSubscribeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleDone = (proceedAsPro: boolean) => router.push(proceedAsPro ? "/interview" : "/ready");

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <PaywallContent variant="onboarding" onDone={handleDone} />
    </View>
  );
}
