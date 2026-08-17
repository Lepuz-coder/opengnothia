# AI-Initiated Session Ending

## Context

Right now, a session can only end when the user clicks "End Session" in the controls bar. The AI has no mechanism to close a session naturally, and no awareness of session duration. We want the AI to behave like a real psychologist: when a topic has been meaningfully worked through, it should ask the client whether they want to wrap up. If the client agrees, the AI sends a final warm closing message with a hidden sentinel token. The app detects the token, strips it from what the user sees, and automatically transitions into the existing post-session summary flow.

The AI must **never** cut a topic off mid-exploration. The trigger is "subject feels processed + enough has been said," judged by the AI based on conversation depth and elapsed session time (which we currently do not surface to the AI).

Follows the existing `<<<SCHOOL:school_id>>>` / `<<<STEP_COMPLETE>>>` sentinel pattern already used in [useSchoolRecommendation.ts:63-102](src/hooks/useSchoolRecommendation.ts) and [CoursesPage.tsx:1087](src/pages/CoursesPage.tsx).

## Design

**Sentinel marker:** `<<<SESSION_END>>>` — emitted by the AI **only** in the assistant message that acknowledges the user's confirmation to end. Placed on a new line, as the last thing in the message.

**Conversational flow:**
1. AI judges (from elapsed time + topic depth) that closing is appropriate.
2. AI asks in natural language, e.g. _"We've covered a lot. Would you like to wrap up here, or is there something else on your mind?"_ — **no marker yet**.
3. User replies (continue or end).
4. If the user confirms ending, AI's next message is a warm closing (validate, summarize the gist, wish well) and ends with `\n<<<SESSION_END>>>`.
5. If the user wants to keep going, AI continues normally without the marker.

**Detection:** a new `createMarkerStrippedStream` wraps content streaming. It strips the marker (and any trailing partial marker) from display and from voice TTS feed, and exposes `hasMarker()` on `onDone`. When `hasMarker()` is true, the page pauses the voice loop (if active), waits ~2.5s so the user can read the final message, then calls the existing `handleEndSession()` which transitions to the post-session summary.

**Time awareness:** we pass the session's elapsed minutes into `buildSystemPrompt` so the AI can factor it into its judgment.

## Files

### 1. New file — `src/lib/createMarkerStrippedStream.ts`

A buffered text stream that strips a fixed marker. Replaces `createBufferedTextStream` usage for the **content** streams (not thinking, not summary). API:

```ts
export interface MarkerStrippedStream {
  push: (chunk: string) => void;
  flush: () => void;
  cancel: () => void;
  hasMarker: () => boolean;
}

export function createMarkerStrippedStream(
  marker: string,
  onSafeChunk: (chunk: string) => void,
  flushDelayMs?: number, // default 48, mirrors createBufferedTextStream
): MarkerStrippedStream;
```

Behavior:
- Accumulates raw text.
- On each push, computes a "safe prefix" = raw with every complete `marker` removed, minus any trailing suffix that is a prefix of `marker` (held back in case the marker is still being streamed).
- Emits only newly-safe characters via the same `setTimeout(..., flushDelayMs)` batching as `createBufferedTextStream`.
- `flush()` forces-removes the marker entirely and emits the remainder.
- `hasMarker()` returns whether the full marker ever appeared in the raw stream.

### 2. `src/services/ai/promptBuilder.ts`

**Add the sentinel constant near line 25:**

```ts
export const SESSION_END_MARKER = "<<<SESSION_END>>>";
```

**Extend `buildSystemPrompt` params (line 43) and `buildGreetingPrompt` params (line 149):**

Add `sessionStartedAt?: string | null` (ISO). When present, compute `minutesElapsed = Math.floor((Date.now() - new Date(sessionStartedAt).getTime()) / 60000)` and inject into the existing **Temporal context** block (around line 84):

```
- Current session duration: X minutes (started at HH:MM)
```

**Append a new `--- Session Closure ---` section at the bottom of `buildSystemPrompt` (after the patient-notes block, before `return prompt`):**

