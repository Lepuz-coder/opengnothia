import Constants from "expo-constants";
import Purchases, { LOG_LEVEL, type CustomerInfo } from "react-native-purchases";
import { create } from "zustand";

// M5: a single entitlement answers every gating question ("is pro active?").
// Must match the Worker's ENTITLEMENT_ID in apps/backend/wrangler.toml.
const ENTITLEMENT_ID = "pro";

interface RevenueCatExtra {
  iosApiKey?: string;
  /**
   * Public key of the RC Test Store app (test_…). Products live there until an
   * App Store Connect presence exists (Faz 0 note), so dev builds must
   * configure with this key for purchases to work; release builds use the
   * appl_ key.
   */
  testStoreApiKey?: string;
}

interface SubscriptionState {
  /** True once configure ran and the first CustomerInfo answer (or failure) arrived. */
  isReady: boolean;
  isPro: boolean;
  /** Anonymous RevenueCat id ($RCAnonymousID:…) — the Bearer token of every AI request (D14). */
  appUserId: string | null;
  /** ISO timestamp the current entitlement expires; null when not pro or lifetime. */
  expirationDate: string | null;
  /** Store-provided subscription management page, for the Faz 9 settings section. */
  managementURL: string | null;
  configure: () => void;
  restore: () => Promise<CustomerInfo>;
}

// Survives re-renders but not reloads; double-configure across dev HMR is
// harmless (the SDK just reconfigures with the same key).
let configured = false;

// M13: mobile keeps its own stores. Not persisted — the RC SDK caches
// CustomerInfo on device and stays the single source of truth for isPro.
export const useSubscriptionStore = create<SubscriptionState>()((set) => {
  const applyCustomerInfo = (info: CustomerInfo) => {
    const entitlement = info.entitlements.active[ENTITLEMENT_ID];
    set({
      isPro: entitlement !== undefined,
      expirationDate: entitlement?.expirationDate ?? null,
      managementURL: info.managementURL,
    });
  };

  return {
    isReady: false,
    isPro: false,
    appUserId: null,
    expirationDate: null,
    managementURL: null,

    configure: () => {
      if (configured) return;
      configured = true;

      const rc =
        (Constants.expoConfig?.extra as { revenueCat?: RevenueCatExtra } | undefined)
          ?.revenueCat ?? {};
      const apiKey = (__DEV__ && rc.testStoreApiKey) || rc.iosApiKey;
      if (!apiKey) {
        console.error("[subscription] no RevenueCat api key in app config");
        set({ isReady: true });
        return;
      }

      if (__DEV__) void Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      // No appUserID passed — the SDK mints and persists an anonymous one (D14).
      Purchases.configure({ apiKey });
      Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);
      void Purchases.getAppUserID().then((id) => set({ appUserId: id }));
      Purchases.getCustomerInfo()
        .then(applyCustomerInfo)
        // First launch offline: no cached CustomerInfo. Stay not-pro but open
        // the gate — the listener corrects the state whenever a fetch succeeds.
        .catch(() => undefined)
        .finally(() => set({ isReady: true }));
    },

    restore: async () => {
      const info = await Purchases.restorePurchases();
      applyCustomerInfo(info);
      return info;
    },
  };
});

/** The Bearer token for AI requests. Null until the SDK has been configured. */
export function getAppUserId(): string | null {
  return useSubscriptionStore.getState().appUserId;
}
