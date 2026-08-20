import { useCallback } from "react";
import { useRouter } from "expo-router";
import Purchases from "react-native-purchases";
import { AIError } from "@opengnothia/shared/ai/AIError";
import { extractProxyErrorCode, getErrorDisplayInfo } from "@opengnothia/shared/ai/errorMessages";
import { useTranslation } from "@opengnothia/shared/i18n";
import { showToast } from "@/stores/useToastStore";

interface AIErrorHandlerOptions {
  /**
   * Set when the calling surface lives inside an RN Modal (the fullscreen
   * session, a pageSheet). A route pushed from there would present BELOW the
   * modal and be invisible, so 403 becomes a toast instead — the paywall
   * still appears at the next gated entry point. Pair with a <ToastContainer>
   * mounted inside the modal's own tree, since the root one is covered too.
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
        // The Worker is authoritative: if it rejects while local state still
        // says pro, the cached CustomerInfo is stale — refetch so the paywall
        // shows packages, not "already pro".
        void Purchases.invalidateCustomerInfoCache().catch(() => undefined);
        if (modalHosted) {
          showToast(t.errors.proxySubscriptionMessage, "error");
        } else {
          router.push("/paywall");
        }
        return;
      }
      const statusCode = error instanceof AIError ? error.statusCode : undefined;
      const info = getErrorDisplayInfo(t, statusCode, "openai", error);
      showToast(info.message, "error");
    },
    [t, router, modalHosted]
  );
}
