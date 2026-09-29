"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { SiteHeader } from "./site-header";
import { useLanguage } from "./providers";
import { Loader } from "./loader";
export function ResetPassword() {
  const { t } = useLanguage();
  const started = useRef(false);
  const [state, setState] = useState<"loading" | "ready" | "invalid" | "done">(
    "loading",
  );
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    window.history.replaceState(null, "", window.location.pathname);
    async function verify() {
      try {
        const response =
          fragment.get("type") === "recovery" && fragment.has("refresh_token")
            ? await fetch("/api/auth/recovery-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  refresh_token: fragment.get("refresh_token"),
                }),
                signal: AbortSignal.timeout(35000),
              })
            : await fetch("/api/auth/me", {
                cache: "no-store",
                signal: AbortSignal.timeout(20000),
              });
        setState(response.ok ? "ready" : "invalid");
      } catch {
        setState("invalid");
      }
    }
    void verify();
  }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: data.get("password") }),
        signal: AbortSignal.timeout(35000),
      });
      if (response.status === 401) {
        setState("invalid");
        return;
      }
      if (!response.ok) throw new Error("Password update failed");
      setState("done");
      gooeyToast.success(t.passwordUpdated);
    } catch {
      setFailed(true);
      gooeyToast.error(t.unavailable);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <SiteHeader simple />
      <main
        className="auth-layout container"
        style={{ display: "block", maxWidth: 480 }}
      >
        <Link className="back-link" href="/login">
          <ArrowLeft size={15} />
          {t.returnLogin}
        </Link>
        <div className="auth-form-wrap">
          <h1>{state === "done" ? t.passwordUpdated : t.recovery}</h1>
          {state === "loading" ? (
            <Loader />
          ) : state === "invalid" ? (
            <div role="alert">
              <p className="auth-subtitle">{t.recoveryInvalid}</p>
              <Link className="button primary" href="/forgot-password">
                {t.requestNewLink}
                <ArrowRight size={17} />
              </Link>
            </div>
          ) : state === "done" ? (
            <>
              <p className="auth-subtitle">{t.passwordUpdatedBody}</p>
              <Link href="/login" className="button primary">
                {t.login}
                <ArrowRight size={17} />
              </Link>
            </>
          ) : (
            <form onSubmit={submit} aria-busy={busy}>
              <div className="form-field">
                <label htmlFor="new-password">{t.newPassword}</label>
                <span className="input-wrap">
                  <LockKeyhole size={17} />
                  <input
                    id="new-password"
                    name="password"
                    required
                    minLength={8}
                    maxLength={128}
                    type={visible ? "text" : "password"}
                    autoComplete="new-password"
                    disabled={busy}
                    aria-describedby="new-password-hint"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={visible ? t.hidePassword : t.showPassword}
                    onClick={() => setVisible(!visible)}
                  >
                    {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
                <small id="new-password-hint">{t.passwordHint}</small>
              </div>
              {failed && (
                <p className="form-error" role="alert">
                  {t.unavailable}
                </p>
              )}
              <button className="button primary submit-button" disabled={busy}>
                {busy ? t.submitting : t.savePassword}
                <ArrowRight size={17} />
              </button>
              {busy && <Loader />}
            </form>
          )}
        </div>
      </main>
    </>
  );
}
