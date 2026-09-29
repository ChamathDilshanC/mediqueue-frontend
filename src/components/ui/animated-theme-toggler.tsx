"use client";

import { Moon, Sun } from "lucide-react";

export default function ThemeToggler({
  theme,
  onToggle,
}: {
  theme: "light" | "dark";
  onToggle: () => void;
}) {
  return (
    <button
      className="theme-toggler"
      type="button"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      onClick={onToggle}
    >
      <span className="theme-toggler-thumb">
        {theme === "dark" ? <Moon size={15} /> : <Sun size={15} />}
      </span>
    </button>
  );
}
