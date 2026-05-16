import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AssistantMessageContentProps {
  content: string;
  isStreaming: boolean;
  onRevealStateChange?: (active: boolean) => void;
  revealStreamingText?: boolean;
}

const STREAM_SETTLE_DELAY_MS = 140;
const MARKDOWN_PLUGINS = [remarkGfm];

function getRevealBatchSize(pendingLength: number) {
  if (pendingLength > 600) return 80;
  if (pendingLength > 240) return 48;
  if (pendingLength > 96) return 24;
  if (pendingLength > 32) return 12;
  return Math.max(1, Math.ceil(pendingLength / 4));
}

type StreamingBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; depth: 1 | 2 | 3; text: string }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[]; start: number }
  | { type: "blockquote"; text: string }
  | { type: "code"; text: string }
  | { type: "hr" };

const headingPattern = /^(#{1,3})\s+(.+)$/;
const unorderedItemPattern = /^\s*[-*+]\s+(.+)$/;
const orderedItemPattern = /^\s*(\d+)[.)]\s+(.+)$/;
const blockquotePattern = /^\s*>\s?(.*)$/;
const fencePattern = /^\s*```/;
const hrPattern = /^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/;

function isStreamingBlockStart(line: string) {
  return (
    headingPattern.test(line) ||
    unorderedItemPattern.test(line) ||
    orderedItemPattern.test(line) ||
    blockquotePattern.test(line) ||
    fencePattern.test(line) ||
    hrPattern.test(line)
  );
}

function parseStreamingBlocks(content: string): StreamingBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: StreamingBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (fencePattern.test(line)) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !fencePattern.test(lines[i])) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push({ type: "code", text: codeLines.join("\n") });
      continue;
    }

    const headingMatch = line.match(headingPattern);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        depth: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2].trim(),
      });
      i += 1;
      continue;
    }

    if (hrPattern.test(line)) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    const unorderedMatch = line.match(unorderedItemPattern);
    if (unorderedMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const match = lines[i].match(unorderedItemPattern);
        if (!match) break;
        items.push(match[1].trim());
        i += 1;
      }
      blocks.push({ type: "unordered-list", items });
      continue;
    }

    const orderedMatch = line.match(orderedItemPattern);
    if (orderedMatch) {
      const items: string[] = [];
      const start = Number(orderedMatch[1]);
      while (i < lines.length) {
        const match = lines[i].match(orderedItemPattern);
        if (!match) break;
        items.push(match[2].trim());
        i += 1;
      }
      blocks.push({ type: "ordered-list", items, start });
      continue;
    }

    const blockquoteMatch = line.match(blockquotePattern);
    if (blockquoteMatch) {
      const quoteLines: string[] = [];
      while (i < lines.length) {
        const match = lines[i].match(blockquotePattern);
        if (!match) break;
        quoteLines.push(match[1].trim());
        i += 1;
      }
      blocks.push({ type: "blockquote", text: quoteLines.join(" ") });
      continue;
    }

    const paragraphLines: string[] = [];
    while (i < lines.length && lines[i].trim()) {
      if (paragraphLines.length > 0 && isStreamingBlockStart(lines[i])) break;
      paragraphLines.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks;
}

function StreamingTextContent({ content }: { content: string }) {
  const blocks = useMemo(() => parseStreamingBlocks(content), [content]);

  return (
    <div className="markdown-content streaming-text-content">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return <p key={index}>{block.text}</p>;
        }
        if (block.type === "heading") {
          const Heading = `h${block.depth}` as "h1" | "h2" | "h3";
          return <Heading key={index}>{block.text}</Heading>;
        }
        if (block.type === "unordered-list") {
          return (
            <ul key={index}>
              {block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
            </ul>
          );
        }
        if (block.type === "ordered-list") {
          return (
            <ol key={index} start={block.start}>
              {block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
            </ol>
          );
        }
        if (block.type === "blockquote") {
          return <blockquote key={index}>{block.text}</blockquote>;
        }
        if (block.type === "code") {
          return (
            <pre key={index}>
              <code>{block.text}</code>
            </pre>
          );
        }
        return <hr key={index} />;
      })}
    </div>
  );
}

export function AssistantMessageContent({
  content,
  isStreaming,
  onRevealStateChange,
  revealStreamingText = true,
}: AssistantMessageContentProps) {
  const [displayedContent, setDisplayedContent] = useState(content);
  const [streamViewActive, setStreamViewActive] = useState(revealStreamingText && isStreaming);
  const sourceContentRef = useRef(content);
  const visibleContentRef = useRef(content);
  const pendingTextRef = useRef("");
  const revealFrameRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStreamingRef = useRef(isStreaming);
  const onRevealStateChangeRef = useRef(onRevealStateChange);

  useEffect(() => {
    onRevealStateChangeRef.current = onRevealStateChange;
  });

  const cancelRevealFrame = () => {
    if (revealFrameRef.current !== null) {
      cancelAnimationFrame(revealFrameRef.current);
      revealFrameRef.current = null;
    }
  };

  const clearSettleTimer = () => {
    if (settleTimerRef.current !== null) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  };

  const scheduleMarkdownRestore = () => {
    clearSettleTimer();
    settleTimerRef.current = setTimeout(() => {
      if (pendingTextRef.current.length > 0 || isStreamingRef.current) return;
      setStreamViewActive(false);
    }, STREAM_SETTLE_DELAY_MS);
  };

  const revealNextFrame = () => {
    revealFrameRef.current = null;

    if (!pendingTextRef.current) {
      if (!isStreamingRef.current) {
        scheduleMarkdownRestore();
      }
      return;
    }

    clearSettleTimer();
    const batchSize = getRevealBatchSize(pendingTextRef.current.length);
    const nextText = pendingTextRef.current.slice(0, batchSize);
    pendingTextRef.current = pendingTextRef.current.slice(batchSize);
    visibleContentRef.current += nextText;
    setDisplayedContent(visibleContentRef.current);

    if (pendingTextRef.current) {
      ensureRevealLoop();
    } else if (!isStreamingRef.current) {
      scheduleMarkdownRestore();
    }
  };

  const ensureRevealLoop = () => {
    if (revealFrameRef.current !== null || pendingTextRef.current.length === 0) return;
    revealFrameRef.current = requestAnimationFrame(revealNextFrame);
  };

  const resetToContent = (nextContent: string, nextStreamingState: boolean) => {
    cancelRevealFrame();
    clearSettleTimer();
    pendingTextRef.current = "";
    sourceContentRef.current = nextContent;
    visibleContentRef.current = nextContent;
    setDisplayedContent(nextContent);
    setStreamViewActive(nextStreamingState);
  };

  useEffect(() => {
    isStreamingRef.current = isStreaming;

    if (!revealStreamingText) {
      cancelRevealFrame();
      clearSettleTimer();
      pendingTextRef.current = "";
      if (streamViewActive) {
        setStreamViewActive(false);
      }
      return;
    }

    if (isStreaming) {
      clearSettleTimer();
      if (!streamViewActive) {
        setStreamViewActive(true);
      }
      ensureRevealLoop();
      return;
    }

    if (pendingTextRef.current.length === 0 && visibleContentRef.current === sourceContentRef.current) {
      scheduleMarkdownRestore();
    }
  }, [isStreaming, streamViewActive, revealStreamingText]);

  useEffect(() => {
    if (!revealStreamingText) {
      cancelRevealFrame();
      clearSettleTimer();
      pendingTextRef.current = "";
      sourceContentRef.current = content;
      visibleContentRef.current = content;
      setDisplayedContent(content);
      if (streamViewActive) {
        setStreamViewActive(false);
      }
      return;
    }

    const previousSourceContent = sourceContentRef.current;
    if (content === previousSourceContent) return;

    if (!content.startsWith(previousSourceContent)) {
      resetToContent(content, isStreaming);
      return;
    }

    const nextText = content.slice(previousSourceContent.length);
    sourceContentRef.current = content;

    if (!nextText) {
      if (!isStreaming && pendingTextRef.current.length === 0) {
        scheduleMarkdownRestore();
      }
      return;
    }

    clearSettleTimer();
    if (!streamViewActive) {
      setStreamViewActive(true);
    }

    pendingTextRef.current += nextText;
    ensureRevealLoop();
  }, [content, isStreaming, streamViewActive, revealStreamingText]);

  useEffect(() => {
    onRevealStateChangeRef.current?.(revealStreamingText && streamViewActive);
  }, [streamViewActive, revealStreamingText]);

  useEffect(() => {
    return () => {
      cancelRevealFrame();
      clearSettleTimer();
      onRevealStateChangeRef.current?.(false);
    };
  }, []);

  if (!revealStreamingText) {
    return (
      <div className={`markdown-content${isStreaming ? " streaming-text-content" : ""}`}>
        <ReactMarkdown remarkPlugins={MARKDOWN_PLUGINS}>
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  if (!streamViewActive) {
    return (
      <div className="markdown-content">
        <ReactMarkdown remarkPlugins={MARKDOWN_PLUGINS}>
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <StreamingTextContent content={displayedContent} />
  );
}