Content (English; `getLanguageInstruction` at top already forces user's language at output):

```
--- Session Closure ---
You are running this like a real therapy session. You may propose ending the session when:
- A meaningful amount of the current topic has been worked through (not left mid-exploration)
- The conversation has reached a natural reflective/landing point
- The session has been going for a reasonable duration (typically at least 15–20 minutes of real exchange)
- OR the client explicitly signals they want to stop

Never cut a topic off prematurely. If the client just opened a new thread, stay with it.

When you judge it is time, FIRST ask the client in natural conversation whether they would like to wrap up or if there is anything else they want to bring up. Do NOT output any marker at this point — this is just a normal message with a gentle closing question.

ONLY after the client confirms they want to end (in their reply), write one final warm closing message: briefly reflect what was worked through, offer a supportive send-off, and on a NEW LINE as the very last thing in the message output EXACTLY:
<<<SESSION_END>>>

CRITICAL rules for the marker:
- It is invisible to the client — never reference it or acknowledge it exists.
- Output it only in the message that follows the client's confirmation to end.
- If the client wants to keep talking, do NOT output the marker; continue the session normally.
- The marker must be the very last characters in the message, on its own line.
- Never output the marker during the opening or early exchanges of a session.
```

**For `buildGreetingPrompt`:** no closure section needed; but pass `sessionStartedAt` through so `buildSystemPrompt` shows the elapsed time (which will be ~0 at greeting — harmless).

### 3. `src/pages/SessionPage.tsx`

**Imports:** add `createMarkerStrippedStream` from `@/lib/createMarkerStrippedStream` and `SESSION_END_MARKER` from `@/services/ai/promptBuilder`.

**`handleGreeting` (around lines 159–255):**
- Pass `sessionStartedAt: session.startedAt` into `buildGreetingPrompt`.
- Replace the local `contentStream = createBufferedTextStream(...)` with:
  ```ts
  const contentStream = createMarkerStrippedStream(SESSION_END_MARKER, (safeChunk) => {
    useSessionStore.getState().appendStreamContent(safeChunk);
  });
  ```
- Inside the existing `onContent`, change the call so the voice feed receives the **same stripped chunk**, not the raw chunk. The cleanest way: move the voice-feed call into the `onSafeChunk` callback above:
  ```ts
  const contentStream = createMarkerStrippedStream(SESSION_END_MARKER, (safeChunk) => {
    useSessionStore.getState().appendStreamContent(safeChunk);
    if (useSessionStore.getState().sessionMode === "voice") {
      voiceFeedRef.current(safeChunk);
    }
  });
  ```
  and simplify `onContent` to just `contentStream.push(chunk)`.
- `onDone` is unchanged except: greetings won't emit the marker (no closure logic in the greeting prompt), but the stream still flushes correctly.

**`handleSendMessage` (around lines 327–449):**
- Pass `sessionStartedAt: session.startedAt` into `buildSystemPrompt`.
- Apply the same `createMarkerStrippedStream` replacement as above.
- In `onDone`, after `finishStreaming()` + message persistence + optional `voiceFlushRef.current()`, add marker check:
  ```ts
  if (contentStream.hasMarker()) {
    // Prevent the voice loop from opening the mic for another user turn.
    if (useSessionStore.getState().sessionMode === "voice") {
      voiceLoop.pauseLoop();
    }
    // Give the user a couple of seconds to read/hear the closing message.
    setTimeout(() => {
      handleEndSession();
    }, 2500);
  }
  ```
- `handleEndSession` already guards `if (isStreaming) return`, stops the voice loop, and (because `userMessageCount >= 2` by the time the AI proposes closure) will route into the summary streaming flow — no changes needed there.

**`performCompaction` (line 257):** also calls `buildSystemPrompt`. Pass `sessionStartedAt: session.startedAt` for consistency. Compaction doesn't produce user-facing content, so no marker-stream swap is needed.

**Hoist `handleEndSession`:** it's declared at line 614, which is **after** `handleSendMessage` uses it transitively through `setTimeout`. Because the timeout call is lazy (reads `handleEndSession` from closure at fire time), we need to ensure the reference is stable. Two options:
- (Preferred) Move `handleEndSession` above `handleSendMessage`. Its only external deps are `settings`, `navigate`, `setSidebarHidden`, `language`, `t`, and `voiceLoop` — all available at that earlier point.
- Or: keep a `handleEndSessionRef = useRef<() => void>()` updated after definition, and call `handleEndSessionRef.current?.()` from the timeout. Simpler but uglier.

Go with hoisting.

### 4. i18n

No new strings required: the AI generates its own natural-language ask in the user's language (language is already passed into every prompt). The existing `t.session.endSession*` strings still power the manual end-button confirmation modal — untouched.

## What stays untouched

- `useSessionStore` — no state shape changes. `handleEndSession` already transitions `status` → `"post"` and handles everything downstream.
- Post-session summary / insight extraction / background patient-notes — all trigger off `handleEndSession` as they do today.
- Manual end-button flow (controls bar → confirm modal) — untouched and still works.
- Course / school-recommendation marker systems — untouched.

## Verification

1. **Read-through** [src/lib/createMarkerStrippedStream.ts](src/lib/createMarkerStrippedStream.ts) unit-style mental test: feed `"bye\n<<<"` then `"SESSION_END>>>"`; expect `onSafeChunk` to emit `"bye"` (newline+partial held back), then on flush emit `""` (marker fully stripped). Feed `"bye\n<<<SESS"` alone then flush; expect `onSafeChunk` to emit `"bye\n<<<SESS"` (incomplete marker kept, since stream ended and it never completed). `hasMarker()` only true in the first case.

2. **Run the app** (`bun run tauri dev` or equivalent from repo root):
   - Start a chat session. Talk for 2–3 short turns. Confirm AI does NOT output the marker early (defensive check — the prompt forbids it).
   - Talk for a realistic duration / depth (or temporarily lower the "15–20 minutes" guidance for testing). When AI asks "would you like to wrap up?", reply yes.
   - Expected: AI sends one more warm closing message, no visible `<<<SESSION_END>>>` in the UI, and ~2.5s later the page transitions to the post-session summary stream.
   - Verify persisted messages in DB (`updateSessionMessages`) do not contain the marker — they come from `appendStreamContent` which received stripped chunks.

3. **Voice mode:**
   - Start a voice session. Same flow. Confirm TTS does NOT speak the marker (voice feed receives stripped chunks).
   - Confirm the mic does not re-open after the closing message (we pauseLoop before the 2.5s timeout).
   - Confirm transition to summary view after the timeout.

4. **Edge — user wants to keep going:**
   - When AI asks "wrap up?", reply "no, actually…". AI should continue normally; no marker; session stays in `active`.

5. **Edge — user clicks the manual End button during/after AI's ask:**
   - Manual flow unchanged; `endConfirmOpen` modal → `handleEndSession()`.

6. **Token tracking:** unchanged — `onUsage` still fires and `trackUsage` saves the `"chat"` call with the marker present in the raw response. That's fine — costs are counted on tokens, not on displayed text.

## Critical files

- New: [src/lib/createMarkerStrippedStream.ts](src/lib/createMarkerStrippedStream.ts)
- [src/services/ai/promptBuilder.ts](src/services/ai/promptBuilder.ts) — add `SESSION_END_MARKER`, add `sessionStartedAt` param + closure section to `buildSystemPrompt` and propagate through `buildGreetingPrompt`
- [src/pages/SessionPage.tsx](src/pages/SessionPage.tsx) — swap content stream to marker-stripped version in `handleGreeting` (159) and `handleSendMessage` (327); pass `sessionStartedAt` into prompt builders in all three call sites (`handleGreeting`, `handleSendMessage`, `performCompaction`); hoist `handleEndSession` above `handleSendMessage`; add marker-detected auto-end in `handleSendMessage`'s `onDone`
