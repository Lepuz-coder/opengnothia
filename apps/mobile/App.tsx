import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { openDatabaseAsync } from "expo-sqlite";
import { createQueries, runMigrations } from "@opengnothia/shared/db";
import { createExpoSqliteAdapter } from "./src/adapters/expoSqliteAdapter";
import { MIGRATIONS } from "./src/generated/migrations";

// Faz 10 smoke test: proves @opengnothia/shared works on Expo end to end —
// open expo-sqlite DB → wrap in the port adapter → run the real shared
// migrations → answer a shared query. Real mobile UI is a separate plan.
type SmokeResult = { schemaVersion: number; completedSessions: number };

export default function App() {
  const [result, setResult] = useState<SmokeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const db = await openDatabaseAsync("opengnothia.db");
      const port = createExpoSqliteAdapter(db);
      await runMigrations(port, MIGRATIONS);
      const rows = await port.select<{ user_version: number }>("PRAGMA user_version");
      const completedSessions = await createQueries(port).getCompletedSessionCount();
      if (!cancelled) setResult({ schemaVersion: rows[0]?.user_version ?? -1, completedSessions });
    })().catch((e: unknown) => {
      if (!cancelled) setError(e instanceof Error ? `${e.name}: ${e.message}` : String(e));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OpenGnothia — mobile smoke test</Text>
      {error !== null ? (
        <Text style={styles.error}>{error}</Text>
      ) : result === null ? (
        <ActivityIndicator />
      ) : (
        <>
          <Text style={styles.ok}>@opengnothia/shared OK</Text>
          <Text style={styles.line}>schema user_version: {result.schemaVersion}</Text>
          <Text style={styles.line}>completed sessions: {result.completedSessions}</Text>
        </>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
  },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  ok: { color: "#15803d", fontWeight: "600" },
  line: { color: "#334155", fontVariant: ["tabular-nums"] },
  error: { color: "#b91c1c" },
});
