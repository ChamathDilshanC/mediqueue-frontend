"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import { GooeyToaster } from "goey-toast";
import { en, si, type Language, type Messages } from "@/lib/translations";
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
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
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
