import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:opengnothia.db");
  }
  return db;
}
