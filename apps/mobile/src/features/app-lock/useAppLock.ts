import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import {
  authenticateWithDevice,
  type DeviceAuthenticationError,
} from "./authenticate";

interface AppLockOptions {
  enabled: boolean;
  settingsHydrated: boolean;
  promptMessage: string;
  cancelLabel: string;
}

interface AppLockState {
  isLocked: boolean;
  isObscured: boolean;
  isAuthenticating: boolean;
  error: DeviceAuthenticationError | null;
  unlock: () => Promise<void>;
}

/**
 * Keeps private screens behind an OS-owned authentication prompt on a cold
 * launch and whenever the app returns from the background. `inactive` adds a
 * privacy cover so iOS cannot snapshot a visible journal/session, but only a
 * real `background` transition starts a fresh authentication epoch.
 */
export function useAppLock({
  enabled,
  settingsHydrated,
  promptMessage,
  cancelLabel,
}: AppLockOptions): AppLockState {
  // Start closed. Callers ignore this value when the persisted setting is off,
  // which prevents a one-frame lock screen on ordinary launches.
  const [isLocked, setIsLocked] = useState(true);
  const [isObscured, setIsObscured] = useState(AppState.currentState !== "active");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<AppLockState["error"]>(null);

  const enabledRef = useRef(enabled);
  const hydratedRef = useRef(settingsHydrated);
  const lockedRef = useRef(true);
  const authenticatingRef = useRef(false);
  const wasHydratedRef = useRef(false);
  const suppressNextActivePromptRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  enabledRef.current = enabled;
  hydratedRef.current = settingsHydrated;

  const setLocked = useCallback((next: boolean) => {
    lockedRef.current = next;
    setIsLocked(next);
  }, []);

  const unlockRef = useRef<() => Promise<void>>(async () => undefined);

  const unlock = useCallback(async () => {
    if (!hydratedRef.current || !enabledRef.current) {
      setError(null);
      setLocked(false);
      return;
    }
    if (AppState.currentState !== "active" || authenticatingRef.current) return;

    authenticatingRef.current = true;
    setIsAuthenticating(true);
    setError(null);

    const outcome = await authenticateWithDevice(promptMessage, cancelLabel);

    authenticatingRef.current = false;
    setIsAuthenticating(false);

    // Android credential Activities can report cancel/failure before RN's
    // foreground event. Preserve that result on the lock screen instead of
    // immediately opening a second system prompt during the same handoff.
    if (outcome !== "success" && AppState.currentState !== "active") {
      suppressNextActivePromptRef.current = true;
    }

    // The setting may have been switched off while the system prompt was up.
    if (!enabledRef.current) {
      setError(null);
      setLocked(false);
    } else if (outcome === "success" && AppState.currentState === "active") {
      // Android's device-credential fallback may briefly launch a Keyguard
      // activity and report a real `background` transition. A successful OS
      // prompt accepted after our activity is active again is current proof of
      // identity, even if that transition temporarily backgrounded the app.
      setError(null);
      setLocked(false);
    } else if (outcome === "success") {
      // Never unlock private content while it is not the active application.
      // The AppState listener starts a fresh prompt on the next foreground.
      setError(null);
      setLocked(true);
    } else if (outcome === "cancelled") {
      setError(null);
      setLocked(true);
    } else {
      setError(outcome);
      setLocked(true);
    }
  }, [cancelLabel, promptMessage, setLocked]);

  unlockRef.current = unlock;

  // Hydration is the cold-launch boundary. Enabling the setting during an
  // already-unlocked foreground session deliberately waits until the next
  // foreground transition; the enabling action already authenticated once.
  useEffect(() => {
    if (!settingsHydrated) {
      wasHydratedRef.current = false;
      return;
    }

    // This is distinct from a foreground settings toggle. It also runs after
    // a failed storage read is retried, so a recovered persisted lock cannot
    // open the private stack with the hook's old default-unlocked state.
    if (!wasHydratedRef.current) {
      wasHydratedRef.current = true;
      if (enabled) {
        setLocked(true);
        void unlockRef.current();
      } else {
        setIsObscured(false);
        setLocked(false);
      }
      return;
    }

    if (!enabled) {
      setError(null);
      setIsObscured(false);
      setLocked(false);
    } else if (AppState.currentState !== "active") {
      setIsObscured(true);
      setLocked(true);
    }
  }, [enabled, settingsHydrated, setLocked]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (!hydratedRef.current || !enabledRef.current) {
        setIsObscured(false);
        return;
      }

      // Keep private content out of iOS/Android transition snapshots without
      // turning short-lived system prompts into a new authentication cycle.
      setIsObscured(nextState !== "active");

      if (nextState === "background") {
        suppressNextActivePromptRef.current = false;
        setError(null);
        setLocked(true);
        return;
      }

      if (previousState !== "active" && nextState === "active" && lockedRef.current) {
        if (suppressNextActivePromptRef.current) {
          suppressNextActivePromptRef.current = false;
          return;
        }
        void unlockRef.current();
      }
    });

    return () => subscription.remove();
  }, [setLocked]);

  return { isLocked, isObscured, isAuthenticating, error, unlock };
}
