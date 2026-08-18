/**
 * Design tokens ported from apps/desktop/src/styles.css (M8).
 *
 * The three primitive ramps (primary / accent / surface) are copied verbatim
 * from the desktop `@theme` block, so a colour named `primary-500` means the
 * exact same teal on both platforms.
 *
 * The semantic tokens below are the mobile counterpart of desktop's
 * `--bg-primary` / `--text-secondary` / … variables. Desktop ships dark only;
 * mobile needs both schemes (M8: system + manual light/dark), so the light
 * values are the mirrored positions on the same surface ramp:
 *
 *   canvas   ← --bg-primary     card    ← --bg-secondary   raised ← --bg-tertiary
 *   ink      ← --text-primary   ink-soft ← --text-secondary ink-mute ← --text-muted
 *   line     ← --border-color   tint     ← the primary step used for links/CTAs
 *
 * They are declared as `rgb(var(--x) / <alpha-value>)` so opacity modifiers
 * (`bg-card/60`) keep working; the channel triplets live in global.css.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  // "class" (rather than the default "media") is what lets the Settings screen
  // override the system scheme via colorScheme.set() — see src/theme/useAppTheme.ts.
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#F0FAFA",
          100: "#D2F0EF",
          200: "#A5E1DF",
          300: "#78D2CE",
          400: "#4BC3BE",
          500: "#3ABAB4",
          600: "#2D8F8B",
          700: "#236E6B",
          800: "#1A504E",
          900: "#123735",
          950: "#0A2120",
        },
        accent: {
          50: "#FEF9F0",
          100: "#FCEFD4",
          200: "#F8DCA5",
          300: "#F2C66E",
          400: "#EDB448",
          500: "#E8A838",
          600: "#C48A2A",
          700: "#A06E20",
          800: "#7C5418",
          900: "#5C3E12",
          950: "#3D290B",
        },
        surface: {
          50: "#E8EDF5",
          100: "#C9D3E5",
          200: "#AAB7D4",
          300: "#8B9DC3",
          400: "#7387AE",
          500: "#5A7199",
          600: "#3F5378",
          700: "#243556",
          800: "#1A2744",
          900: "#151F37",
          950: "#0F1729",
        },
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        raised: "rgb(var(--raised) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        tint: "rgb(var(--tint) / <alpha-value>)",
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          soft: "rgb(var(--ink-soft) / <alpha-value>)",
          mute: "rgb(var(--ink-mute) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
};
