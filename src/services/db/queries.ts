import { getDatabase } from "./database";
import type { CheckIn, Session, UserProfile, ChatMessage, SessionSummary } from "@/types";

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
  data: Partial<Pick<UserProfile, "name" | "goals" | "approach" | "preferred_session_time" | "session_duration_minutes">>
): Promise<void> {
  const db = await getDatabase();
  const existing = await getUserProfile();
  if (existing) {
    const sets: string[] = [];
    const values: unknown[] = [];
    if (data.name !== undefined) { sets.push("name = ?"); values.push(data.name); }
    if (data.goals !== undefined) { sets.push("goals = ?"); values.push(JSON.stringify(data.goals)); }
    if (data.approach !== undefined) { sets.push("approach = ?"); values.push(data.approach); }
    if (data.preferred_session_time !== undefined) { sets.push("preferred_session_time = ?"); values.push(data.preferred_session_time); }
    if (data.session_duration_minutes !== undefined) { sets.push("session_duration_minutes = ?"); values.push(data.session_duration_minutes); }
    sets.push("updated_at = CURRENT_TIMESTAMP");
    await db.execute(`UPDATE user_profile SET ${sets.join(", ")} WHERE id = 1`, values);
  } else {
    await db.execute(
      "INSERT INTO user_profile (id, name, goals, approach, preferred_session_time, session_duration_minutes) VALUES (1, ?, ?, ?, ?, ?)",
      [data.name ?? null, JSON.stringify(data.goals ?? []), data.approach ?? "balanced", data.preferred_session_time ?? "20:00", data.session_duration_minutes ?? 50]
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
  data: { mood_after: number; summary: SessionSummary }
): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    "UPDATE sessions SET ended_at = CURRENT_TIMESTAMP, mood_after = ?, summary = ?, status = 'completed' WHERE id = ?",
    [data.mood_after, JSON.stringify(data.summary), id]
  );
}

export async function getRecentSessions(limit = 5): Promise<Session[]> {
  const db = await getDatabase();
  const rows = await db.select<Session[]>(
    "SELECT * FROM sessions ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
  return rows.map((r) => ({
    ...r,
    messages: typeof r.messages === "string" ? JSON.parse(r.messages) : r.messages,
    summary: r.summary ? (typeof r.summary === "string" ? JSON.parse(r.summary) : r.summary) : null,
  }));
}

export async function getTodaySession(): Promise<Session | null> {
  const db = await getDatabase();
  const today = new Date().toISOString().split("T")[0];
  const rows = await db.select<Session[]>(
    "SELECT * FROM sessions WHERE date(started_at) = ? ORDER BY created_at DESC LIMIT 1",
    [today]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    ...r,
    messages: typeof r.messages === "string" ? JSON.parse(r.messages) : r.messages,
    summary: r.summary ? (typeof r.summary === "string" ? JSON.parse(r.summary) : r.summary) : null,
  };
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
