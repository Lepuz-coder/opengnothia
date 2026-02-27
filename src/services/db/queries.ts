import { getDatabase } from "./database";
import type { CheckIn, Dream, Session, UserProfile, ChatMessage, SessionSummary, TokenUsageRecord, JournalEntry, MoodEntry, WeeklySummary, InsightGroup, Insight } from "@/types";

// User Profile
export async function getUserProfile(): Promise<UserProfile | null> {
  const db = await getDatabase();
  const rows = await db.select<UserProfile[]>("SELECT * FROM user_profile WHERE id = 1");
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    ...row,
    goals: typeof row.goals === "string" ? JSON.parse(row.goals) : row.goals ?? [],
  };
}

export async function upsertUserProfile(
  data: Partial<Pick<UserProfile, "name" | "age" | "gender" | "occupation" | "goals" | "approach" | "preferred_session_time" | "session_duration_minutes">>
): Promise<void> {
  const db = await getDatabase();
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

// Sessions
export async function createSession(session: {
  id: string;
  started_at: string;
  mood_before: number;
}): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    "INSERT INTO sessions (id, started_at, mood_before, messages, status) VALUES (?, ?, ?, '[]', 'active')",
    [session.id, session.started_at, session.mood_before]
  );
}

export async function updateSessionMessages(id: string, messages: ChatMessage[]): Promise<void> {
  const db = await getDatabase();
  await db.execute("UPDATE sessions SET messages = ? WHERE id = ?", [JSON.stringify(messages), id]);
}

export async function completeSession(
  id: string,
  data: { mood_after: number; summary: SessionSummary; summary_narrative?: string }
): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    "UPDATE sessions SET ended_at = ?, mood_after = ?, summary = ?, summary_narrative = ?, status = 'completed' WHERE id = ?",
    [new Date().toISOString(), data.mood_after, JSON.stringify(data.summary), data.summary_narrative ?? null, id]
  );
}

function parseSession(r: Session): Session {
  return {
    ...r,
    messages: typeof r.messages === "string" ? JSON.parse(r.messages) : r.messages,
    summary: r.summary ? (typeof r.summary === "string" ? JSON.parse(r.summary as unknown as string) : r.summary) : null,
    therapist_notes: r.therapist_notes ? (typeof r.therapist_notes === "string" ? JSON.parse(r.therapist_notes as unknown as string) : r.therapist_notes) : null,
  };
}

export async function getRecentSessions(limit = 5): Promise<Session[]> {
  const db = await getDatabase();
  const rows = await db.select<Session[]>(
    "SELECT * FROM sessions WHERE status = 'completed' ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
  return rows.map(parseSession);
}

export async function getSessionById(id: string): Promise<Session | null> {
  const db = await getDatabase();
  const rows = await db.select<Session[]>(
    "SELECT * FROM sessions WHERE id = ?",
    [id]
  );
  if (rows.length === 0) return null;
  return parseSession(rows[0]);
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDatabase();
  await db.execute("DELETE FROM sessions WHERE id = ?", [id]);
}

export async function getCompletedSessions(): Promise<Omit<Session, "messages">[]> {
  const db = await getDatabase();
  const rows = await db.select<Session[]>(
    "SELECT id, started_at, ended_at, mood_before, mood_after, summary, summary_narrative, therapist_notes, status, created_at FROM sessions WHERE status = 'completed' ORDER BY created_at DESC"
  );
  return rows.map((r) => ({
    ...r,
    summary: r.summary ? (typeof r.summary === "string" ? JSON.parse(r.summary as unknown as string) : r.summary) : null,
    therapist_notes: r.therapist_notes ? (typeof r.therapist_notes === "string" ? JSON.parse(r.therapist_notes as unknown as string) : r.therapist_notes) : null,
  }));
}

// Patient Notes (cumulative)
export async function getPatientNotes(): Promise<string> {
  const db = await getDatabase();
  const rows = await db.select<{ notes: string }[]>("SELECT notes FROM patient_notes WHERE id = 1");
  if (rows.length === 0) return "";
  return rows[0].notes;
}

export async function getPatientNotesUpdatedAt(): Promise<string | null> {
  const db = await getDatabase();
  const rows = await db.select<{ updated_at: string }[]>("SELECT updated_at FROM patient_notes WHERE id = 1");
  if (rows.length === 0) return null;
  return rows[0].updated_at;
}

export async function upsertPatientNotes(notes: string): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    "INSERT INTO patient_notes (id, notes, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET notes = ?, updated_at = CURRENT_TIMESTAMP",
    [notes, notes]
  );
}

