import "../global.css";
// Side effect: fills in crypto.randomUUID before anything touches the db —
// shared queries mint row ids with it and Hermes has no Web Crypto.
import "@/polyfills";
// Side effect: registers the language source with @opengnothia/shared before
// any screen calls useTranslation(). Must stay above the screen imports.
import "@/i18n/bindings";

import { useEffect } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { useTranslation } from "@opengnothia/shared/i18n";
import { useDatabase } from "@/db/useDatabase";
import { AppLockScreen } from "@/features/app-lock/AppLockScreen";
import { useAppLock } from "@/features/app-lock/useAppLock";
import { PaywallOverlay } from "@/features/paywall/PaywallOverlay";
import { usePaywallOverlayStore } from "@/features/paywall/usePaywallOverlayStore";
import { useSettingsHydrationStore, useSettingsStore } from "@/stores/useSettingsStore";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";
import { useThemeColors, useThemeSync } from "@/theme/useAppTheme";
import { Button, DataLoadError, ToastContainer } from "@/ui";

// The anchor covers the onboarded case; on a fresh install the guards below
// drop (tabs) entirely and the router falls through to (onboarding) (Step 59).
export const unstable_settings = { anchor: "(tabs)" };

export default function RootLayout() {
  useThemeSync();
  const { t } = useTranslation();
  const { resolved, colors } = useThemeColors();
  const hasHydrated = useSettingsHydrationStore((s) => s.hasHydrated);
  const settingsHydrationError = useSettingsHydrationStore((s) => s.hydrationError);
  const lockEnabled = useSettingsStore((s) => s.lockEnabled);
  const onboarded = useSettingsStore((s) => s.onboarded);
  const paywallOverlayVisible = usePaywallOverlayStore((s) => s.visible);
  const { isReady, error, retry } = useDatabase();
  const configurePurchases = useSubscriptionStore((s) => s.configure);
  const appLock = useAppLock({
    enabled: lockEnabled,
    // A failed settings read is not a completed security boundary. Keeping
    // this false until a successful retry guarantees a recovered persisted
    // lock is treated exactly like a cold launch and prompts before content.
    settingsHydrated: hasHydrated && !settingsHydrationError,
    promptMessage: t.settings.appLockPrompt,
    cancelLabel: t.common.cancel,
  });
  const showLockScreen =
    hasHydrated && lockEnabled && (appLock.isLocked || appLock.isObscured);

  const retrySettingsHydration = () => {
    useSettingsHydrationStore.setState({ hasHydrated: false, hydrationError: false });
    void useSettingsStore.persist.rehydrate();
  };

  // RC configure must precede any Purchases call (paywall offerings, appUserID
  // for AI requests) — earliest safe point, independent of the DB gate below.
  useEffect(() => {
    configurePurchases();
  }, [configurePurchases]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={resolved === "dark" ? "light" : "dark"} />
      {error !== null ? (
        <DatabaseErrorScreen message={error} onRetry={retry} />
      ) : settingsHydrationError ? (
        <DataLoadError onRetry={retrySettingsHydration} />
      ) : !isReady || !hasHydrated ? (
        <View className="flex-1 items-center justify-center bg-canvas">
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : (
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.canvas },
            headerTintColor: colors.ink,
            headerTitleStyle: { color: colors.ink },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.canvas },
          }}
        >
          {/* Step 59: the flag decides which group exists; flipping it swaps
              groups and clears the dropped one's history (Expo Router guards). */}
          <Stack.Protected guard={onboarded}>
            {/* title:"" also blanks the label Settings' back button inherits from here. */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "" }} />
          </Stack.Protected>
          <Stack.Protected guard={!onboarded}>
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Screen name="settings" options={{ title: "" }} />
          {/* Faz 5: past-session detail, pushed over the tabs (title set in-screen). */}
          <Stack.Screen name="session/[id]" options={{ title: "", headerBackButtonDisplayMode: "minimal" }} />
          {/* M6: custom paywall, always presented as a modal sheet. Unguarded on
              purpose — the 403 error handler may push it mid-onboarding too. */}
          <Stack.Screen name="paywall" options={{ presentation: "modal", headerShown: false }} />
          {/* Step 60: settings' "retake the quiz" surface. */}
          <Stack.Screen name="school-quiz" options={{ presentation: "modal", headerShown: false }} />
        </Stack>
      )}
      {!showLockScreen && !paywallOverlayVisible && <ToastContainer />}
      {/* A late Worker response can arrive after the app is locked. Defer the
          paywall mount so it can never be added above the privacy boundary;
          its transient store keeps it pending until unlock. */}
      {!showLockScreen && <PaywallOverlay />}
      {showLockScreen && (
        <AppLockScreen
          authenticating={appLock.isAuthenticating}
          error={appLock.error}
          onUnlock={() => void appLock.unlock()}
        />
      )}
    </GestureHandlerRootView>
  );
}

// Migrations are the one startup step that can fail on a user's device (disk
// full, corrupt file). Showing the real error beats a blank screen — there is
// no crash reporter to read it from later (M13).
function DatabaseErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 justify-center bg-canvas px-6">
      <Text className="mb-2 text-xl font-semibold text-ink">{t.errors.databaseError}</Text>
      <ScrollView className="mb-6 max-h-48 rounded-xl border border-line bg-card p-4">
        <Text className="text-sm text-ink-soft">{message}</Text>
      </ScrollView>
      <Button onPress={onRetry}>{t.errors.retryButton}</Button>
    </View>
  );
}
