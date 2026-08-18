/**
 * The few token values that must exist as plain colours rather than classes —
 * native navigators (tab bar, stack header), SVG icons and TextInput's
 * placeholderTextColor all take values, not className. Keep in sync with the
 * matching custom properties in global.css.
 */
export interface ThemeColors {
  canvas: string;
  card: string;
  line: string;
  ink: string;
  inkMute: string;
  tint: string;
  accent: string;
}

export const THEME_COLORS: Record<"light" | "dark", ThemeColors> = {
  light: {
    canvas: "#E8EDF5", // surface-50
    card: "#FFFFFF",
    line: "#C9D3E5", // surface-100
    ink: "#0F1729", // surface-950
    inkMute: "#5A7199", // surface-500
    tint: "#2D8F8B", // primary-600
    accent: "#C48A2A", // accent-600 — same light/dark steps as tint
  },
  dark: {
    canvas: "#0F1729", // surface-950
    card: "#1A2744", // surface-800
    line: "#243556", // surface-700
    ink: "#E8EDF5", // surface-50
    inkMute: "#5A7199", // surface-500
    tint: "#4BC3BE", // primary-400
    accent: "#EDB448", // accent-400
  },
};
