import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AssistantMessageContentProps {
  content: string;
  isStreaming: boolean;
  onRevealProgress?: () => void;
  onRevealStateChange?: (active: boolean) => void;
}

const REVEAL_INTERVAL_MS = 12;
const STREAM_SETTLE_DELAY_MS = 140;

export function AssistantMessageContent({
  content,
  isStreaming,
  onRevealProgress,
  onRevealStateChange,
}: AssistantMessageContentProps) {
  const [displayedContent, setDisplayedContent] = useState(content);
  const [streamViewActive, setStreamViewActive] = useState(isStreaming);
  const sourceContentRef = useRef(content);
  const visibleContentRef = useRef(content);
  const pendingCharsRef = useRef<string[]>([]);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStreamingRef = useRef(isStreaming);
  const onRevealProgressRef = useRef(onRevealProgress);
  const onRevealStateChangeRef = useRef(onRevealStateChange);

  useEffect(() => {
    onRevealProgressRef.current = onRevealProgress;
    onRevealStateChangeRef.current = onRevealStateChange;
  });

  const clearRevealTimer = () => {
    if (revealTimerRef.current !== null) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
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
      if (pendingCharsRef.current.length > 0 || isStreamingRef.current) return;
      setStreamViewActive(false);
    }, STREAM_SETTLE_DELAY_MS);
  };

  const revealNextChar = () => {
    clearRevealTimer();

    const nextChar = pendingCharsRef.current.shift();
    if (!nextChar) {
      if (!isStreamingRef.current) {
        scheduleMarkdownRestore();
      }
      return;
    }

    clearSettleTimer();
    visibleContentRef.current += nextChar;
    setDisplayedContent(visibleContentRef.current);
    onRevealProgressRef.current?.();
    revealTimerRef.current = setTimeout(revealNextChar, REVEAL_INTERVAL_MS);
  };

  const ensureRevealLoop = () => {
    if (revealTimerRef.current !== null || pendingCharsRef.current.length === 0) return;
    revealTimerRef.current = setTimeout(revealNextChar, REVEAL_INTERVAL_MS);
  };

  const resetToContent = (nextContent: string, nextStreamingState: boolean) => {
    clearRevealTimer();
    clearSettleTimer();
    pendingCharsRef.current = [];
    sourceContentRef.current = nextContent;
    visibleContentRef.current = nextContent;
    setDisplayedContent(nextContent);
    setStreamViewActive(nextStreamingState);
  };

  useEffect(() => {
    isStreamingRef.current = isStreaming;

    if (isStreaming) {
      clearSettleTimer();
      if (!streamViewActive) {
        setStreamViewActive(true);
      }
      return;
    }

    if (pendingCharsRef.current.length === 0 && visibleContentRef.current === sourceContentRef.current) {
      scheduleMarkdownRestore();
    }
  }, [isStreaming, streamViewActive]);

  useEffect(() => {
    const previousSourceContent = sourceContentRef.current;
    if (content === previousSourceContent) return;

    if (!content.startsWith(previousSourceContent)) {
      resetToContent(content, isStreaming);
      return;
    }

    const nextChars = Array.from(content.slice(previousSourceContent.length));
    sourceContentRef.current = content;

    if (nextChars.length === 0) {
      if (!isStreaming && pendingCharsRef.current.length === 0) {
        scheduleMarkdownRestore();
      }
      return;
    }

    clearSettleTimer();
    if (!streamViewActive) {
      setStreamViewActive(true);
    }

    pendingCharsRef.current.push(...nextChars);
    ensureRevealLoop();
  }, [content, isStreaming, streamViewActive]);

  useEffect(() => {
    onRevealStateChangeRef.current?.(streamViewActive);
  }, [streamViewActive]);

  useEffect(() => {
    return () => {
      clearRevealTimer();
      clearSettleTimer();
      onRevealStateChangeRef.current?.(false);
    };
  }, []);

  if (!streamViewActive) {
    return (
      <div className="markdown-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="markdown-content streaming-text-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {displayedContent}
      </ReactMarkdown>
    </div>
  );
}
