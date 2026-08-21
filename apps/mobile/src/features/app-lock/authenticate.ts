import { AppState } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";

export type DeviceAuthenticationOutcome =
  | "success"
  | "unavailable"
  | "cancelled"
  | "failed";
export type DeviceAuthenticationError = Extract<
  DeviceAuthenticationOutcome,
  "unavailable" | "failed"
>;

const UNAVAILABLE_ERRORS = new Set([
  "not_available",
  "not_enrolled",
  "passcode_not_set",
]);
const CANCELLED_ERRORS = new Set(["user_cancel", "system_cancel", "app_cancel"]);

/**
 * Native authentication callbacks can resolve just before React Native sees
 * the host activity become active again (Face ID on iOS and device credential
 * on older Android). Keep a successful proof pending for that short handoff,
 * but never carry it across a genuine, longer background stay.
 */
function waitForActiveAfterSuccess(timeoutMs = 2_000): Promise<boolean> {
  if (AppState.currentState === "active") return Promise.resolve(true);

  return new Promise((resolve) => {
    let settled = false;
    let subscription: ReturnType<typeof AppState.addEventListener> | null = null;
    const finish = (active: boolean) => {
      if (settled) return;
      settled = true;
      subscription?.remove();
      clearTimeout(timeout);
      resolve(active);
    };
    const timeout = setTimeout(() => finish(false), timeoutMs);
    subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") finish(true);
    });
    // Close the tiny subscribe/check race if active landed between the first
    // read and listener registration.
    if (AppState.currentState === "active") finish(true);
  });
}

/**
 * One OS-owned prompt for Face ID, Touch ID, fingerprint, or the device
 * credential. The app never stores a PIN of its own (M10).
 */
export async function authenticateWithDevice(
  promptMessage: string,
  cancelLabel: string
): Promise<DeviceAuthenticationOutcome> {
  try {
    const enrolledLevel = await LocalAuthentication.getEnrolledLevelAsync();
    if (enrolledLevel === LocalAuthentication.SecurityLevel.NONE) return "unavailable";

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel,
      // The plan explicitly includes the device passcode as a fallback.
      disableDeviceFallback: false,
      // Weak biometrics fall back to the device credential instead of being
      // accepted as the app's privacy boundary.
      biometricsSecurityLevel: "strong",
    });

    if (result.success) {
      return (await waitForActiveAfterSuccess()) ? "success" : "failed";
    }
    if (UNAVAILABLE_ERRORS.has(result.error)) return "unavailable";
    if (CANCELLED_ERRORS.has(result.error)) return "cancelled";
    return "failed";
  } catch {
    return "failed";
  }
}
