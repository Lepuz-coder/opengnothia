import { useEffect, useState } from "react";
import { getQueries } from "@/db";

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getQueries()
      .then(() => setIsReady(true))
      .catch((err) => setError(err instanceof Error ? err.message : "DB connection failed"));
  }, []);

  return { isReady, error };
}
