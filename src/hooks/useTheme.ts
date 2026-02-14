import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";

export function useTheme() {
  const { theme, setTheme } = useAppStore();

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent | MediaQueryList) => {
        if (e.matches) root.classList.add("dark");
        else root.classList.remove("dark");
      };
      handler(mq);
      mq.addEventListener("change", handler as (e: MediaQueryListEvent) => void);
      return () => mq.removeEventListener("change", handler as (e: MediaQueryListEvent) => void);
    }
  }, [theme]);

  return { theme, setTheme };
}
