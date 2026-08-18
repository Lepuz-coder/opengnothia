import { useCallback, useEffect, useState } from "react";
import { getQueries, getSchemaVersion } from "./index";

interface DatabaseStatus {
  isReady: boolean;
  error: string | null;
  retry: () => void;
}

// Root-layout gate: nothing renders until migrations have run, and a failure
// surfaces as a readable screen rather than a blank app (Faz 1, Step 9).
export function useDatabase(): DatabaseStatus {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    getQueries()
      .then(async () => {
        const version = await getSchemaVersion();
        if (cancelled) return;
        console.log(`[db] ready — user_version = ${version}`);
        setIsReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? `${err.name}: ${err.message}` : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { isReady, error, retry };
}
