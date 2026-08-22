import type { DatabasePort } from "./port";
import type { CheckIn, Dream, Session, UserProfile, PatientIntakeForm, ChatMessage, SessionSummary, TokenUsageRecord, JournalEntry, MoodEntry, WeeklySummary, InsightGroup, Insight, CourseStepProgress } from "../types";

// Patient Intake Form
const INTAKE_FORM_FIELDS = [
  "reason_for_seeking",
  "current_concerns",
  "previous_therapy",
  "current_medications",
  "family_relationships",
  "significant_life_events",
  "sleep_patterns",
  "physical_health",
  "strengths_support",
  "therapy_expectations",
] as const;

export function intakeFormHasContent(form: PatientIntakeForm | null): boolean {
  if (!form) return false;
  return INTAKE_FORM_FIELDS.some((field) => {
    const v = form[field];
    return typeof v === "string" && v.trim().length > 0;
  });
}

export function countFilledIntakeFields(form: PatientIntakeForm | null): number {
  if (!form) return 0;
  return INTAKE_FORM_FIELDS.filter((field) => {
    const v = form[field];
    return typeof v === "string" && v.trim().length > 0;
  }).length;
}

export const INTAKE_FORM_TOTAL_FIELDS = INTAKE_FORM_FIELDS.length;

