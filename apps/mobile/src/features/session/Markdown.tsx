import { useMemo } from "react";
import MarkdownDisplay from "@ronradtke/react-native-markdown-display";
import { useThemeColors } from "@/theme/useAppTheme";

/**
 * Desktop's chat prose metrics — `text-base leading-relaxed`, i.e. 16px over
 * 1.625.
 *
 * These must be explicit numbers rather than NativeWind classes. Tailwind emits
 * `text-base` as `1rem`, and react-native-css-interop's rem is 14 (RN's default
 * font size, not the web's 16), so `text-base leading-relaxed` actually renders
 * 14px/23 — visibly smaller than this renderer. Anything that has to sit flush
 * with markdown output (the streaming branch, the user bubble) spreads this.
 */
export const PROSE_TEXT = { fontSize: 16, lineHeight: 26 } as const;

/** Markdown's gap between paragraphs, for surfaces mirroring its rhythm. */
export const PROSE_PARAGRAPH_GAP = 10;

/**
 * Theme-aware markdown for AI output (Step 40). Session replies are prose by
 * prompt design, but summaries and the Faz 6 analyses use real markdown, so
 * one shared renderer beats a per-surface inline parser. Styles are values,
 * not classNames — the library renders plain RN primitives.
 */
export function Markdown({ children, muted = false }: { children: string; muted?: boolean }) {
  const { colors } = useThemeColors();

  const style = useMemo(() => {
    const text = muted ? colors.inkMute : colors.ink;
    return {
      body: { color: text, ...PROSE_TEXT },
      paragraph: { marginTop: 0, marginBottom: PROSE_PARAGRAPH_GAP },
      heading1: { color: colors.ink, fontSize: 22, fontWeight: "700" as const, marginTop: 12, marginBottom: 6 },
      heading2: { color: colors.ink, fontSize: 19, fontWeight: "700" as const, marginTop: 12, marginBottom: 6 },
      heading3: { color: colors.ink, fontSize: 17, fontWeight: "600" as const, marginTop: 10, marginBottom: 4 },
      strong: { fontWeight: "700" as const },
      em: { fontStyle: "italic" as const },
      bullet_list: { marginBottom: 10 },
      ordered_list: { marginBottom: 10 },
      list_item: { marginBottom: 4 },
      bullet_list_icon: { color: text },
      ordered_list_icon: { color: text },
      blockquote: {
        backgroundColor: "transparent",
        borderLeftWidth: 3,
        borderLeftColor: colors.line,
        paddingLeft: 12,
        marginLeft: 0,
        opacity: 0.9,
      },
      hr: { backgroundColor: colors.line, marginVertical: 12 },
      // Desktop fills code on surface-700 (`raised`); canvas now carries the
      // aurora, so code blocks would otherwise dissolve into the background.
      code_inline: {
        backgroundColor: colors.raised,
        color: text,
        borderRadius: 4,
        paddingHorizontal: 4,
      },
      fence: {
        backgroundColor: colors.raised,
        borderColor: colors.line,
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
      },
      code_block: {
        backgroundColor: colors.raised,
        borderColor: colors.line,
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
      },
      link: { color: colors.tint },
    };
  }, [colors, muted]);

  return <MarkdownDisplay style={style}>{children}</MarkdownDisplay>;
}
