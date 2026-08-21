import { useCallback } from "react";
import { useRouter } from "expo-router";
import Purchases from "react-native-purchases";
import { AIError } from "@opengnothia/shared/ai/AIError";
import { extractProxyErrorCode, getErrorDisplayInfo } from "@opengnothia/shared/ai/errorMessages";
import { useTranslation } from "@opengnothia/shared/i18n";
import { usePaywallOverlayStore } from "@/features/paywall/usePaywallOverlayStore";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";
import { showToast } from "@/stores/useToastStore";

interface AIErrorHandlerOptions {
  /**
   * Set when the calling surface lives inside an RN Modal (the fullscreen
   * session, a pageSheet). A route pushed from there would present below the
   * modal and be invisible, so 403 uses the root window overlay instead.
   */
  modalHosted?: boolean;
}

/**
 * Step 33: the one place AI failures turn into UX. 403 subscription_required
 * opens the paywall instead of an error message; everything else (429 quota,
 * 401 identity, network/5xx) becomes a toast with the shared errorMessages
 * texts. Every AI surface routes its catch/onError through this.
 */
export function useAIErrorHandler(options?: AIErrorHandlerOptions) {
  const { t } = useTranslation();
  const router = useRouter();
  const modalHosted = options?.modalHosted === true;

  return useCallback(
    (error: unknown) => {
      if (extractProxyErrorCode(error) === "subscription_required") {
        // The Worker is authoritative: pessimistically clear a stale local
        // entitlement before presenting packages, then invalidate RevenueCat
        // so its next explicit read cannot reuse the rejected cache entry.
        useSubscriptionStore.getState().markSubscriptionRequired();
        void Purchases.invalidateCustomerInfoCache().catch(() => undefined);
        if (modalHosted) {
          usePaywallOverlayStore.getState().show();
        } else {
          router.push("/paywall");
        }
        return;
      }
      const statusCode = error instanceof AIError ? error.statusCode : undefined;
      if (statusCode === undefined) {
        // Mobile has no API-key/balance settings. A status-less failure is
        // normally offline transport (or startup before RevenueCat produced
        // an identity), so desktop's BYOK-oriented unknown message would send
        // the user to a settings screen that does not exist here.
        const identityPending =
          error instanceof AIError && error.message.includes("Subscription identity");
        showToast(
          identityPending ? t.errors.proxyIdentityMessage : t.errors.status502Message,
          "error"
        );
        return;
      }
      const info = getErrorDisplayInfo(t, statusCode, "openai", error);
      showToast(info.message, "error");
    },
    [t, router, modalHosted]
  );
}
