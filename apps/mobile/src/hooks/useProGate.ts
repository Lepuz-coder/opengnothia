import { useCallback } from "react";
import { useRouter } from "expo-router";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";

/**
 * M3: the single gating pattern. Every AI entry point wraps its action in
 * gate() — subscribers run it, everyone else lands on the paywall modal.
 * Pair with <LockBadge /> on the triggering control.
 */
export function useProGate() {
  const isPro = useSubscriptionStore((s) => s.isPro);
  const router = useRouter();

  const gate = useCallback(
    (action: () => void) => {
      if (isPro) {
        action();
      } else {
        router.push("/paywall");
      }
    },
    [isPro, router]
  );

  return { isPro, gate };
}
