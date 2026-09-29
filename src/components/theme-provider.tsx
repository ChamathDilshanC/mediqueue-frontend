"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";

type Theme = "light" | "dark";
const ThemeContext = createContext({
  theme: "light" as Theme,
  setTheme: (_theme: Theme) => {},
});

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, updateTheme] = useState<Theme>("light");
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem("mq_theme");
      } catch {}
      const next =
        saved === "light" || saved === "dark"
          ? saved
          : media.matches
            ? "dark"
            : "light";
      applyTheme(next);
      updateTheme(next);
    };
    sync();
    media.addEventListener("change", sync);
    window.addEventListener("storage", sync);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function setTheme(next: Theme) {
    applyTheme(next);
    updateTheme(next);
    try {
      localStorage.setItem("mq_theme", next);
    } catch {}
  }
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeToggle({ language }: { language: "si" | "en" }) {
  const { theme, setTheme } = useContext(ThemeContext);
  const label =
    language === "si"
      ? theme === "dark"
        ? "ආලෝක තේමාවට මාරු වන්න"
        : "අඳුරු තේමාවට මාරු වන්න"
      : `Switch to ${theme === "dark" ? "light" : "dark"} theme`;
  return (
    <AnimatedThemeToggler
      className="theme-toggle"
      theme={theme}
      onThemeChange={setTheme}
      aria-label={label}
      title={label}
      aria-pressed={theme === "dark"}
    />
  );
}