export function createQueries(db: DatabasePort) {
  // User Profile
  async function getUserProfile(): Promise<UserProfile | null> {
    const rows = await db.select<UserProfile>("SELECT * FROM user_profile WHERE id = 1");
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      ...row,
      goals: typeof row.goals === "string" ? JSON.parse(row.goals) : row.goals ?? [],
    };
  }

  async function upsertUserProfile(
    data: Partial<Pick<UserProfile, "name" | "age" | "gender" | "occupation" | "goals" | "approach" | "preferred_session_time" | "session_duration_minutes">>
  ): Promise<void> {
    const existing = await getUserProfile();
    if (existing) {
      const sets: string[] = [];
      const values: unknown[] = [];
      if (data.name !== undefined) { sets.push("name = ?"); values.push(data.name); }
      if (data.age !== undefined) { sets.push("age = ?"); values.push(data.age); }
      if (data.gender !== undefined) { sets.push("gender = ?"); values.push(data.gender); }
      if (data.occupation !== undefined) { sets.push("occupation = ?"); values.push(data.occupation); }
      if (data.goals !== undefined) { sets.push("goals = ?"); values.push(JSON.stringify(data.goals)); }
      if (data.approach !== undefined) { sets.push("approach = ?"); values.push(data.approach); }
      if (data.preferred_session_time !== undefined) { sets.push("preferred_session_time = ?"); values.push(data.preferred_session_time); }
      if (data.session_duration_minutes !== undefined) { sets.push("session_duration_minutes = ?"); values.push(data.session_duration_minutes); }
      sets.push("updated_at = CURRENT_TIMESTAMP");
      await db.execute(`UPDATE user_profile SET ${sets.join(", ")} WHERE id = 1`, values);
    } else {
      await db.execute(
        "INSERT INTO user_profile (id, name, age, gender, occupation, goals, approach, preferred_session_time, session_duration_minutes) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)",
        [data.name ?? null, data.age ?? null, data.gender ?? null, data.occupation ?? null, JSON.stringify(data.goals ?? []), data.approach ?? "balanced", data.preferred_session_time ?? "20:00", data.session_duration_minutes ?? 50]
      );
    }
  }

  async function getPatientIntakeForm(): Promise<PatientIntakeForm | null> {
    const rows = await db.select<PatientIntakeForm>("SELECT * FROM patient_intake_form WHERE id = 1");
    return rows[0] ?? null;
  }

  async function upsertPatientIntakeForm(
    data: Partial<Omit<PatientIntakeForm, "id" | "created_at" | "updated_at">>
  ): Promise<void> {
    const existing = await getPatientIntakeForm();
    if (existing) {
      const sets: string[] = [];
      const values: unknown[] = [];
      for (const field of INTAKE_FORM_FIELDS) {
        if (data[field] !== undefined) {
          sets.push(`${field} = ?`);
          values.push(data[field]);
        }
      }
      if (sets.length === 0) return;
      sets.push("updated_at = CURRENT_TIMESTAMP");
      await db.execute(`UPDATE patient_intake_form SET ${sets.join(", ")} WHERE id = 1`, values);
    } else {
      const values = INTAKE_FORM_FIELDS.map((field) => data[field] ?? null);
      await db.execute(
        `INSERT INTO patient_intake_form (id, ${INTAKE_FORM_FIELDS.join(", ")}) VALUES (1, ${INTAKE_FORM_FIELDS.map(() => "?").join(", ")})`,
        values,
      );
    }
  }

  // Sessions
  async function createSession(session: {
    id: string;
    started_at: string;
    mood_before: number | null;
  }): Promise<void> {
    await db.execute(
      "INSERT INTO sessions (id, started_at, mood_before, messages, status) VALUES (?, ?, ?, '[]', 'active')",
      [session.id, session.started_at, session.mood_before]
    );
  }

  async function updateSessionMessages(id: string, messages: ChatMessage[]): Promise<void> {
    await db.execute("UPDATE sessions SET messages = ? WHERE id = ?", [JSON.stringify(messages), id]);
  }

  async function completeSession(
    id: string,
    data: { mood_after: number | null; summary: SessionSummary | null; summary_narrative?: string }
  ): Promise<void> {
    await db.execute(
      "UPDATE sessions SET ended_at = ?, mood_after = ?, summary = ?, summary_narrative = ?, status = 'completed' WHERE id = ?",
      [new Date().toISOString(), data.mood_after, data.summary ? JSON.stringify(data.summary) : null, data.summary_narrative ?? null, id]
    );
  }

  async function updateSessionNarrative(id: string, narrative: string): Promise<void> {
    await db.execute("UPDATE sessions SET summary_narrative = ? WHERE id = ?", [narrative, id]);
  }

  function parseSession(r: Session): Session {
    return {
      ...r,
      messages: typeof r.messages === "string" ? JSON.parse(r.messages) : r.messages,
      summary: r.summary ? (typeof r.summary === "string" ? JSON.parse(r.summary as unknown as string) : r.summary) : null,
      therapist_notes: r.therapist_notes ? (typeof r.therapist_notes === "string" ? JSON.parse(r.therapist_notes as unknown as string) : r.therapist_notes) : null,
    };
  }

  async function getRecentSessions(limit = 5): Promise<Session[]> {
    const rows = await db.select<Session>(
      "SELECT * FROM sessions WHERE status = 'completed' ORDER BY created_at DESC LIMIT ?",
      [limit]
    );
    return rows.map(parseSession);
  }

  async function getSessionById(id: string): Promise<Session | null> {
    const rows = await db.select<Session>(
      "SELECT * FROM sessions WHERE id = ?",
      [id]
    );
    if (rows.length === 0) return null;
    return parseSession(rows[0]);
  }

  async function deleteSession(id: string): Promise<void> {
    await db.execute("DELETE FROM sessions WHERE id = ?", [id]);
  }

  async function getCompletedSessions(): Promise<Omit<Session, "messages">[]> {
    const rows = await db.select<Session>(
      "SELECT id, started_at, ended_at, mood_before, mood_after, summary, summary_narrative, therapist_notes, status, created_at FROM sessions WHERE status = 'completed' ORDER BY created_at DESC"
    );
    return rows.map((r) => ({
      ...r,
      summary: r.summary ? (typeof r.summary === "string" ? JSON.parse(r.summary as unknown as string) : r.summary) : null,
      therapist_notes: r.therapist_notes ? (typeof r.therapist_notes === "string" ? JSON.parse(r.therapist_notes as unknown as string) : r.therapist_notes) : null,
    }));
  }

  // Patient Notes (cumulative)
  async function getPatientNotes(): Promise<string> {
    const rows = await db.select<{ notes: string }>("SELECT notes FROM patient_notes WHERE id = 1");
    if (rows.length === 0) return "";
    return rows[0].notes;
  }

  async function getPatientNotesUpdatedAt(): Promise<string | null> {
    const rows = await db.select<{ updated_at: string }>("SELECT updated_at FROM patient_notes WHERE id = 1");
    if (rows.length === 0) return null;
    return rows[0].updated_at;
  }

  async function upsertPatientNotes(notes: string): Promise<void> {
    await db.execute(
      "INSERT INTO patient_notes (id, notes, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET notes = ?, updated_at = CURRENT_TIMESTAMP",
      [notes, notes]
    );
  }

  // Course Notes (per-course cumulative memory)
  async function getCourseNotes(courseId: string): Promise<string> {
    const rows = await db.select<{ notes: string }>(
      "SELECT notes FROM course_notes WHERE course_id = ?",
      [courseId]
    );
    if (rows.length === 0) return "";
    return rows[0].notes;
  }

  async function getCourseNotesUpdatedAt(courseId: string): Promise<string | null> {
    const rows = await db.select<{ updated_at: string }>(
      "SELECT updated_at FROM course_notes WHERE course_id = ?",
      [courseId]
    );
    if (rows.length === 0) return null;
    return rows[0].updated_at;
  }

  async function upsertCourseNotes(courseId: string, notes: string): Promise<void> {
    await db.execute(
      "INSERT INTO course_notes (course_id, notes, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(course_id) DO UPDATE SET notes = ?, updated_at = CURRENT_TIMESTAMP",
      [courseId, notes, notes]
    );
  }

  async function getTodaySession(): Promise<Session | null> {
    const today = new Date().toISOString().split("T")[0];
    const rows = await db.select<Session>(
      "SELECT * FROM sessions WHERE date(started_at) = ? ORDER BY created_at DESC LIMIT 1",
      [today]
    );
    if (rows.length === 0) return null;
    return parseSession(rows[0]);
  }

  // Check-ins
  async function saveCheckIn(data: {
    mood: number;
    energy: number;
    sleep: number;
    had_dream: boolean;
    dream_note: string | null;
    tags: string[];
  }): Promise<void> {
    const id = crypto.randomUUID();
    const date = new Date().toISOString().split("T")[0];
    await db.execute(
      "INSERT OR REPLACE INTO checkins (id, date, mood, energy, sleep, had_dream, dream_note, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, date, data.mood, data.energy, data.sleep, data.had_dream ? 1 : 0, data.dream_note, JSON.stringify(data.tags)]
    );
  }

  async function getTodayCheckIn(): Promise<CheckIn | null> {
    const today = new Date().toISOString().split("T")[0];
    const rows = await db.select<CheckIn>(
      "SELECT * FROM checkins WHERE date = ?",
      [today]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      ...r,
      had_dream: Boolean(r.had_dream),
      tags: typeof r.tags === "string" ? JSON.parse(r.tags) : r.tags,
    };
  }

  async function getRecentCheckIns(days = 7): Promise<CheckIn[]> {
    const rows = await db.select<CheckIn>(
      "SELECT * FROM checkins ORDER BY date DESC LIMIT ?",
      [days]
    );
    return rows.map((r) => ({
      ...r,
      had_dream: Boolean(r.had_dream),
      tags: typeof r.tags === "string" ? JSON.parse(r.tags) : r.tags,
    }));
  }

  // Counts
  async function getCompletedSessionCount(): Promise<number> {
    const rows = await db.select<{ count: number }>("SELECT COUNT(*) as count FROM sessions WHERE status = 'completed'");
    return rows[0].count;
  }

  async function getJournalEntryCount(): Promise<number> {
    const rows = await db.select<{ count: number }>("SELECT COUNT(*) as count FROM journal_entries");
    return rows[0].count;
  }

  async function getDreamCount(): Promise<number> {
    const rows = await db.select<{ count: number }>("SELECT COUNT(*) as count FROM dreams");
    return rows[0].count;
  }

  // Mood Entries
  async function saveMoodEntry(mood: number): Promise<void> {
    const id = crypto.randomUUID();
    const date = new Date().toISOString().split("T")[0];
    await db.execute(
      "INSERT INTO mood_entries (id, date, mood) VALUES (?, ?, ?) ON CONFLICT(date) DO UPDATE SET mood = ?, updated_at = CURRENT_TIMESTAMP",
      [id, date, mood, mood]
    );
  }

  async function getTodayMoodEntry(): Promise<MoodEntry | null> {
    const today = new Date().toISOString().split("T")[0];
    const rows = await db.select<MoodEntry>(
      "SELECT * FROM mood_entries WHERE date = ?",
      [today]
    );
    if (rows.length === 0) return null;
    return rows[0];
  }

  async function getMoodEntriesByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<MoodEntry[]> {
    return db.select<MoodEntry>(
      "SELECT * FROM mood_entries WHERE date >= ? AND date <= ? ORDER BY date ASC",
      [startDate, endDate]
    );
  }

  // Dreams
  async function saveDream(content: string, date?: string): Promise<string> {
    const id = crypto.randomUUID();
    const d = date ?? new Date().toISOString().split("T")[0];
    await db.execute(
      "INSERT INTO dreams (id, date, content) VALUES (?, ?, ?)",
      [id, d, content]
    );
    return id;
  }

  async function getDreams(limit = 50): Promise<Dream[]> {
    return db.select<Dream>(
      "SELECT * FROM dreams ORDER BY created_at DESC LIMIT ?",
      [limit]
    );
  }

  async function getDreamsByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Dream[]> {
    return db.select<Dream>(
      "SELECT * FROM dreams WHERE date >= ? AND date <= ? ORDER BY date ASC",
      [startDate, endDate]
    );
  }

  async function getDreamById(id: string): Promise<Dream | null> {
    const rows = await db.select<Dream>(
      "SELECT * FROM dreams WHERE id = ?",
      [id]
    );
    if (rows.length === 0) return null;
    return rows[0];
  }

  async function updateDreamAnalysis(id: string, analysis: string): Promise<void> {
    await db.execute(
      "UPDATE dreams SET analysis = ? WHERE id = ?",
      [analysis, id]
    );
  }

  async function updateDreamContent(id: string, content: string): Promise<void> {
    await db.execute("UPDATE dreams SET content = ? WHERE id = ?", [content, id]);
  }

  async function deleteDream(id: string): Promise<void> {
    await db.execute("DELETE FROM dreams WHERE id = ?", [id]);
  }

  // Journal Entries
  function parseJournalEntry(r: JournalEntry): JournalEntry {
    return {
      ...r,
      tags: typeof r.tags === "string" ? JSON.parse(r.tags) : r.tags,
    };
  }

  async function createJournalEntry(entry: {
    content: string;
    mood: number | null;
    tags: string[];
    date?: string;
  }): Promise<JournalEntry> {
    const id = crypto.randomUUID();
    const date = entry.date ?? new Date().toISOString().split("T")[0];
    const createdAt = new Date().toISOString();
    await db.execute(
      "INSERT INTO journal_entries (id, date, content, mood, tags, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [id, date, entry.content, entry.mood, JSON.stringify(entry.tags), createdAt]
    );
    // Return the row we inserted instead of issuing a second SELECT. If that
    // read failed after a successful INSERT, callers would keep the editor
    // open and a retry could create a duplicate entry.
    return {
      id,
      date,
      content: entry.content,
      mood: entry.mood,
      tags: entry.tags,
      ai_analysis: null,
      created_at: createdAt,
    };
  }

  async function getJournalEntries(limit = 50): Promise<JournalEntry[]> {
    const rows = await db.select<JournalEntry>(
      "SELECT * FROM journal_entries ORDER BY created_at DESC LIMIT ?",
      [limit]
    );
    return rows.map(parseJournalEntry);
  }

  async function getJournalEntriesByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<JournalEntry[]> {
    const rows = await db.select<JournalEntry>(
      "SELECT * FROM journal_entries WHERE date >= ? AND date <= ? ORDER BY date ASC",
      [startDate, endDate]
    );
    return rows.map(parseJournalEntry);
  }

  async function getJournalEntryByDate(date: string): Promise<JournalEntry | null> {
    const rows = await db.select<JournalEntry>(
      "SELECT * FROM journal_entries WHERE date = ? ORDER BY created_at DESC LIMIT 1",
      [date]
    );
    if (rows.length === 0) return null;
    return parseJournalEntry(rows[0]);
  }

  async function getJournalEntryById(id: string): Promise<JournalEntry | null> {
    const rows = await db.select<JournalEntry>(
      "SELECT * FROM journal_entries WHERE id = ?",
      [id]
    );
    if (rows.length === 0) return null;
    return parseJournalEntry(rows[0]);
  }

  async function updateJournalAnalysis(id: string, analysis: string): Promise<void> {
    await db.execute("UPDATE journal_entries SET ai_analysis = ? WHERE id = ?", [analysis, id]);
  }

  async function updateJournalEntryContent(id: string, content: string): Promise<void> {
    await db.execute("UPDATE journal_entries SET content = ? WHERE id = ?", [content, id]);
  }

  async function deleteJournalEntry(id: string): Promise<void> {
    await db.execute("DELETE FROM journal_entries WHERE id = ?", [id]);
  }

  // Token Usage
  async function saveTokenUsage(record: {
    session_id: string | null;
    provider: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    cost: number;
    call_type: string;
  }): Promise<void> {
    const id = crypto.randomUUID();
    await db.execute(
      "INSERT INTO token_usage (id, session_id, provider, model, input_tokens, output_tokens, cost, call_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, record.session_id, record.provider, record.model, record.input_tokens, record.output_tokens, record.cost, record.call_type]
    );
  }

  async function getSessionTotalCost(sessionId: string): Promise<number> {
    const rows = await db.select<{ total_cost: number }>(
      "SELECT COALESCE(SUM(cost), 0) as total_cost FROM token_usage WHERE session_id = ?",
      [sessionId]
    );
    return rows[0]?.total_cost ?? 0;
  }

  async function getTokenUsageRecords(limit = 1000): Promise<TokenUsageRecord[]> {
    return db.select<TokenUsageRecord>(
      "SELECT * FROM token_usage ORDER BY created_at DESC LIMIT ?",
      [limit]
    );
  }

  // Weekly Summaries
  async function getWeeklySummary(weekStart: string): Promise<WeeklySummary | null> {
    const rows = await db.select<WeeklySummary>(
      "SELECT * FROM weekly_summaries WHERE week_start = ?",
      [weekStart]
    );
    if (rows.length === 0) return null;
    return rows[0];
  }

  async function saveWeeklySummary(weekStart: string, content: string, sessionCount: number): Promise<void> {
    const id = crypto.randomUUID();
    await db.execute(
      "INSERT INTO weekly_summaries (id, week_start, content, session_count) VALUES (?, ?, ?, ?) ON CONFLICT(week_start) DO UPDATE SET content = ?, session_count = ?, created_at = CURRENT_TIMESTAMP",
      [id, weekStart, content, sessionCount, content, sessionCount]
    );
  }

  async function getTokenUsageSummaryByProvider(): Promise<
    { provider: string; model: string; total_input_tokens: number; total_output_tokens: number; total_cost: number; call_count: number }[]
  > {
    return db.select<{ provider: string; model: string; total_input_tokens: number; total_output_tokens: number; total_cost: number; call_count: number }>(
      `SELECT provider, model,
              SUM(input_tokens) as total_input_tokens,
              SUM(output_tokens) as total_output_tokens,
              SUM(cost) as total_cost,
              COUNT(*) as call_count
       FROM token_usage
       GROUP BY provider, model
       ORDER BY provider, total_cost DESC`
    );
  }

  // Insight Groups
  async function getInsightGroups(): Promise<InsightGroup[]> {
    return db.select<InsightGroup>(
      `SELECT ig.*,
              COUNT(i.id) as insight_count,
              MAX(i.created_at) as last_insight_at
       FROM insight_groups ig
       LEFT JOIN insights i ON i.group_id = ig.id
       GROUP BY ig.id
       ORDER BY CASE
                  WHEN MAX(i.created_at) IS NULL OR ig.updated_at >= MAX(i.created_at)
                    THEN ig.updated_at
                  ELSE MAX(i.created_at)
                END DESC`
    );
  }

  async function createInsightGroup(data: {
    name: string;
    emoji?: string;
    description?: string;
    color?: string;
  }): Promise<string> {
    const id = crypto.randomUUID();
    await db.execute(
      "INSERT INTO insight_groups (id, name, emoji, description, color) VALUES (?, ?, ?, ?, ?)",
      [id, data.name, data.emoji ?? "💡", data.description ?? null, data.color ?? "#3ABAB4"]
    );
    return id;
  }

  async function updateInsightGroup(
    id: string,
    data: { name?: string; emoji?: string; description?: string; color?: string }
  ): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];
    if (data.name !== undefined) { sets.push("name = ?"); values.push(data.name); }
    if (data.emoji !== undefined) { sets.push("emoji = ?"); values.push(data.emoji); }
    if (data.description !== undefined) { sets.push("description = ?"); values.push(data.description); }
    if (data.color !== undefined) { sets.push("color = ?"); values.push(data.color); }
    sets.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    await db.execute(`UPDATE insight_groups SET ${sets.join(", ")} WHERE id = ?`, values);
  }

  async function deleteInsightGroup(id: string): Promise<void> {
    // Migration 018 handles children in a trigger within this same statement,
    // including connections where PRAGMA foreign_keys is disabled.
    await db.execute("DELETE FROM insight_groups WHERE id = ?", [id]);
  }

  // Insights
  async function getInsightsByGroupId(groupId: string): Promise<Insight[]> {
    const rows = await db.select<Insight>(
      "SELECT * FROM insights WHERE group_id = ? ORDER BY is_pinned DESC, created_at DESC",
      [groupId]
    );
    return rows.map((r) => ({ ...r, is_pinned: Boolean(r.is_pinned) }));
  }

  async function getInsightsByIds(ids: string[]): Promise<Insight[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => "?").join(",");
    const rows = await db.select<Insight>(
      `SELECT * FROM insights WHERE id IN (${placeholders}) ORDER BY created_at ASC`,
      ids
    );
    return rows.map((r) => ({ ...r, is_pinned: Boolean(r.is_pinned) }));
  }

  async function createInsight(data: {
    group_id: string;
    content: string;
  }): Promise<string> {
    const id = crypto.randomUUID();
    await db.execute(
      "INSERT INTO insights (id, group_id, content) VALUES (?, ?, ?)",
      [id, data.group_id, data.content]
    );
    // Group ordering derives from MAX(insights.created_at), so the insert is
    // one atomic statement. A separate metadata UPDATE could fail after the
    // INSERT and make an editor retry create a duplicate note.
    return id;
  }

  async function updateInsightContent(id: string, content: string): Promise<void> {
    await db.execute(
      "UPDATE insights SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [content, id]
    );
  }

  async function toggleInsightPin(id: string, isPinned: boolean): Promise<void> {
    await db.execute(
      "UPDATE insights SET is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [isPinned ? 1 : 0, id]
    );
  }

  async function deleteInsight(id: string): Promise<void> {
    await db.execute("DELETE FROM insights WHERE id = ?", [id]);
  }

  // Milestone Analyses
  async function getMilestoneAnalysis(milestone: number): Promise<{ content: string; created_at: string } | null> {
    const rows = await db.select<{ content: string; created_at: string }>(
      "SELECT content, created_at FROM milestone_analyses WHERE milestone = ?",
      [milestone]
    );
    if (rows.length === 0) return null;
    return rows[0];
  }

  async function saveMilestoneAnalysis(milestone: number, content: string): Promise<void> {
    const id = crypto.randomUUID();
    await db.execute(
      "INSERT INTO milestone_analyses (id, milestone, content) VALUES (?, ?, ?) ON CONFLICT(milestone) DO UPDATE SET content = ?, created_at = CURRENT_TIMESTAMP",
      [id, milestone, content, content]
    );
  }

  // Course Progress
  function parseCourseStepProgress(r: CourseStepProgress): CourseStepProgress {
    return {
      ...r,
      messages: typeof r.messages === "string" ? JSON.parse(r.messages) : r.messages,
    };
  }

  async function initializeCourseProgress(courseId: string, totalSteps: number): Promise<void> {
    const existing = await db.select<{ step_index: number; status: CourseStepProgress["status"] }>(
      "SELECT step_index, status FROM course_progress WHERE course_id = ? ORDER BY step_index ASC",
      [courseId]
    );

    const existingSteps = new Map(existing.map((row) => [row.step_index, row.status]));

    for (let i = 0; i < totalSteps; i++) {
      if (existingSteps.has(i)) continue;

      const id = crypto.randomUUID();
      const previousStatus = existingSteps.get(i - 1);
      const status = i === 0 || previousStatus === "completed" ? "available" : "locked";
      await db.execute(
        "INSERT OR IGNORE INTO course_progress (id, course_id, step_index, status) VALUES (?, ?, ?, ?)",
        [id, courseId, i, status]
      );
    }
  }

  async function getCourseProgress(courseId: string): Promise<CourseStepProgress[]> {
    const rows = await db.select<CourseStepProgress>(
      "SELECT * FROM course_progress WHERE course_id = ? ORDER BY step_index ASC",
      [courseId]
    );
    return rows.map(parseCourseStepProgress);
  }

  async function getCourseStepProgress(courseId: string, stepIndex: number): Promise<CourseStepProgress | null> {
    const rows = await db.select<CourseStepProgress>(
      "SELECT * FROM course_progress WHERE course_id = ? AND step_index = ?",
      [courseId, stepIndex]
    );
    if (rows.length === 0) return null;
    return parseCourseStepProgress(rows[0]);
  }

  async function startCourseStep(courseId: string, stepIndex: number): Promise<void> {
    await db.execute(
      "UPDATE course_progress SET status = 'in_progress', started_at = ?, updated_at = CURRENT_TIMESTAMP WHERE course_id = ? AND step_index = ?",
      [new Date().toISOString(), courseId, stepIndex]
    );
  }

  async function completeCourseStep(courseId: string, stepIndex: number): Promise<void> {
    await db.execute(
      "UPDATE course_progress SET status = 'completed', progress = 100, completed_at = ?, updated_at = CURRENT_TIMESTAMP WHERE course_id = ? AND step_index = ?",
      [new Date().toISOString(), courseId, stepIndex]
    );
    // Unlock next step
    await db.execute(
      "UPDATE course_progress SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE course_id = ? AND step_index = ? AND status = 'locked'",
      [courseId, stepIndex + 1]
    );
  }

  async function updateCourseStepMessages(courseId: string, stepIndex: number, messages: ChatMessage[]): Promise<void> {
    await db.execute(
      "UPDATE course_progress SET messages = ?, updated_at = CURRENT_TIMESTAMP WHERE course_id = ? AND step_index = ?",
      [JSON.stringify(messages), courseId, stepIndex]
    );
  }

  async function updateCourseStepProgress(courseId: string, stepIndex: number, progress: number): Promise<void> {
    const normalizedProgress = Math.max(0, Math.min(Math.round(progress), 100));
    await db.execute(
      "UPDATE course_progress SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE course_id = ? AND step_index = ?",
      [normalizedProgress, courseId, stepIndex]
    );
  }

  async function getCourseCompletedStepCount(courseId: string): Promise<number> {
    const rows = await db.select<{ cnt: number }>(
      "SELECT COUNT(*) as cnt FROM course_progress WHERE course_id = ? AND status = 'completed'",
      [courseId]
    );
    return rows[0]?.cnt ?? 0;
  }

  async function resetCourseProgress(courseId: string): Promise<void> {
    await db.execute("DELETE FROM course_progress WHERE course_id = ?", [courseId]);
    await db.execute("DELETE FROM course_notes WHERE course_id = ?", [courseId]);
  }

  // Clear all data
  async function clearAllData(): Promise<void> {
    await db.execute("DELETE FROM course_notes");
    await db.execute("DELETE FROM course_progress");
    await db.execute("DELETE FROM milestone_analyses");
    await db.execute("DELETE FROM insights");
    await db.execute("DELETE FROM insight_groups");
    await db.execute("DELETE FROM weekly_summaries");
    await db.execute("DELETE FROM theme_tracking");
    await db.execute("DELETE FROM token_usage");
    await db.execute("DELETE FROM mood_entries");
    await db.execute("DELETE FROM dreams");
    await db.execute("DELETE FROM journal_entries");
    await db.execute("DELETE FROM patient_notes");
    await db.execute("DELETE FROM checkins");
    await db.execute("DELETE FROM sessions");
    await db.execute("DELETE FROM user_profile");
  }

  return {
    getUserProfile,
    upsertUserProfile,
    getPatientIntakeForm,
    upsertPatientIntakeForm,
    createSession,
    updateSessionMessages,
    completeSession,
    updateSessionNarrative,
    getRecentSessions,
    getSessionById,
    deleteSession,
    getCompletedSessions,
    getPatientNotes,
    getPatientNotesUpdatedAt,
    upsertPatientNotes,
    getCourseNotes,
    getCourseNotesUpdatedAt,
    upsertCourseNotes,
    getTodaySession,
    saveCheckIn,
    getTodayCheckIn,
    getRecentCheckIns,
    getCompletedSessionCount,
    getJournalEntryCount,
    getDreamCount,
    saveMoodEntry,
    getTodayMoodEntry,
    getMoodEntriesByDateRange,
    saveDream,
    getDreams,
    getDreamsByDateRange,
    getDreamById,
    updateDreamAnalysis,
    updateDreamContent,
    deleteDream,
    createJournalEntry,
    getJournalEntries,
    getJournalEntriesByDateRange,
    getJournalEntryByDate,
    getJournalEntryById,
    updateJournalAnalysis,
    updateJournalEntryContent,
    deleteJournalEntry,
    saveTokenUsage,
    getSessionTotalCost,
    getTokenUsageRecords,
    getWeeklySummary,
    saveWeeklySummary,
    getTokenUsageSummaryByProvider,
    getInsightGroups,
    createInsightGroup,
    updateInsightGroup,
    deleteInsightGroup,
    getInsightsByGroupId,
    getInsightsByIds,
    createInsight,
    updateInsightContent,
    toggleInsightPin,
    deleteInsight,
    getMilestoneAnalysis,
    saveMilestoneAnalysis,
    initializeCourseProgress,
    getCourseProgress,
    getCourseStepProgress,
    startCourseStep,
    completeCourseStep,
    updateCourseStepMessages,
    updateCourseStepProgress,
    getCourseCompletedStepCount,
    resetCourseProgress,
    clearAllData,
  };
}

export type Queries = ReturnType<typeof createQueries>;
