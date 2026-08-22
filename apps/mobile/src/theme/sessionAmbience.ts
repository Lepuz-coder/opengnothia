/**
 * The session surface's atmospheric palette — desktop's aurora wash and glass
 * chrome. These never became tokens on desktop either: `styles.css` writes them
 * as literal rgba() alphas inside `.aurora-orb` and as `white/[0.06]`-style
 * hairlines on the header and composer. Collecting them here keeps the mobile
 * port in one place instead of scattering magic numbers across four files.
 *
 * The dark values are desktop's verbatim (`styles.css:373-396`). Desktop ships
 * dark only; the light values are the same three hues re-weighted for the light
 * canvas (#E8EDF5), where desktop's alphas would be invisible.
 */

export interface AuroraOrb {
  color: string;
  /** Alpha at the gradient's centre; the mid and outer stops derive from it. */
  alpha: number;
}

export interface AuroraPalette {
  teal: AuroraOrb;
  blue: AuroraOrb;
  violet: AuroraOrb;
}

export const AURORA: Record<"light" | "dark", AuroraPalette> = {
  dark: {
    teal: { color: "#3ABAB4", alpha: 0.1 }, // primary-500
    blue: { color: "#3E63DD", alpha: 0.08 },
    violet: { color: "#8B7CF6", alpha: 0.07 },
  },
  light: {
    teal: { color: "#2D8F8B", alpha: 0.14 }, // primary-600 — deeper, so it reads on #E8EDF5
    blue: { color: "#3E63DD", alpha: 0.1 },
    violet: { color: "#7C6BF0", alpha: 0.09 },
  },
};

export interface GlassPalette {
  /** 1px separator under the header — desktop's `border-white/[0.06]`. */
  hairline: string;
  /** The composer pill's resting border — desktop's `border-white/[0.08]`. */
  pillBorder: string;
  /** The composer pill's focused border — desktop's `border-primary-500/40`. */
  pillBorderFocused: string;
  /** Drop shadow under the floating composer. */
  pillShadow: string;
  /** Focused composer: the same drop shadow plus desktop's teal halo. */
  pillShadowFocused: string;
  /** Tint laid over the blur so the glass keeps its colour in both schemes. */
  chromeTint: string;
  /** The AI orb's glow — softer in light, as LockBadge does for its gold chip. */
  orbGlow: string;
  /** The user bubble's drop shadow. */
  bubbleShadow: string;
  /** The lit send button's teal halo. */
  sendGlow: string;
  /** The typing dots' teal halo. */
  dotGlow: string;
}

export const GLASS: Record<"light" | "dark", GlassPalette> = {
  dark: {
    hairline: "rgba(255,255,255,0.06)",
    pillBorder: "rgba(255,255,255,0.08)",
    pillBorderFocused: "rgba(58,186,180,0.40)",
    pillShadow: "0px 8px 32px rgba(0,0,0,0.40)",
    pillShadowFocused: "0px 0px 28px rgba(58,186,180,0.35), 0px 8px 32px rgba(0,0,0,0.50)",
    chromeTint: "rgba(15,23,41,0.30)", // surface-950; BlurView's own dark tint supplies the rest
    orbGlow: "0px 0px 12px rgba(58,186,180,0.35)",
    bubbleShadow: "0px 4px 20px rgba(10,33,32,0.60)", // primary-950
    sendGlow: "0px 0px 14px rgba(58,186,180,0.40)",
    dotGlow: "0px 0px 8px rgba(58,186,180,0.45)",
  },
  light: {
    hairline: "rgba(15,23,41,0.08)",
    pillBorder: "rgba(15,23,41,0.10)",
    pillBorderFocused: "rgba(45,143,139,0.45)",
    pillShadow: "0px 6px 24px rgba(15,23,41,0.12)",
    pillShadowFocused: "0px 0px 22px rgba(45,143,139,0.28), 0px 6px 24px rgba(15,23,41,0.14)",
    chromeTint: "rgba(232,237,245,0.35)", // surface-50; BlurView's own light tint supplies the rest
    orbGlow: "0px 0px 10px rgba(45,143,139,0.30)",
    bubbleShadow: "0px 4px 16px rgba(45,143,139,0.18)",
    sendGlow: "0px 0px 14px rgba(45,143,139,0.35)",
    dotGlow: "0px 0px 8px rgba(45,143,139,0.40)",
  },
};

/**
 * The user bubble's 135° fill — desktop's
 * `bg-gradient-to-br from-primary-500/[0.13] to-surface-800/90`. Light mirrors
 * it onto white, since surface-800 is a navy that has no place on a light card.
 */
export const USER_BUBBLE_GRADIENT: Record<"light" | "dark", { from: string; fromOpacity: number; to: string; toOpacity: number }> = {
  dark: { from: "#3ABAB4", fromOpacity: 0.16, to: "#1A2744", toOpacity: 0.92 },
  light: { from: "#3ABAB4", fromOpacity: 0.18, to: "#FFFFFF", toOpacity: 0.95 },
};
