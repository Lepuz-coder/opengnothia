import { useRouter } from "expo-router";
import { PaywallContent } from "@/features/paywall/PaywallContent";

/** M6/M3: the gate's paywall, always presented as a modal sheet (root layout). */
export default function PaywallScreen() {
  const router = useRouter();
  return <PaywallContent variant="modal" onDone={() => router.back()} />;
}
