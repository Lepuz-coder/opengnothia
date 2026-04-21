export interface MarkerStrippedStream {
  push: (chunk: string) => void;
  flush: () => void;
  cancel: () => void;
  hasMarker: () => boolean;
}

export function createMarkerStrippedStream(
  marker: string,
  onSafeChunk: (chunk: string) => void,
  flushDelayMs = 48,
): MarkerStrippedStream {
  let raw = "";
  let safeLen = 0;
  let pending = "";
  let timer: ReturnType<typeof setTimeout> | null = null;
  let markerSeen = false;

  const clearTimer = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const flushPending = () => {
    clearTimer();
    if (!pending) return;
    const chunk = pending;
    pending = "";
    onSafeChunk(chunk);
  };

  const scheduleFlush = () => {
    if (timer !== null) return;
    timer = setTimeout(flushPending, flushDelayMs);
  };

  const computeSafePrefix = (text: string): string => {
    let cleaned = text;
    if (cleaned.includes(marker)) {
      markerSeen = true;
      cleaned = cleaned.split(marker).join("");
    }
    for (let i = Math.min(marker.length - 1, cleaned.length); i > 0; i--) {
      if (marker.startsWith(cleaned.slice(-i))) {
        return cleaned.slice(0, -i);
      }
    }
    return cleaned;
  };

  return {
    push(chunk) {
      if (!chunk) return;
      raw += chunk;
      const safePrefix = computeSafePrefix(raw);
      if (safePrefix.length > safeLen) {
        pending += safePrefix.slice(safeLen);
        safeLen = safePrefix.length;
        scheduleFlush();
      }
    },
    flush() {
      let cleaned = raw;
      if (cleaned.includes(marker)) {
        markerSeen = true;
        cleaned = cleaned.split(marker).join("");
      }
      if (cleaned.length > safeLen) {
        pending += cleaned.slice(safeLen);
        safeLen = cleaned.length;
      }
      flushPending();
    },
    cancel() {
      clearTimer();
      pending = "";
    },
    hasMarker() {
      return markerSeen;
    },
  };
}
