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
  let rawTail = "";
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
    if (flushDelayMs <= 0) {
      flushPending();
      return;
    }
    if (timer !== null) return;
    timer = setTimeout(flushPending, flushDelayMs);
  };

  const stripCompleteMarkers = () => {
    let markerIndex = rawTail.indexOf(marker);
    while (markerIndex !== -1) {
      markerSeen = true;
      pending += rawTail.slice(0, markerIndex);
      rawTail = rawTail.slice(markerIndex + marker.length);
      markerIndex = rawTail.indexOf(marker);
    }
  };

  const getMarkerPrefixSuffixLength = (text: string) => {
    for (let i = Math.min(marker.length - 1, text.length); i > 0; i--) {
      if (marker.startsWith(text.slice(-i))) {
        return i;
      }
    }
    return 0;
  };

  const moveSafeTailToPending = () => {
    stripCompleteMarkers();
    const unsafeTailLength = getMarkerPrefixSuffixLength(rawTail);
    const safeLength = rawTail.length - unsafeTailLength;
    if (safeLength <= 0) return;
    pending += rawTail.slice(0, safeLength);
    rawTail = rawTail.slice(safeLength);
  };

  return {
    push(chunk) {
      if (!chunk) return;
      rawTail += chunk;
      const previousPendingLength = pending.length;
      moveSafeTailToPending();
      if (pending.length > previousPendingLength) {
        scheduleFlush();
      }
    },
    flush() {
      stripCompleteMarkers();
      pending += rawTail;
      rawTail = "";
      flushPending();
    },
    cancel() {
      clearTimer();
      rawTail = "";
      pending = "";
    },
    hasMarker() {
      return markerSeen;
    },
  };
}
