// Platform-agnostic database access surface (D2, hexagonal port & adapter).
// apps/web wraps @tauri-apps/plugin-sql, apps/mobile wraps expo-sqlite.
// execute() is normalized to the least common denominator of the two:
// Tauri returns { lastInsertId?, rowsAffected }, expo-sqlite returns
// { lastInsertRowId, changes } — adapters map onto this shape.
export interface DatabasePort {
  select<T>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(sql: string, params?: unknown[]): Promise<{ lastInsertId?: number; rowsAffected: number }>;
}
