import "../global.css";
// Side effect: registers the language source with @opengnothia/shared before
// any screen calls useTranslation(). Must stay above the screen imports.
import "@/i18n/bindings";

import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { useTranslation } from "@opengnothia/shared/i18n";
import { useDatabase } from "@/db/useDatabase";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useThemeColors, useThemeSync } from "@/theme/useAppTheme";
import { Button, ToastContainer } from "@/ui";

// Without this, the router would land on (onboarding) — groups are ordered
// alphabetically. Faz 7 replaces this with a real `onboarded`-flag decision.
export const unstable_settings = { anchor: "(tabs)" };

export default function RootLayout() {
  useThemeSync();
  const { resolved, colors } = useThemeColors();
  const hasHydrated = useSettingsStore((s) => s.hasHydrated);
  const { isReady, error, retry } = useDatabase();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={resolved === "dark" ? "light" : "dark"} />
      {error !== null ? (
        <DatabaseErrorScreen message={error} onRetry={retry} />
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
          {/* title:"" also blanks the label Settings' back button inherits from here. */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "" }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ title: "" }} />
        </Stack>
      )}
      <ToastContainer />
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
