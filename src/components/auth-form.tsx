"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { gooeyToast } from "goey-toast";
import { SiteHeader } from "./site-header";
import { QueuePreview } from "./queue-preview";
import { Loader } from "./loader";
import { useLanguage } from "./providers";
import type { Messages } from "@/lib/translations";
import { GoogleMark } from "./google-mark";
export type AuthMode = "login" | "register" | "forgot-password";
export function AuthForm({
  mode,
  initialError = null,
  audience = "staff",
}: {
  mode: AuthMode;
  initialError?: keyof Messages | null;
  audience?: "patient" | "staff";
}) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<keyof Messages | null>(initialError);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timeout = window.setTimeout(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearTimeout(timeout);
  }, [cooldown]);
  const [sent, setSent] = useState(false);
  const register = mode === "register";
  const recovery = mode === "forgot-password";
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || googleBusy || cooldown > 0) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email")).trim();
    const payload = recovery
      ? { email }
      : {
          email,
          password: String(data.get("password")),
          ...(register
            ? { display_name: String(data.get("display_name")).trim() }
            : {}),
        };
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok) {
        const key: keyof Messages = [
          "invalid",
          "validation",
          "rateLimit",
          "emailRateLimit",
          "emailQuota",
        ].includes(result.error)
          ? result.error
          : "unavailable";
        setError(key);
        if (response.status === 429)
          setCooldown(
            Number.isFinite(result.retryAfter)
              ? Math.max(1, Math.min(86400, result.retryAfter))
              : 60,
          );
        gooeyToast.error(t[key]);
        return;
      }
      if (recovery || result.confirmationRequired) {
        setSent(true);
        gooeyToast.success(recovery ? t.recoverySent : t.confirmation);
      } else {
        gooeyToast.success(t.success);
        router.replace(audience === "patient" ? "/patient" : "/account");
        router.refresh();
      }
    } catch {
      setError("unavailable");
      gooeyToast.error(t.unavailable);
    } finally {
      setBusy(false);
    }
  }
  async function signInWithGoogle() {
    if (busy || googleBusy) return;
    setGoogleBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/auth/google?audience=${audience}`, {
        method: "POST",
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok || !result.url) {
        setError("googleUnavailable");
        gooeyToast.error(t.googleUnavailable);
        setGoogleBusy(false);
        return;
      }
      window.location.assign(result.url);
    } catch {
      setError("googleFailed");
      gooeyToast.error(t.googleFailed);
      setGoogleBusy(false);
    }
  }
  return (
    <>
      <SiteHeader simple />
      <main className="auth-layout container">
        <section className="auth-form-side">
          <Link href="/" className="back-link">
            <ArrowLeft size={15} />
            {t.back}
          </Link>
          {sent ? (
            <div className="auth-success" role="status">
              <span className="success-icon">
                <Check size={29} />
              </span>
              <h1>{recovery ? t.recoverySent : t.confirmation}</h1>
              <p>{recovery ? t.recoveryBody : t.confirmationBody}</p>
              <Link
                href={audience === "patient" ? "/patient/login" : "/login"}
                className="button primary"
              >
                {t.returnLogin}
                <ArrowRight size={17} />
              </Link>
            </div>
          ) : (
            <div className="auth-form-wrap">
              <span className="auth-mark">
                <HeartMark />
              </span>
              <p className="eyebrow">MEDIQUEUE</p>
              {!recovery && (
                <nav className="flex gap-3 mb-4" aria-label="Sign in options">
                  <Link
                    className={`button ${audience === "patient" ? "primary" : "secondary"}`}
                    href={`/patient/${register ? "register" : "login"}`}
                  >
                    {language === "si" ? "රෝගී" : "Patient"}
                  </Link>
                  <Link
                    className={`button ${audience === "staff" ? "primary" : "secondary"}`}
                    href={`/${register ? "register" : "login"}`}
                  >
                    {language === "si"
                      ? "කාර්ය මණ්ඩල / පරිපාලක"
                      : "Staff / administrator"}
                  </Link>
                </nav>
              )}
              <h1>
                {audience === "patient" && !recovery
                  ? language === "si"
                    ? register
                      ? "රෝගී ගිණුමක් සාදන්න"
                      : "රෝගී ගිණුමට පිවිසෙන්න"
                    : register
                      ? "Create your patient account"
                      : "Patient sign in"
                  : recovery
                    ? t.recovery
                    : register
                      ? t.registerTitle
                      : t.welcome}
              </h1>
              <p className="auth-subtitle">
                {audience === "patient" && !recovery
                  ? language === "si"
                    ? "ඔබගේ හමුවීම්, වෛද්‍ය වාර්තා සහ බිල්පත් කළමනාකරණය කරන්න."
                    : "Manage your appointments, medical records and bills."
                  : recovery
                    ? t.recoveryIntro
                    : register
                      ? t.registerIntro
                      : t.authIntro}
              </p>
              {!recovery && (
                <>
                  <button
                    type="button"
                    className="button google-button"
                    onClick={signInWithGoogle}
                    disabled={busy || googleBusy}
                  >
                    <GoogleMark />
                    {googleBusy ? t.googleOpening : t.google}
                  </button>
                  <div className="auth-divider">
                    <span>{t.emailAlternative}</span>
                  </div>
                </>
              )}
              <form onSubmit={submit} aria-busy={busy}>
                {register && (
                  <label className="form-field">
                    {t.name}
                    <span className="input-wrap">
                      <UserRound size={17} />
                      <input
                        name="display_name"
                        autoComplete="name"
                        required
                        maxLength={200}
                        placeholder={t.namePlaceholder}
                        disabled={busy}
                      />
                    </span>
                  </label>
                )}
                <label className="form-field">
                  {t.email}
                  <span className="input-wrap">
                    <Mail size={17} />
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      placeholder="you@example.com"
                      disabled={busy}
                      spellCheck={false}
                    />
                  </span>
                </label>
                {!recovery && (
                  <div className="form-field">
                    <div className="field-title">
                      <label htmlFor="password">{t.password}</label>
                      {!register && (
                        <Link href="/forgot-password">{t.forgot}</Link>
                      )}
                    </div>
                    <span className="input-wrap">
                      <LockKeyhole size={17} />
                      <input
                        id="password"
                        name="password"
                        type={visible ? "text" : "password"}
                        autoComplete={
                          register ? "new-password" : "current-password"
                        }
                        required
                        minLength={8}
                        maxLength={128}
                        placeholder="••••••••"
                        disabled={busy}
                        aria-describedby={
                          register ? "password-hint" : undefined
                        }
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setVisible(!visible)}
                        aria-label={visible ? t.hidePassword : t.showPassword}
                        aria-pressed={visible}
                      >
                        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </span>
                    {register && (
                      <small id="password-hint">{t.passwordHint}</small>
                    )}
                  </div>
                )}
                {error && (
                  <p className="form-error" role="alert">
                    {t[error]}
                  </p>
                )}
                <button
                  className="button primary submit-button"
                  type="submit"
                  disabled={busy || googleBusy || cooldown > 0}
                >
                  {busy
                    ? t.submitting
                    : cooldown > 0
                      ? t.retryIn.replace("{seconds}", String(cooldown))
                      : recovery
                        ? t.sendRecovery
                        : register
                          ? t.signUp
                          : t.signIn}
                  {!busy && <ArrowRight size={17} />}
                </button>
                {busy && (
                  <div className="auth-loading">
                    <Loader />
                  </div>
                )}
              </form>
              <div className="auth-switch">
                {recovery ? (
                  <Link
                    href={audience === "patient" ? "/patient/login" : "/login"}
                  >
                    {t.returnLogin}
                  </Link>
                ) : (
                  <>
                    {register ? t.hasAccount : t.noAccount}{" "}
                    <Link
                      href={
                        audience === "patient"
                          ? register
                            ? "/patient/login"
                            : "/patient/register"
                          : register
                            ? "/login"
                            : "/register"
                      }
                    >
                      {register ? t.login : t.signUpLink}
                      <ArrowUpRightMini />
                    </Link>
                  </>
                )}
              </div>
              <div className="auth-privacy">
                <ShieldCheck size={15} />
                <p>{t.privacyNote}</p>
              </div>
            </div>
          )}
        </section>
        <aside className="auth-visual-side">
          <span className="eyebrow-pill">
            <span className="status-dot" />
            {t.badge}
          </span>
          <h2>
            {t.hero1}
            <br />
            <span>{t.hero2}</span>
          </h2>
          <QueuePreview compact />
          <p className="auth-visual-caption">{t.built}</p>
        </aside>
      </main>
    </>
  );
}
function HeartMark() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
      <path d="M3 12h4l2-4 4 8 2-4h6" />
    </svg>
  );
}
function ArrowUpRightMini() {
  return <ArrowRight size={12} style={{ transform: "rotate(-40deg)" }} />;
}
