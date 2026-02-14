import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";

export function useTheme() {
  const { theme, setTheme } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, [theme]);

  return { theme, setTheme };
}
