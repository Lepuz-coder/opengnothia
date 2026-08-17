import type { DatabasePort } from "./port";

// PRAGMA user_version-based migration runner for platforms without a native
// migrator (apps/mobile). Desktop does not use this — Tauri's plugin-sql runs
// the same packages/shared/migrations/*.sql files via include_str! in lib.rs,
// tracking progress in its own _sqlx_migrations table, not user_version.
// The port's execute() must accept multi-statement SQL scripts (migration
// files contain several statements); expo-sqlite adapters should back this
// with execAsync, not runAsync.
export interface MigrationDef {
  version: number;
  sql: string;
}

export async function runMigrations(db: DatabasePort, migrations: MigrationDef[]): Promise<void> {
  const result = await db.select<{ user_version: number }>("PRAGMA user_version");
  const current = result[0]?.user_version ?? 0;
  const pending = migrations.filter((m) => m.version > current).sort((a, b) => a.version - b.version);
  for (const m of pending) {
    await db.execute(m.sql);
    await db.execute(`PRAGMA user_version = ${m.version}`);
  }
}
