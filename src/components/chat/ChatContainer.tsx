import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n";
import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatContainerProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  isStreaming?: boolean;
  isCompacting?: boolean;
  onRevealStateChange?: (active: boolean) => void;
}

const ANCHOR_TOP_PADDING_PX = 16;
const MIN_BOTTOM_BUFFER_PX = 64;

export function ChatContainer({ messages, isLoading, isStreaming, isCompacting, onRevealStateChange }: ChatContainerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const revealingIdsRef = useRef<Set<string>>(new Set());
  const [anyRevealing, setAnyRevealing] = useState(false);

  const lastUserId = [...messages].reverse().find((m) => m.role === "user")?.id;
  const prevLastUserIdRef = useRef<string | undefined>(lastUserId);

  const recalcRef = useRef<() => void>(() => {});
  recalcRef.current = () => {
    const container = scrollContainerRef.current;
    const wrapper = contentWrapperRef.current;
    const spacer = spacerRef.current;
    if (!container || !wrapper || !spacer) return;
    const userEl = lastUserId ? document.getElementById(`msg-${lastUserId}`) : null;
    if (!userEl) {
      spacer.style.minHeight = `${MIN_BOTTOM_BUFFER_PX}px`;
      return;
    }
    const wrapperHeight = wrapper.offsetHeight;
    const spacerHeight = spacer.offsetHeight;
    const contentExcludingSpacer = wrapperHeight - spacerHeight;
    const userRect = userEl.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    const userTopInWrapper = userRect.top - wrapperRect.top;
    const belowUser = contentExcludingSpacer - userTopInWrapper;
    const desired = Math.max(MIN_BOTTOM_BUFFER_PX, container.clientHeight - belowUser - ANCHOR_TOP_PADDING_PX);
    spacer.style.minHeight = `${desired}px`;
  };

  useLayoutEffect(() => {
    recalcRef.current();
  }, [messages, isLoading, isCompacting]);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    const wrapper = contentWrapperRef.current;
    if (!container || !wrapper) return;
    const ro = new ResizeObserver(() => recalcRef.current());
    ro.observe(wrapper);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (lastUserId === prevLastUserIdRef.current) return;
    prevLastUserIdRef.current = lastUserId;
    if (!lastUserId) return;
    const container = scrollContainerRef.current;
    const el = document.getElementById(`msg-${lastUserId}`);
    if (!container || !el) return;
    recalcRef.current();
    const containerRect = container.getBoundingClientRect();
    const elementRect = el.getBoundingClientRect();
    const targetTop = container.scrollTop + (elementRect.top - containerRect.top) - ANCHOR_TOP_PADDING_PX;
    container.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
  }, [lastUserId]);

  useEffect(() => {
    onRevealStateChange?.(anyRevealing);
  }, [anyRevealing, onRevealStateChange]);

  const handleRevealStateChange = useCallback((id: string, active: boolean) => {
    const set = revealingIdsRef.current;
    const had = set.has(id);
    if (active) {
      if (!had) set.add(id);
    } else {
      if (!had) return;
      set.delete(id);
    }
    setAnyRevealing(set.size > 0);
  }, []);

  const showLoadingDots = isLoading && !isStreaming;

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-thin">
      <div ref={contentWrapperRef} className="max-w-3xl mx-auto px-4 py-6 min-h-full flex flex-col gap-6">
        {messages.length === 0 && !isLoading && !isStreaming && (
          <div className="flex items-center justify-center flex-1">
            <p className="text-[var(--text-muted)] text-sm">{t.chat.preparing}</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} id={`msg-${msg.id}`}>
            <ChatMessage
              message={msg}
              onRevealStateChange={(active) => handleRevealStateChange(msg.id, active)}
            />
          </div>
        ))}
        {showLoadingDots && (
          <div className="py-2">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:0ms]" />
              <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:150ms]" />
              <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        {isCompacting && (
          <div className="py-4 px-4 rounded-xl bg-primary-500/5 border border-primary-500/20">
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
              <span className="text-sm font-medium text-primary-400">{t.chat.compacting}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2 ml-7">
              {t.chat.compactingDescription}
            </p>
          </div>
        )}
        <div ref={spacerRef} aria-hidden className="shrink-0" />
      </div>
    </div>
  );
}
