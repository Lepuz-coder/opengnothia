import { useEffect, useState } from "react";
import { getDatabase } from "@/services/db/database";

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDatabase()
      .then(() => setIsReady(true))
      .catch((err) => setError(err instanceof Error ? err.message : "DB connection failed"));
  }, []);

  return { isReady, error };
}
