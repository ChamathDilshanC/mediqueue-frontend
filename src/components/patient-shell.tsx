"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brand, LanguageSelect } from "./site-header";
import { ThemeToggle } from "./theme-provider";
import { useLanguage } from "./providers";
import {
  HeartPulse,
  CalendarDays,
  Ticket,
  FileText,
  BedDouble,
  LogOut,
  ArrowUpRight,
} from "lucide-react";
const links = [
  ["care-home", "Overview", "දළ විශ්ලේෂණය", HeartPulse],
  ["my-queue", "My queue", "මගේ පෝලිම", Ticket],
  ["my-appointments", "Appointments", "හමුවීම්", CalendarDays],
  ["my-stays", "Ward stays", "නේවාසික තොරතුරු", BedDouble],
  ["my-records", "Health records", "සෞඛ්‍ය වාර්තා", FileText],
] as const;
export function PatientShell({
  children,
  name,
}: {
  children: React.ReactNode;
  name?: string;
}) {
  const { language } = useLanguage();
  const si = language === "si";
  const router = useRouter();
  const [active, setActive] = useState("care-home");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true);
    try {
      const r = await fetch("/api/auth/logout", { method: "POST" });
      if (!r.ok) throw Error();
      router.replace("/patient/login");
      router.refresh();
    } catch {
      setError(si ? "නැවත උත්සාහ කරන්න" : "Unable to sign out. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="care-shell">
      <aside className="care-sidebar" aria-label="Patient navigation">
        <Brand destination="/patient" />
        <div className="care-sidebar-caption">
          {si ? "ඔබේ සෞඛ්‍ය අවකාශය" : "YOUR CARE SPACE"}
        </div>
        <nav>
          {links.map(([id, en, sinhala, Icon]) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={() => setActive(id)}
              aria-current={active === id ? "page" : undefined}
            >
              <Icon size={19} />
              {si ? sinhala : en}
            </a>
          ))}
        </nav>
        <div className="care-sidebar-note">
          <HeartPulse size={24} />
          <strong>{si ? "සුව පහසු ගමනක්" : "A little less waiting."}</strong>
          <p>
            {si
              ? "ඔබේ හමුවීම් සහ සෞඛ්‍ය තොරතුරු එකම තැනක."
              : "Your appointments, tickets and care. Together in one place."}
          </p>
          <a href="#book-care">
            {si ? "හමුවීමක් වෙන්කරන්න" : "Find an appointment"}
            <ArrowUpRight size={16} />
          </a>
        </div>
        <button
          className="care-signout"
          disabled={busy}
          onClick={() => void logout()}
        >
          <LogOut size={17} />
          {si ? "ඉවත් වන්න" : "Sign out"}
        </button>
      </aside>
      <div className="care-workspace">
        <header className="care-topbar">
          <div className="care-mobile-brand">
            <Brand destination="/patient" />
          </div>
          <span className="care-topbar-title">
            {si ? "රෝගී සේවා" : "Patient space"}
          </span>
          <div className="care-topbar-tools">
            <LanguageSelect />
            <ThemeToggle language={language} />
            <span className="care-avatar" title={name}>
              {(name || "M").slice(0, 1).toUpperCase()}
            </span>
            <button
              className="care-mobile-logout"
              aria-label={si ? "ඉවත් වන්න" : "Sign out"}
              disabled={busy}
              onClick={() => void logout()}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <nav className="care-mobile-nav" aria-label="Patient sections">
          {links.map(([id, en, sinhala, Icon]) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={() => setActive(id)}
              aria-current={active === id ? "page" : undefined}
            >
              <Icon size={17} />
              {si ? sinhala : en}
            </a>
          ))}
        </nav>
        {error && (
          <p
            role="alert"
            className="care-inline-error"
            style={{ padding: "16px 24px" }}
          >
            {error}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
