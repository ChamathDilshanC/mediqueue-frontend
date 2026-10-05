"use client";
import { Loader2 } from "lucide-react";
import { useLanguage } from "./providers";
export function Loader({ fullPage = false }: { fullPage?: boolean }) {
  const { language } = useLanguage();
  return (
    <div
      className={`loader ${fullPage ? "loader-page" : ""}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 size={40} className="animate-spin" aria-hidden="true" />
      <span>{language === "si" ? "පූරණය වෙමින්..." : "Loading..."}</span>
    </div>
  );
}
