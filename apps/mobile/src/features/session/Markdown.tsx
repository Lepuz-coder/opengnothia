import { useMemo } from "react";
import MarkdownDisplay from "@ronradtke/react-native-markdown-display";
import { useThemeColors } from "@/theme/useAppTheme";

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
      body: { color: text, fontSize: 16, lineHeight: 26 },
      paragraph: { marginTop: 0, marginBottom: 10 },
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
      code_inline: {
        backgroundColor: colors.canvas,
        color: text,
        borderRadius: 4,
        paddingHorizontal: 4,
      },
      fence: {
        backgroundColor: colors.canvas,
        borderColor: colors.line,
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
      },
      code_block: {
        backgroundColor: colors.canvas,
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
