# Plan: Persist Lesson Progress to Database

## Context
AI-driven lesson progress (`<<<PROGRESS:N>>>` markers) is only stored in the Zustand store. When a user leaves a lesson and returns, `startLesson` resets `lessonProgress` to 0. The user wants:
1. Progress persisted to the DB so it survives navigation
2. Progress visible in the lesson header (already exists, just needs correct initial value)
3. Progress visible in the JourneyMapView step list

## Changes

### 1. New migration: `015_add_course_step_progress.sql`
Add `progress INTEGER DEFAULT 0` column to `course_progress` table.

```sql
ALTER TABLE course_progress ADD COLUMN progress INTEGER DEFAULT 0;
```

**File:** `src-tauri/migrations/015_add_course_step_progress.sql`

### 2. Register migration in `src-tauri/src/lib.rs`
Add migration entry (version 15) after the existing version 14 entry.

### 3. Update `CourseStepProgress` type in `src/types/index.ts`
Add `progress: number` field.

### 4. Add `updateCourseStepProgress` query in `src/services/db/queries.ts`
```ts
export async function updateCourseStepProgress(courseId: string, stepIndex: number, progress: number): Promise<void>
```
Updates the `progress` column for a given course step.

### 5. Update `CoursesPage.tsx` - LessonView init
In the `init()` function (~line 354), after `store.startLesson()`, load the saved progress:
```ts
if (isCompleted) {
  store.setLessonProgress(100);
} else if (progress?.progress) {
  store.setLessonProgress(progress.progress);
}
```

### 6. Update `CoursesPage.tsx` - Save progress on change
In both `sendGreeting` and `handleSendMessage` `onDone` callbacks, after extracting progress and calling `setLessonProgress`, also persist to DB:
```ts
if (progress !== null) {
  useCourseStore.getState().setLessonProgress(progress);
  updateCourseStepProgress(course.id, stepIndex, progress);
}
```
Also save progress=100 when `<<<STEP_COMPLETE>>>` is detected.

### 7. Update `CoursesPage.tsx` - JourneyMapView step list
Show a small progress bar or percentage under each in-progress step. The `CourseStepProgress` data is already loaded in `steps` state. Add a thin progress bar below the step title for steps with `status === "in_progress"` and `progress > 0`.

## Files to modify
1. `src-tauri/migrations/015_add_course_step_progress.sql` (new)
2. `src-tauri/src/lib.rs` (~line 378)
3. `src/types/index.ts` (~line 177)
4. `src/services/db/queries.ts` (~line 660)
5. `src/pages/CoursesPage.tsx` (LessonView init, onDone callbacks, JourneyMapView)

## Verification
1. Build with `npm run tauri dev` to confirm migration runs
2. Start a lesson, let AI respond with progress markers, navigate away, return - progress bar should show saved value
3. Check JourneyMapView shows per-step progress for in_progress steps
