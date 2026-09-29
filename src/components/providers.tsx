"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import { GooeyToaster } from "goey-toast";
import { en, si, type Language, type Messages } from "@/lib/translations";
import ThemeSwitcher from "./ui/theme-switcher-1";
const LanguageContext = createContext<{
  language: Language;
  t: Messages;
  setLanguage: (language: Language) => void;
} | null>(null);
export function Providers({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage: Language;
}) {
  const [language, updateLanguage] = useState<Language>(initialLanguage);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  useEffect(() => {
    const saved = window.localStorage.getItem("mq_theme");
    const next =
      saved === "dark" || saved === "light"
        ? saved
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }, []);
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("mq_theme", next);
  }
  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    // Supabase's email links return an implicit session in a URL fragment.
    // Fragments never reach the server, and the reset screen clears it immediately.
    if (
      fragment.get("type") === "recovery" &&
      window.location.pathname !== "/reset-password"
    ) {
      window.location.replace(`/reset-password${window.location.hash}`);
    } else if (
      fragment.get("type") === "signup" &&
      fragment.has("access_token")
    ) {
      window.history.replaceState(null, "", window.location.pathname);
      window.location.replace("/login");
    }
  }, []);
  function setLanguage(value: Language) {
    updateLanguage(value);
    document.cookie = `mq_language=${value}; path=/; max-age=31536000; SameSite=Lax`;
  }
  return (
    <LanguageContext.Provider
      value={{ language, t: language === "si" ? si : en, setLanguage }}
    >
      <MotionConfig reducedMotion="user">
        <ThemeSwitcher theme={theme} onToggle={toggleTheme} />
        {children}
        <GooeyToaster
          position="bottom-right"
          preset="subtle"
          showTimestamp={false}
          closeButton
        />
      </MotionConfig>
    </LanguageContext.Provider>
  );
}
export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("Language provider missing");
  return value;
}
