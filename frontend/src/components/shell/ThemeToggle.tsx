"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

const KEY = "booking.theme";
type Theme = "light" | "dark";

export function ThemeToggle() {
  const { t } = useI18n();
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    let stored: Theme | null = null;
    try {
      stored = localStorage.getItem(KEY) as Theme | null;
    } catch {
      /* ignore */
    }
    if (stored) {
      document.documentElement.setAttribute("data-theme", stored);
      setTheme(stored);
    } else {
      const prefersDark =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  }

  return (
    <button className="btn-quiet" onClick={toggle} aria-label="Theme">
      {theme === "dark" ? t("common.theme.light") : t("common.theme.dark")}
    </button>
  );
}
