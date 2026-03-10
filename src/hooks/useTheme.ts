import { useState, useEffect, useCallback } from "react";

type Theme = "light";

export function useTheme() {
  const theme: Theme = "light";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    localStorage.removeItem("mv-theme");
  }, []);

  const toggle = useCallback(() => { }, []);

  return { theme, toggle };
}
