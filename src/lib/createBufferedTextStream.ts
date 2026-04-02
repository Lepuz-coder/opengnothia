export interface BufferedTextStream {
  push: (chunk: string) => void;
  flush: () => void;
  cancel: () => void;
}

export function createBufferedTextStream(
  onFlush: (chunk: string) => void,
  flushDelayMs = 48,
): BufferedTextStream {
  let pendingChunk = "";
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const flush = () => {
    clearTimer();
    if (!pendingChunk) return;

    const chunk = pendingChunk;
    pendingChunk = "";
    onFlush(chunk);
  };

  return {
    push: (chunk) => {
      if (!chunk) return;
      pendingChunk += chunk;
      if (timer !== null) return;
      timer = setTimeout(flush, flushDelayMs);
    },
    flush,
    cancel: () => {
      clearTimer();
      pendingChunk = "";
    },
  };
}
