import type Database from "@tauri-apps/plugin-sql";
import type { DatabasePort } from "@opengnothia/shared/db/port";

// Tauri's select<T> resolves to Promise<T> (T = the row-array type), while the
// port's select<T> resolves to Promise<T[]> (T = the row type) — hence select<T[]>.
export function createTauriSqlAdapter(db: Database): DatabasePort {
  return {
    select: <T>(sql: string, params?: unknown[]) => db.select<T[]>(sql, params),
    execute: async (sql, params) => {
      const res = await db.execute(sql, params);
      return { lastInsertId: res.lastInsertId, rowsAffected: res.rowsAffected };
    },
  };
}
