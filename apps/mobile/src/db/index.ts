import { openDatabaseAsync } from "expo-sqlite";
import { createQueries, runMigrations, type Queries } from "@opengnothia/shared/db";
import type { DatabasePort } from "@opengnothia/shared/db/port";
import { createExpoSqliteAdapter } from "@/adapters/expoSqliteAdapter";
import { MIGRATIONS } from "@/generated/migrations";

// Mobile counterpart of apps/desktop's src/db/index.ts: one lazily created
// connection shared by the whole app. The desktop build runs migrations inside
// the Tauri SQL plugin before the JS side ever sees the handle; on Expo we own
// that step, so opening the database and migrating it are the same promise.
let instance: Promise<{ port: DatabasePort; queries: Queries }> | null = null;

function load() {
  if (!instance) {
    instance = (async () => {
      const db = await openDatabaseAsync("opengnothia.db");
      const port = createExpoSqliteAdapter(db);
      await runMigrations(port, MIGRATIONS);
      return { port, queries: createQueries(port) };
    })().catch((error: unknown) => {
      // Drop the rejected promise so a retry re-opens instead of replaying the failure.
      instance = null;
      throw error;
    });
  }
  return instance;
}

export async function getQueries(): Promise<Queries> {
  return (await load()).queries;
}

// Raw port access for deliberately generic table-level work.
export async function getDbPort(): Promise<DatabasePort> {
  return (await load()).port;
}

export async function getSchemaVersion(): Promise<number> {
  const port = await getDbPort();
  const rows = await port.select<{ user_version: number }>("PRAGMA user_version");
  return rows[0]?.user_version ?? -1;
}

export type { Queries };
