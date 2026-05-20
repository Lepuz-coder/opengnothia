import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { getDatabase } from "@/services/db/database";
import {
  clearAllData,
  getCompletedSessionCount,
  getJournalEntryCount,
  getDreamCount,
} from "@/services/db/queries";
import { loadSettings } from "@/lib/store";

const TABLES = [
  "user_profile",
  "patient_intake_form",
  "patient_notes",
  "sessions",
  "checkins",
  "dreams",
  "journal_entries",
  "mood_entries",
  "weekly_summaries",
  "milestone_analyses",
  "course_progress",
  "course_notes",
  "insight_groups",
  "insights",
  "token_usage",
  "theme_tracking",
] as const;

const EXPORT_VERSION = 1;
const APP_VERSION = "1.4.0";

export interface ExportFile {
  version: number;
  appVersion: string;
  exportedAt: string;
  database: Record<string, Record<string, unknown>[]>;
  settings: Record<string, unknown>;
}

export interface DataStats {
  sessions: number;
  journals: number;
  dreams: number;
}

export async function getDataStats(): Promise<DataStats> {
  const [sessions, journals, dreams] = await Promise.all([
    getCompletedSessionCount(),
    getJournalEntryCount(),
    getDreamCount(),
  ]);
  return { sessions, journals, dreams };
}

export async function exportAllData(): Promise<ExportFile> {
  const db = await getDatabase();
  const database: Record<string, Record<string, unknown>[]> = {};
  for (const table of TABLES) {
    const rows = await db.select<Record<string, unknown>[]>(`SELECT * FROM ${table}`);
    database[table] = rows;
  }

  const store = await loadSettings();
  const keys = await store.keys();
  const settings: Record<string, unknown> = {};
  for (const key of keys) {
    const value = await store.get(key);
    if (value !== undefined) settings[key] = value;
  }

  return {
    version: EXPORT_VERSION,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    database,
    settings,
  };
}

export async function saveExportToFile(data: ExportFile): Promise<string | null> {
  const date = new Date().toISOString().split("T")[0];
  const path = await save({
    defaultPath: `opengnothia-backup-${date}.json`,
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (!path) return null;
  const json = JSON.stringify(data, null, 2);
  await writeTextFile(path, json);
  return path;
}

export async function readImportFile(file: File): Promise<ExportFile> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("INVALID_FILE");
  }
  return validateImportFile(parsed);
}

export async function pickAndReadImportFile(): Promise<ExportFile | null> {
  const path = await open({
    multiple: false,
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (!path || typeof path !== "string") return null;
  const text = await readTextFile(path);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("INVALID_FILE");
  }
  return validateImportFile(parsed);
}

export function validateImportFile(input: unknown): ExportFile {
  if (!input || typeof input !== "object") throw new Error("INVALID_FILE");
  const obj = input as Record<string, unknown>;
  if (typeof obj.version !== "number") throw new Error("INVALID_FILE");
  if (!obj.database || typeof obj.database !== "object" || Array.isArray(obj.database)) {
    throw new Error("INVALID_FILE");
  }
  if (!obj.settings || typeof obj.settings !== "object" || Array.isArray(obj.settings)) {
    throw new Error("INVALID_FILE");
  }

  const db = obj.database as Record<string, unknown>;
  for (const table of TABLES) {
    if (table in db && !Array.isArray(db[table])) throw new Error("INVALID_FILE");
  }

  const hasAny = TABLES.some((t) => Array.isArray(db[t]));
  if (!hasAny) throw new Error("INVALID_FILE");

  return obj as unknown as ExportFile;
}

export async function importAllData(data: ExportFile): Promise<void> {
  const db = await getDatabase();

  await clearAllData();

  for (const table of TABLES) {
    const rows = data.database[table];
    if (!Array.isArray(rows) || rows.length === 0) continue;
    for (const row of rows) {
      const columns = Object.keys(row);
      if (columns.length === 0) continue;
      const placeholders = columns.map(() => "?").join(", ");
      const values = columns.map((c) => row[c] as unknown);
      try {
        await db.execute(
          `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
          values,
        );
      } catch (err) {
        console.error(`Failed to insert row into ${table}:`, err, row);
      }
    }
  }

  const store = await loadSettings();
  for (const [key, value] of Object.entries(data.settings)) {
    await store.set(key, value);
  }
  await store.save();
}
