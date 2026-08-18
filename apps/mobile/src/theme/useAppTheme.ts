import { useEffect } from "react";
import { colorScheme, useColorScheme } from "nativewind";
import type { Theme } from "@opengnothia/shared/types";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { THEME_COLORS, type ThemeColors } from "./colors";

/**
 * Pushes the persisted `theme` setting into NativeWind's colour scheme (M8).
 * tailwind.config.js sets darkMode:"class", so NativeWind stops following the
 * OS on its own and takes the value we set here — including "system", which
 * hands control back to Appearance.
 *
 * Call once, from the root layout: it is a side effect, not a read.
 */
export function useThemeSync(): void {
  const theme = useSettingsStore((s) => s.theme);
  const hasHydrated = useSettingsStore((s) => s.hasHydrated);

  useEffect(() => {
    // Waiting for hydration avoids a light→dark flash on launch.
    if (hasHydrated) colorScheme.set(theme);
  }, [theme, hasHydrated]);
}

/**
 * The resolved scheme and its palette, for the places that need a real colour
 * rather than a class: native navigators, SVG icons, placeholderTextColor.
 * Everything else should use the `bg-canvas` / `text-ink` utilities.
 */
export function useThemeColors(): { resolved: "light" | "dark"; colors: ThemeColors } {
  const { colorScheme: active } = useColorScheme();
  const resolved = active === "dark" ? "dark" : "light";
  return { resolved, colors: THEME_COLORS[resolved] };
}

/** The stored preference, which is "system" as often as not — for the picker. */
export function useThemePreference(): Theme {
  return useSettingsStore((s) => s.theme);
}
