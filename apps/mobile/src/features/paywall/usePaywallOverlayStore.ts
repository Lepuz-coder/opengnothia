import { create } from "zustand";

interface PaywallOverlayState {
  visible: boolean;
  show: () => void;
  hide: () => void;
}

/**
 * Modal-hosted AI surfaces cannot push the paywall route above their native
 * Modal on iOS. This transient root overlay lets a Worker 403 present the same
 * paywall without closing an editor or an active session.
 */
export const usePaywallOverlayStore = create<PaywallOverlayState>((set) => ({
  visible: false,
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
}));
