import type { SQLiteBindParams, SQLiteDatabase } from "expo-sqlite";
import type { DatabasePort } from "@opengnothia/shared/db/port";

// Mobile side of the DatabasePort (counterpart of apps/desktop's
// tauriSqlAdapter). Statements without params run through execAsync so that
// runMigrations' multi-statement migration scripts work — runAsync only
// accepts a single statement. execAsync reports no row counts; that is safe
// because no shared query reads execute()'s return value (verified in Faz 5).
// Parameterized statements use runAsync and report real counts.
export function createExpoSqliteAdapter(db: SQLiteDatabase): DatabasePort {
  return {
    select: <T>(sql: string, params?: unknown[]) =>
      db.getAllAsync<T>(sql, (params ?? []) as SQLiteBindParams),
    execute: async (sql, params) => {
      if (params && params.length > 0) {
        const r = await db.runAsync(sql, params as SQLiteBindParams);
        return { lastInsertId: r.lastInsertRowId, rowsAffected: r.changes };
      }
      await db.execAsync(sql);
      return { rowsAffected: 0 };
    },
  };
}
