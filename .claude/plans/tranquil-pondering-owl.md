# Lesson Progress Bar & Token Display

## Context

The Courses feature is implemented. The user wants two improvements to the lesson view:

1. **Progress indicator**: A visual progress bar showing how close the user is to completing the current step. AI should return a progress percentage with every response (e.g. `<<<PROGRESS:45>>>`), and a bar should be visible in the header.
2. **Model & token info**: The lesson header should show the model name and token usage bar, identical to how `SessionPage.tsx` displays it during active sessions.

---

## Plan

### 1. AI Progress Reporting via Marker

**File:** `src/services/ai/coursePromptBuilder.ts`

Add a progress marker protocol to the system prompt. The AI will append `<<<PROGRESS:XX>>>` (where XX is 0-100) at the end of **every** response. This is stripped from display, just like `<<<STEP_COMPLETE>>>`.

Add to the system prompt (after existing completion protocol):

```
Progress reporting protocol:
- At the END of EVERY response, on a new line, append a progress marker: <<<PROGRESS:XX>>>
  where XX is a number from 0 to 100 indicating how close the student is to completing this lesson.
- 0 = just started, the student hasn't engaged yet
- 30-50 = student is engaging, asking questions, beginning to understand
- 60-80 = student shows good understanding, getting close to completion
- 90-99 = student has nearly mastered the topic, one or two more exchanges
- When you output <<<STEP_COMPLETE>>>, set progress to 100: <<<PROGRESS:100>>>
- The progress marker must come BEFORE the <<<STEP_COMPLETE>>> marker if both are present
- NEVER mention progress numbers to the student
```

### 2. Store: Add `lessonProgress` State

**File:** `src/stores/useCourseStore.ts`

- Add `lessonProgress: number` to state (default `0`)
- Add `setLessonProgress: (n: number) => void` action
- Reset to `0` in `startLesson` and `reset`

### 3. Parse Progress Marker in CoursesPage

**File:** `src/pages/CoursesPage.tsx`

In both the greeting `onContent`/`onDone` and `handleSendMessage` `onContent`/`onDone` callbacks:

- Strip `<<<PROGRESS:\d+>>>` from display content (same pattern as `<<<STEP_COMPLETE>>>`)
- On `onDone`, extract the progress value with regex: `accumulatedContent.match(/<<<PROGRESS:(\d+)>>>/)`
- If found, call `useCourseStore.getState().setLessonProgress(parsedValue)`
- When `<<<STEP_COMPLETE>>>` is detected, set progress to 100

### 4. Add Progress Bar + Token Display to Lesson Header

**File:** `src/pages/CoursesPage.tsx`

Add a `formatTokenCount` utility (same as SessionPage):

```typescript
function formatTokenCount(n: number): string {
  if (n === 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
```

Update the lesson header's right side (currently just the overflow menu) to include:

```
[Progress bar: colored pill showing X%] | [Model name] [Token bar XX/YYK] | [⋮ menu]
```

- **Progress bar**: A small colored bar/pill showing `store.lessonProgress`%. Color: green gradient. Text: `{progress}%`.
- **Token display**: Reuse the exact pattern from SessionPage — compute `providerConfig`, `modelConfig`, `contextWindow`, `modelName`, `usagePercent`, `tokenBarColor` from `settings` and `store.currentInputTokens`.

Need to import `getProvider` from `@/constants/providers` (already imported in CoursesPage).

### 5. Persist Progress in DB (Optional Enhancement)

The progress value is transient (lives in store only during the lesson). When the user leaves and returns, it resets to 0. This is acceptable because:
- If the step is `completed`, the bar shows 100%
- If `in_progress`, it starts at 0 and AI will re-assess after the first exchange

No DB changes needed.

---

## Files to Modify

1. `src/services/ai/coursePromptBuilder.ts` — Add progress marker to system prompt
2. `src/stores/useCourseStore.ts` — Add `lessonProgress` state + setter
3. `src/pages/CoursesPage.tsx` — Parse progress marker, add progress bar + token display to header

## Verification

1. Open a course lesson → AI greets → header shows progress ~0-10%
2. Converse with AI → progress bar updates after each AI response (increasing toward 100)
3. AI completes the step → progress shows 100%, completion banner appears
4. Token usage bar and model name visible in header throughout
5. Progress/token markers never visible in chat messages
