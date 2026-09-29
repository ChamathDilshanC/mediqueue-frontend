"use client";

import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

export default function ThemeSwitcher({
  theme,
  onToggle,
}: {
  theme: Theme;
  onToggle: () => void;
}) {
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      className="theme-switcher"
      type="button"
      aria-label={`Switch to ${nextTheme} theme`}
      aria-pressed={theme === "dark"}
      title={`Switch to ${nextTheme} theme`}
      onClick={onToggle}
    >
      <span className="theme-switcher-track" aria-hidden="true">
        <span className="theme-switcher-thumb">
          {theme === "dark" ? <Moon size={15} /> : <Sun size={15} />}
        </span>
      </span>
    </button>
  );
}
