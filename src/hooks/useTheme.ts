import { useEffect, useCallback } from "react";

type Theme = "dark";

export function useTheme() {
  const theme: Theme = "dark";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
  }, []);

  const toggle = useCallback(() => { }, []);

  return { theme, toggle };
}
