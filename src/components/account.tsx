"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Check,
  HeartPulse,
  LogOut,
  LayoutGrid,
  UserRound,
} from "lucide-react";
import { gooeyToast } from "goey-toast";
import { useLanguage } from "./providers";
import { SiteHeader } from "./site-header";
import { Loader } from "./loader";
import { profileSchema, type Profile } from "@/lib/auth-contract";
export function Account() {
  const { t } = useLanguage();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/auth/me", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        if (!response.ok) throw new Error("Profile unavailable");
        const data = profileSchema.parse(await response.json());
        if (!data.memberships.some((m) => m.active)) {
          router.replace("/patient");
          return;
        }
        setProfile(data);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    }
    void load();
    return () => controller.abort();
  }, [router, attempt]);
  async function logout() {
    setBusy(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        signal: AbortSignal.timeout(35000),
      });
      if (!response.ok) throw new Error("Logout failed");
      const data = await response.json();
      if (data.localOnly) gooeyToast.warning(t.logoutLocal);
      else gooeyToast.success(t.loggedOut);
      router.replace("/login");
      router.refresh();
    } catch {
      gooeyToast.error(t.unavailable);
    } finally {
      setBusy(false);
    }
  }
  const roles = {
    admin: t.roleAdmin,
    staff: t.roleStaff,
    reception: t.roleReception,
    doctor: t.roleDoctor,
  };
  return (
    <>
      <SiteHeader simple />
      <main className="account-page container">
        <div className="account-toolbar">
          <Link
            href={
              profile?.memberships.some((m) => m.active)
                ? "/dashboard"
                : "/patient"
            }
            className="button primary"
          >
            <LayoutGrid size={16} />
            {t.backToDashboard}
          </Link>
          <button onClick={logout} disabled={busy} className="button secondary">
            <LogOut size={16} />
            {busy ? t.submitting : t.logout}
          </button>
        </div>
        {error ? (
          <div className="account-error" role="alert">
            <p>{t.unavailable}</p>
            <button
              className="button primary"
              onClick={() => {
                setError(false);
                setAttempt(attempt + 1);
              }}
            >
              {t.retry}
            </button>
            <Link className="button secondary" href="/login">
              {t.returnLogin}
            </Link>
          </div>
        ) : !profile ? (
          <Loader />
        ) : (
          <>
            <div className="account-welcome">
              <span className="eyebrow-pill">
                <span className="status-dot" />
                {t.account}
              </span>
              <h1>{t.accountTitle}</h1>
              <p>{t.accountIntro}</p>
            </div>
            <Link className="button secondary mb-6" href="/patient">
              Patient portal / රෝගී සේවා
            </Link>
            <div className="account-grid">
              <section className="account-card">
                <UserRound size={23} />
                <h2>{t.profile}</h2>
                <h3>{profile.display_name || t.account}</h3>
                <span className="availability available">
                  <Check size={12} />
                  {t.active}
                </span>
              </section>
              <section className="account-card">
                <Building2 size={23} />
                <h2>{t.memberships}</h2>
                {profile.memberships.length === 0 ? (
                  <p>{t.noMemberships}</p>
                ) : (
                  <ul className="membership-list">
                    {profile.memberships.map((m) => (
                      <li key={m.id}>
                        <strong>{m.hospital_name || t.memberships}</strong>
                        <span>{roles[m.role]}</span>
                        <span>{m.active ? t.active : t.inactive}</span>
                        <small>
                          {t.branch}:{" "}
                          <span className="latin">
                            {m.branch_name || t.unavailable}
                          </span>
                        </small>
                        {m.active && (
                          <button
                            className="button secondary"
                            onClick={() => {
                              document.cookie = `active_tenant_id=${m.tenant_id}; path=/; SameSite=Lax`;
                              document.cookie = `active_branch_id=${m.branch_id}; path=/; SameSite=Lax`;
                              window.location.assign("/dashboard");
                            }}
                          >
                            {t.backToDashboard}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
            <div className="account-next">
              <HeartPulse size={30} />
              <div>
                <h2>{t.nextTitle}</h2>
                <p>{t.nextBody}</p>
              </div>
              <Link href="/dashboard" aria-label="Open operations dashboard">
                <ArrowUpRight size={24} />
              </Link>
            </div>
          </>
        )}
      </main>
    </>
  );
}
