"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, FileText, HeartPulse, RefreshCw } from "lucide-react";
import { PatientShell } from "./patient-shell";
import { PatientQueue } from "./patient-queue";
import { useLanguage } from "./providers";
import { StayDetails } from "./ward-stay";
import { apiJson } from "@/lib/api-json";

type Center = { id: string; tenant_id: string; name: string };
type Slot = {
  id: string;
  doctor: string;
  specialty: string;
  starts_at: string;
  capacity: number;
};
type Overview = {
  ward_stays?: {
    id: string;
    ward: string;
    bed: string | null;
    status: string;
    admitted_at: string;
    bed_assigned_at: string | null;
    stay_days: number;
    bed_days: number | null;
    planned_discharge_at: string | null;
    discharged_at: string | null;
    discharge_state: string;
    timezone: string;
  }[];
  profiles: { id: string; name: string; mrn: string; tenant_id: string }[];
  appointments: {
    id: string;
    status: string;
    doctor: string;
    starts_at: string;
  }[];
  records: Record<string, unknown>[];
};
export function PatientPortal() {
  const { language } = useLanguage();
  const si = language === "si";
  const router = useRouter();
  const [centers, setCenters] = useState<Center[]>([]);
  const [center, setCenter] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const request = useCallback(
    async (path: string, init?: RequestInit) => {
      const response = await fetch(`/api/backend/patient/${path}`, {
        ...init,
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(20000),
      });
      if (response.status === 401) {
        router.replace("/patient/login");
        throw new Error(si ? "නැවත පිවිසෙන්න" : "Please sign in again");
      }
      return apiJson(
        response,
        si
          ? "සෞඛ්‍ය සේවා දත්ත දැනට ලබාගත නොහැක. නැවත උත්සාහ කරන්න."
          : "Healthcare data is temporarily unavailable. Please try again.",
      );
    },
    [router, si],
  );
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [list, data] = await Promise.all([
        request("centers"),
        request("overview"),
      ]);
      setCenters(list);
      setOverview(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [request]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    setSlots([]);
    if (!center) return;
    const controller = new AbortController();
    void request(`schedules/${center}`)
      .then((data) => {
        if (!controller.signal.aborted) setSlots(data);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [center, request]);
  async function action(path: string, method: string, body?: unknown) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request(path, {
        method,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      await load();
      setNotice(si ? "සාර්ථකව සුරකින ලදී" : "Saved successfully");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const selected = centers.find((c) => c.id === center);
  const enrolled = overview?.profiles.some(
    (p) => p.tenant_id === selected?.tenant_id,
  );
  const date = (value: string) =>
    new Date(value).toLocaleString(si ? "si-LK" : "en-GB", {
      timeZone: "Asia/Colombo",
    });
  return (
    <PatientShell name={overview?.profiles[0]?.name}>
      <main className="patient-portal care-page" id="care-home">
        <div className="patient-heading care-hero">
          <div>
            <p className="eyebrow">
              {si ? "ඔබ වෙනුවෙන්, සෑම පියවරකදීම" : "HERE FOR YOU, EVERY STEP"}
            </p>
            <h1>
              {si ? "ඔබේ සෞඛ්‍ය සේවා එකම තැනක" : "Your care, in one place"}
            </h1>
            <p>
              {si
                ? "ඔබේ හමුවීම්, පෝලිම් සහ සෞඛ්‍ය තොරතුරු පහසුවෙන් කළමනාකරණය කරන්න."
                : "A calmer hospital visit starts here. Your appointments, queue and health records, together."}
            </p>
          </div>
          <a className="button primary" href="#book-care">
            {si ? "හමුවීමක් වෙන්කරන්න" : "Book an appointment"} ↗
          </a>
        </div>
        <div className="care-overview-stats">
          <article>
            <CalendarDays size={22} />
            <span>{si ? "ඉදිරි හමුවීම්" : "Upcoming appointments"}</span>
            <strong>
              {overview?.appointments.filter((a) => a.status === "BOOKED")
                .length ?? "—"}
            </strong>
          </article>
          <article>
            <HeartPulse size={22} />
            <span>{si ? "මගේ වාර්තා" : "My health records"}</span>
            <strong>{overview?.records.length ?? "—"}</strong>
          </article>
          <article>
            <FileText size={22} />
            <span>{si ? "රෝගී පැතිකඩ" : "Patient profiles"}</span>
            <strong>{overview?.profiles.length ?? "—"}</strong>
          </article>
        </div>
        {error && (
          <div className="account-error" role="alert">
            {error}
            <button className="button secondary" onClick={() => void load()}>
              <RefreshCw size={16} />
              {si ? "නැවත උත්සාහ කරන්න" : "Retry"}
            </button>
          </div>
        )}
        {notice && (
          <p role="status" className="availability available">
            {notice}
          </p>
        )}
        {loading && (
          <p role="status">{si ? "පූරණය වෙමින්..." : "Loading your care..."}</p>
        )}
        <PatientQueue center={center} enrolled={!!enrolled} />
        <div className="patient-grid">
          <section className="account-card" id="book-care">
            <CalendarDays size={24} />
            <h2>{si ? "හමුවීමක් වෙන්කරන්න" : "Book an appointment"}</h2>
            <label htmlFor="center">
              {si ? "රෝහල / වෛද්‍ය මධ්‍යස්ථානය" : "Hospital / medical center"}
            </label>
            <select
              id="center"
              value={center}
              onChange={(e) => setCenter(e.target.value)}
            >
              <option value="">
                {si ? "මධ්‍යස්ථානය තෝරන්න" : "Choose a center"}
              </option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {!centers.length && !loading && !error && (
              <p>{si ? "මධ්‍යස්ථාන නොමැත" : "No centers available yet."}</p>
            )}
            {selected && !enrolled && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  void action("profiles", "POST", {
                    branch_id: center,
                    full_name: data.get("full_name"),
                    mobile: data.get("mobile"),
                  });
                }}
              >
                <p>
                  {si
                    ? "මෙම රෝහලට ඔබගේ රෝගී පැතිකඩ සාදන්න."
                    : "Create your patient profile at this center."}
                </p>
                <label htmlFor="full_name">
                  {si ? "සම්පූර්ණ නම" : "Full name"}
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  required
                  maxLength={200}
                />
                <label htmlFor="mobile">
                  {si ? "දුරකථන අංකය" : "Mobile number"}
                </label>
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  required
                  maxLength={30}
                />
                <button disabled={busy} className="button primary">
                  {si ? "පැතිකඩ සාදන්න" : "Create patient profile"}
                </button>
              </form>
            )}
            {center && (
              <div className="patient-list">
                {slots.length === 0 ? (
                  <p>{si ? "ඉදිරි කාලසටහන් නොමැත" : "No upcoming sessions."}</p>
                ) : (
                  slots.map((s) => (
                    <article key={s.id}>
                      <strong>{s.doctor}</strong>
                      <p>
                        {s.specialty} · {date(s.starts_at)}
                      </p>
                      <button
                        className="button primary"
                        disabled={busy || !enrolled}
                        onClick={() =>
                          void action("appointments", "POST", {
                            schedule_id: s.id,
                          })
                        }
                      >
                        {si ? "වෙන්කරන්න" : "Book session"}
                      </button>
                    </article>
                  ))
                )}
              </div>
            )}
          </section>
          <section className="account-card" id="my-appointments">
            <HeartPulse size={24} />
            <h2>{si ? "මගේ හමුවීම්" : "My appointments"}</h2>
            <div className="patient-list">
              {overview?.appointments.length === 0 && (
                <p>
                  {si ? "තවම හමුවීම් නොමැත" : "You have no appointments yet."}
                </p>
              )}
              {overview?.appointments.map((a) => (
                <article key={a.id}>
                  <strong>{a.doctor}</strong>
                  <p>{date(a.starts_at)}</p>
                  <span className="eyebrow-pill">{a.status}</span>
                  {a.status === "BOOKED" && (
                    <button
                      disabled={busy}
                      className="button secondary"
                      onClick={() =>
                        void action(`appointments/${a.id}/cancel`, "PATCH")
                      }
                    >
                      {si ? "අවලංගු කරන්න" : "Cancel appointment"}
                    </button>
                  )}
                </article>
              ))}
            </div>
          </section>
          <section className="account-card patient-records" id="my-stays">
            <HeartPulse size={24} />
            <h2>{si ? "මගේ වෝඩ් නේවාසික තොරතුරු" : "My ward stays"}</h2>
            <div className="patient-stay-list">
              {!overview?.ward_stays?.length && (
                <p>
                  {si
                    ? "දැනට නේවාසික තොරතුරු නොමැත."
                    : "No ward stays to display yet."}
                </p>
              )}
              {overview?.ward_stays?.map((stay) => (
                <article key={stay.id}>
                  <h3>{stay.ward}</h3>
                  <p>
                    {si ? "ඇඳ" : "Bed"}: {stay.bed || "—"}
                  </p>
                  <StayDetails
                    stay={stay}
                    language={language}
                    zone={stay.timezone}
                  />
                </article>
              ))}
            </div>
          </section>
          <section className="account-card patient-records" id="my-records">
            <FileText size={24} />
            <h2>{si ? "මගේ වාර්තා සහ බිල්පත්" : "My records and bills"}</h2>
            <p>
              {si
                ? "අනුමත සායනික වාර්තා සහ නිකුත් කළ පරීක්ෂණ ප්‍රතිඵල මෙහි දිස්වේ."
                : "Signed clinical records and released test results appear here."}
            </p>
            <div className="patient-list">
              {overview?.records.length === 0 && (
                <p>{si ? "තවම වාර්තා නොමැත" : "No records available yet."}</p>
              )}
              {overview?.records.map((r) => (
                <article key={String(r.id)}>
                  <h3>
                    {(
                      {
                        "clinical-records": si
                          ? "සායනික වාර්තාව"
                          : "Clinical record",
                        prescriptions: si ? "ඖෂධ වට්ටෝරුව" : "Prescription",
                        "lab-orders": si ? "පරීක්ෂණ ප්‍රතිඵල" : "Lab result",
                        invoices: si ? "බිල්පත" : "Invoice",
                      } as Record<string, string>
                    )[String(r.module)] ||
                      String(r.module).replaceAll("-", " ")}
                  </h3>
                  <dl>
                    {Object.entries(r)
                      .filter(
                        ([k]) =>
                          ![
                            "id",
                            "patient_id",
                            "tenant_id",
                            "branch_id",
                            "version",
                            "module",
                          ].includes(k),
                      )
                      .map(([k, v]) => (
                        <div key={k}>
                          <dt>{k.replaceAll("_", " ")}</dt>
                          <dd>{String(v ?? "—")}</dd>
                        </div>
                      ))}
                  </dl>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </PatientShell>
  );
}