export async function getTodaySession(): Promise<Session | null> {
  const db = await getDatabase();
  const today = new Date().toISOString().split("T")[0];
  const rows = await db.select<Session[]>(
    "SELECT * FROM sessions WHERE date(started_at) = ? ORDER BY created_at DESC LIMIT 1",
    [today]
  );
  if (rows.length === 0) return null;
  return parseSession(rows[0]);
}

// Check-ins
export async function saveCheckIn(data: {
  mood: number;
  energy: number;
  sleep: number;
  had_dream: boolean;
  dream_note: string | null;
  tags: string[];
}): Promise<void> {
  const db = await getDatabase();
  const id = crypto.randomUUID();
  const date = new Date().toISOString().split("T")[0];
  await db.execute(
    "INSERT OR REPLACE INTO checkins (id, date, mood, energy, sleep, had_dream, dream_note, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [id, date, data.mood, data.energy, data.sleep, data.had_dream ? 1 : 0, data.dream_note, JSON.stringify(data.tags)]
  );
}

export async function getTodayCheckIn(): Promise<CheckIn | null> {
  const db = await getDatabase();
  const today = new Date().toISOString().split("T")[0];
  const rows = await db.select<CheckIn[]>(
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

export async function getRecentCheckIns(days = 7): Promise<CheckIn[]> {
  const db = await getDatabase();
  const rows = await db.select<CheckIn[]>(
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
export async function getCompletedSessionCount(): Promise<number> {
  const db = await getDatabase();
  const rows = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM sessions WHERE status = 'completed'");
  return rows[0].count;
}

export async function getJournalEntryCount(): Promise<number> {
  const db = await getDatabase();
  const rows = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM journal_entries");
  return rows[0].count;
}

export async function getDreamCount(): Promise<number> {
  const db = await getDatabase();
  const rows = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM dreams");
  return rows[0].count;
}

// Mood Entries
export async function saveMoodEntry(mood: number): Promise<void> {
  const db = await getDatabase();
  const id = crypto.randomUUID();
  const date = new Date().toISOString().split("T")[0];
  await db.execute(
    "INSERT INTO mood_entries (id, date, mood) VALUES (?, ?, ?) ON CONFLICT(date) DO UPDATE SET mood = ?, updated_at = CURRENT_TIMESTAMP",
    [id, date, mood, mood]
  );
}

export async function getTodayMoodEntry(): Promise<MoodEntry | null> {
  const db = await getDatabase();
  const today = new Date().toISOString().split("T")[0];
  const rows = await db.select<MoodEntry[]>(
    "SELECT * FROM mood_entries WHERE date = ?",
    [today]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

export async function getMoodEntriesByDateRange(
  startDate: string,
  endDate: string,
): Promise<MoodEntry[]> {
  const db = await getDatabase();
  return db.select<MoodEntry[]>(
    "SELECT * FROM mood_entries WHERE date >= ? AND date <= ? ORDER BY date ASC",
    [startDate, endDate]
  );
}

// Dreams
export async function saveDream(content: string, date?: string): Promise<string> {
  const db = await getDatabase();
  const id = crypto.randomUUID();
  const d = date ?? new Date().toISOString().split("T")[0];
  await db.execute(
    "INSERT INTO dreams (id, date, content) VALUES (?, ?, ?)",
    [id, d, content]
  );
  return id;
}

export async function getDreams(limit = 50): Promise<Dream[]> {
  const db = await getDatabase();
  return db.select<Dream[]>(
    "SELECT * FROM dreams ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
}

export async function getDreamsByDateRange(
  startDate: string,
  endDate: string,
): Promise<Dream[]> {
  const db = await getDatabase();
  return db.select<Dream[]>(
    "SELECT * FROM dreams WHERE date >= ? AND date <= ? ORDER BY date ASC",
    [startDate, endDate]
  );
}

export async function getDreamById(id: string): Promise<Dream | null> {
  const db = await getDatabase();
  const rows = await db.select<Dream[]>(
    "SELECT * FROM dreams WHERE id = ?",
    [id]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

export async function updateDreamAnalysis(id: string, analysis: string): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    "UPDATE dreams SET analysis = ? WHERE id = ?",
    [analysis, id]
  );
}

export async function updateDreamContent(id: string, content: string): Promise<void> {
  const db = await getDatabase();
  await db.execute("UPDATE dreams SET content = ? WHERE id = ?", [content, id]);
}

export async function deleteDream(id: string): Promise<void> {
  const db = await getDatabase();
  await db.execute("DELETE FROM dreams WHERE id = ?", [id]);
}

// Journal Entries
function parseJournalEntry(r: JournalEntry): JournalEntry {
  return {
    ...r,
    tags: typeof r.tags === "string" ? JSON.parse(r.tags) : r.tags,
  };
}

export async function createJournalEntry(entry: {
  content: string;
  mood: number | null;
  tags: string[];
  date?: string;
}): Promise<JournalEntry> {
  const db = await getDatabase();
  const id = crypto.randomUUID();
  const date = entry.date ?? new Date().toISOString().split("T")[0];
  await db.execute(
    "INSERT INTO journal_entries (id, date, content, mood, tags) VALUES (?, ?, ?, ?, ?)",
    [id, date, entry.content, entry.mood, JSON.stringify(entry.tags)]
  );
  const rows = await db.select<JournalEntry[]>("SELECT * FROM journal_entries WHERE id = ?", [id]);
  return parseJournalEntry(rows[0]);
}

export async function getJournalEntries(limit = 50): Promise<JournalEntry[]> {
  const db = await getDatabase();
  const rows = await db.select<JournalEntry[]>(
    "SELECT * FROM journal_entries ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
  return rows.map(parseJournalEntry);
}

export async function getJournalEntriesByDateRange(
  startDate: string,
  endDate: string,
): Promise<JournalEntry[]> {
  const db = await getDatabase();
  const rows = await db.select<JournalEntry[]>(
    "SELECT * FROM journal_entries WHERE date >= ? AND date <= ? ORDER BY date ASC",
    [startDate, endDate]
  );
  return rows.map(parseJournalEntry);
}

export async function getJournalEntryByDate(date: string): Promise<JournalEntry | null> {
  const db = await getDatabase();
  const rows = await db.select<JournalEntry[]>(
    "SELECT * FROM journal_entries WHERE date = ? ORDER BY created_at DESC LIMIT 1",
    [date]
  );
  if (rows.length === 0) return null;
  return parseJournalEntry(rows[0]);
}

export async function getJournalEntryById(id: string): Promise<JournalEntry | null> {
  const db = await getDatabase();
  const rows = await db.select<JournalEntry[]>(
    "SELECT * FROM journal_entries WHERE id = ?",
    [id]
  );
  if (rows.length === 0) return null;
  return parseJournalEntry(rows[0]);
}

export async function updateJournalAnalysis(id: string, analysis: string): Promise<void> {
  const db = await getDatabase();
  await db.execute("UPDATE journal_entries SET ai_analysis = ? WHERE id = ?", [analysis, id]);
}

export async function updateJournalEntryContent(id: string, content: string): Promise<void> {
  const db = await getDatabase();
  await db.execute("UPDATE journal_entries SET content = ? WHERE id = ?", [content, id]);
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const db = await getDatabase();
  await db.execute("DELETE FROM journal_entries WHERE id = ?", [id]);
}

// Token Usage
export async function saveTokenUsage(record: {
  session_id: string | null;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost: number;
  call_type: string;
}): Promise<void> {
  const db = await getDatabase();
  const id = crypto.randomUUID();
  await db.execute(
    "INSERT INTO token_usage (id, session_id, provider, model, input_tokens, output_tokens, cost, call_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [id, record.session_id, record.provider, record.model, record.input_tokens, record.output_tokens, record.cost, record.call_type]
  );
}

export async function getSessionTotalCost(sessionId: string): Promise<number> {
  const db = await getDatabase();
  const rows = await db.select<{ total_cost: number }[]>(
    "SELECT COALESCE(SUM(cost), 0) as total_cost FROM token_usage WHERE session_id = ?",
    [sessionId]
  );
  return rows[0]?.total_cost ?? 0;
}

export async function getTokenUsageRecords(limit = 1000): Promise<TokenUsageRecord[]> {
  const db = await getDatabase();
  return db.select<TokenUsageRecord[]>(
    "SELECT * FROM token_usage ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
}

// Weekly Summaries
export async function getWeeklySummary(weekStart: string): Promise<WeeklySummary | null> {
  const db = await getDatabase();
  const rows = await db.select<WeeklySummary[]>(
    "SELECT * FROM weekly_summaries WHERE week_start = ?",
    [weekStart]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

export async function saveWeeklySummary(weekStart: string, content: string, sessionCount: number): Promise<void> {
  const db = await getDatabase();
  const id = crypto.randomUUID();
  await db.execute(
    "INSERT INTO weekly_summaries (id, week_start, content, session_count) VALUES (?, ?, ?, ?) ON CONFLICT(week_start) DO UPDATE SET content = ?, session_count = ?, created_at = CURRENT_TIMESTAMP",
    [id, weekStart, content, sessionCount, content, sessionCount]
  );
}

export async function getTokenUsageSummaryByProvider(): Promise<
  { provider: string; model: string; total_input_tokens: number; total_output_tokens: number; total_cost: number; call_count: number }[]
> {
  const db = await getDatabase();
  return db.select(
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
export async function getInsightGroups(): Promise<InsightGroup[]> {
  const db = await getDatabase();
  return db.select<InsightGroup[]>(
    `SELECT ig.*,
            COUNT(i.id) as insight_count,
            MAX(i.created_at) as last_insight_at
     FROM insight_groups ig
     LEFT JOIN insights i ON i.group_id = ig.id
     GROUP BY ig.id
     ORDER BY ig.updated_at DESC`
  );
}

export async function createInsightGroup(data: {
  name: string;
  emoji?: string;
  description?: string;
  color?: string;
}): Promise<string> {
  const db = await getDatabase();
  const id = crypto.randomUUID();
  await db.execute(
    "INSERT INTO insight_groups (id, name, emoji, description, color) VALUES (?, ?, ?, ?, ?)",
    [id, data.name, data.emoji ?? "💡", data.description ?? null, data.color ?? "#3ABAB4"]
  );
  return id;
}

export async function updateInsightGroup(
  id: string,
  data: { name?: string; emoji?: string; description?: string; color?: string }
): Promise<void> {
  const db = await getDatabase();
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

export async function deleteInsightGroup(id: string): Promise<void> {
  const db = await getDatabase();
  await db.execute("DELETE FROM insights WHERE group_id = ?", [id]);
  await db.execute("DELETE FROM insight_groups WHERE id = ?", [id]);
}

// Insights
export async function getInsightsByGroupId(groupId: string): Promise<Insight[]> {
  const db = await getDatabase();
  const rows = await db.select<Insight[]>(
    "SELECT * FROM insights WHERE group_id = ? ORDER BY is_pinned DESC, created_at DESC",
    [groupId]
  );
  return rows.map((r) => ({ ...r, is_pinned: Boolean(r.is_pinned) }));
}

export async function createInsight(data: {
  group_id: string;
  content: string;
}): Promise<string> {
  const db = await getDatabase();
  const id = crypto.randomUUID();
  await db.execute(
    "INSERT INTO insights (id, group_id, content) VALUES (?, ?, ?)",
    [id, data.group_id, data.content]
  );
  await db.execute(
    "UPDATE insight_groups SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [data.group_id]
  );
  return id;
}

export async function updateInsightContent(id: string, content: string): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    "UPDATE insights SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [content, id]
  );
}

export async function toggleInsightPin(id: string, isPinned: boolean): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    "UPDATE insights SET is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [isPinned ? 1 : 0, id]
  );
}

export async function deleteInsight(id: string): Promise<void> {
  const db = await getDatabase();
  await db.execute("DELETE FROM insights WHERE id = ?", [id]);
}

// Milestone Analyses
export async function getMilestoneAnalysis(milestone: number): Promise<{ content: string; created_at: string } | null> {
  const db = await getDatabase();
  const rows = await db.select<{ content: string; created_at: string }[]>(
    "SELECT content, created_at FROM milestone_analyses WHERE milestone = ?",
    [milestone]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

export async function saveMilestoneAnalysis(milestone: number, content: string): Promise<void> {
  const db = await getDatabase();
  const id = crypto.randomUUID();
  await db.execute(
    "INSERT INTO milestone_analyses (id, milestone, content) VALUES (?, ?, ?) ON CONFLICT(milestone) DO UPDATE SET content = ?, created_at = CURRENT_TIMESTAMP",
    [id, milestone, content, content]
  );
}

// Clear all data
export async function clearAllData(): Promise<void> {
  const db = await getDatabase();
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
