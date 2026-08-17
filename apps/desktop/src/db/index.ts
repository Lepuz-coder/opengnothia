import Database from "@tauri-apps/plugin-sql";
import { createQueries, type Queries } from "@opengnothia/shared/db/queries";
import type { DatabasePort } from "@opengnothia/shared/db/port";
import { createTauriSqlAdapter } from "@/adapters/tauriSqlAdapter";

let instance: Promise<{ port: DatabasePort; queries: Queries }> | null = null;

function load() {
  if (!instance) {
    instance = Database.load("sqlite:opengnothia.db").then((db) => {
      const port = createTauriSqlAdapter(db);
      return { port, queries: createQueries(port) };
    });
  }
  return instance;
}

export async function getQueries(): Promise<Queries> {
  return (await load()).queries;
}

// Raw port access for deliberately generic table-level work (data export/import).
export async function getDbPort(): Promise<DatabasePort> {
  return (await load()).port;
}

export type { Queries };
