"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  FileText,
  HeartPulse,
  RefreshCw,
  CheckCircle2,
  MapPin,
  X,
} from "lucide-react";
import { appointmentLabels } from "./appointment-inbox";
import { ModalSurface } from "./ui/modal-surface";
import { PatientShell } from "./patient-shell";
import { PatientQueue } from "./patient-queue";
import { useLanguage } from "./providers";
import { StayDetails } from "./ward-stay";
import { apiJson } from "@/lib/api-json";
import { HospitalFinder, directionsUrl, type Center } from "./hospital-finder";
import { Loader } from "./loader";

type Slot = {
  id: string;
  doctor: string;
  specialty: string;
  starts_at: string;
  capacity: number;
  ends_at?: string;
  remaining?: number;
  already_booked?: boolean;
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
    review_reason?: string;
    doctor: string;
    starts_at: string;
    center?: string;
    address?: string;
    timezone?: string;
    latitude?: number | null;
    longitude?: number | null;
  }[];
  records: Record<string, unknown>[];
};
export function PatientPortal() {
  const { language } = useLanguage();
  const si = language === "si";
  const router = useRouter();
  const [centers, setCenters] = useState<Center[]>([]);
  const [center, setCenter] = useState("");
  const [doctors, setDoctors] = useState<
    { id: string; name: string; specialty: string }[]
  >([]);
  const [doctorsError, setDoctorsError] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState("");
  const [sessionAttempt, setSessionAttempt] = useState(0);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [confirmSlot, setConfirmSlot] = useState<Slot | null>(null);
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
    const timer = window.setInterval(() => {
      void request("overview")
        .then(setOverview)
        .catch(() => undefined);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [request]);
  useEffect(() => {
    setSlots([]);
    setDoctors([]);
    setDoctorsError(false);
    setSessionsError("");
    setConfirmSlot(null);
    if (!center) {
      setSessionsLoading(false);
      return;
    }
    setSessionsLoading(true);
    const controller = new AbortController();
    void request(`doctors/${center}`)
      .then((data) => {
        if (!controller.signal.aborted) setDoctors(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setDoctorsError(true);
      });
    void request(`schedules/${center}`)
      .then((data) => {
        if (!controller.signal.aborted) setSlots(data);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setSessionsError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setSessionsLoading(false);
      });
    return () => controller.abort();
  }, [center, request, sessionAttempt]);
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
      setSessionAttempt((v) => v + 1);
      setNotice(
        path === "appointments"
          ? si
            ? "හමුවීම ඉල්ලා ඇත. රෝහලේ අනුමැතිය මගේ හමුවීම් යටතේ බලන්න."
            : "Appointment requested. The hospital will review it. Track the status under My appointments."
          : si
            ? "සාර්ථකව සුරකින ලදී"
            : "Saved successfully",
      );
      setConfirmSlot(null);
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
  const date = (value: string, zone = selected?.timezone || "Asia/Colombo") =>
    new Date(value).toLocaleString(si ? "si-LK" : "en-GB", {
      timeZone: zone,
    });
  const visibleSlots = slots.filter(
    (s) =>
      `${s.doctor} ${s.specialty}`
        .toLowerCase()
        .includes(doctorSearch.toLowerCase()) &&
      (!sessionDate ||
        new Date(s.starts_at).toLocaleDateString("en-CA", {
          timeZone: selected?.timezone || "Asia/Colombo",
        }) === sessionDate),
  );
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
          <a className="button primary" href="#find-care">
            {si ? "හමුවීමක් වෙන්කරන්න" : "Book an appointment"} ↗
          </a>
        </div>
        <div className="care-overview-stats">
          <article>
            <CalendarDays size={22} />
            <span>{si ? "ඉදිරි හමුවීම්" : "Upcoming appointments"}</span>
            <strong>
              {overview?.appointments.filter((a) =>
                ["PENDING", "BOOKED", "CHECKED_IN"].includes(a.status),
              ).length ?? "—"}
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
          <p role="status" className="care-booking-notice">
            <CheckCircle2 size={20} />
            {notice}
          </p>
        )}
        {loading && <Loader />}
        <HospitalFinder
          centers={centers}
          selected={center}
          onSelect={setCenter}
          loading={loading}
        />
        <PatientQueue center={center} enrolled={!!enrolled} />
        <div className="patient-grid">
          <section className="account-card" id="book-care">
            <CalendarDays size={24} />
            <h2>{si ? "හමුවීමක් වෙන්කරන්න" : "Book an appointment"}</h2>
            <ol className="booking-steps">
              <li className={center ? "done" : ""}>
                1 · {si ? "රෝහල" : "Choose hospital"}
              </li>
              <li className={enrolled ? "done" : ""}>
                2 · {si ? "පැතිකඩ" : "Your profile"}
              </li>
              <li>3 · {si ? "හමුවීම" : "Choose session"}</li>
            </ol>
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
                  defaultValue={overview?.profiles[0]?.name}
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
            {selected && enrolled && (
              <p className="booking-enrolled">
                <CheckCircle2 size={17} />
                {si
                  ? "ඔබගේ පැතිකඩ සූදානම්. පහත හමුවීමක් තෝරන්න."
                  : "Your profile is ready. Choose a session below."}
              </p>
            )}
            {center && (
              <div className="patient-list">
                <div className="booking-filters">
                  <input
                    aria-label={
                      si
                        ? "වෛද්‍යවරයා හෝ විශේෂඥතාව සොයන්න"
                        : "Search doctor or specialty"
                    }
                    placeholder={
                      si ? "වෛද්‍යවරයා හෝ විශේෂඥතාව" : "Doctor or specialty"
                    }
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                  />
                  <input
                    type="date"
                    aria-label={si ? "හමුවීමේ දිනය" : "Session date"}
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                  />
                </div>
                {doctorsError && (
                  <p role="alert">
                    {si
                      ? "වෛද්‍ය විස්තර ලබාගත නොහැක. නැවත උත්සාහ කරන්න."
                      : "Doctor details could not be loaded. Retry sessions to try again."}
                  </p>
                )}
                {doctors
                  .filter((d) =>
                    `${d.name} ${d.specialty}`
                      .toLowerCase()
                      .includes(doctorSearch.toLowerCase()),
                  )
                  .map((d) => {
                    const hasSessions = slots.some((s) => s.doctor === d.name);
                    return (
                      <article key={d.id} className="booking-doctor">
                        <strong>{d.name}</strong>
                        <p>{d.specialty}</p>
                        <p>
                          {hasSessions
                            ? si
                              ? "පහත හමුවීමක් තෝරන්න"
                              : "Choose an available session below"
                            : si
                              ? "මෙම වෛද්‍යවරයා සඳහා ඉදිරි කාලසටහනක් තවම පළ කර නැත."
                              : "No upcoming sessions published for this doctor yet."}
                        </p>
                        {hasSessions && (
                          <button
                            className="button secondary"
                            onClick={() => setDoctorSearch(d.name)}
                          >
                            {si ? "හමුවීම් බලන්න" : "View sessions"}
                          </button>
                        )}
                      </article>
                    );
                  })}
                {sessionsLoading ? (
                  <Loader />
                ) : sessionsError ? (
                  <div role="alert">
                    <p>{sessionsError}</p>
                    <button
                      className="button secondary"
                      onClick={() => setSessionAttempt((v) => v + 1)}
                    >
                      {si ? "නැවත උත්සාහ කරන්න" : "Retry sessions"}
                    </button>
                  </div>
                ) : slots.length === 0 ? (
                  <p>
                    {si
                      ? "ඉදිරි කාලසටහන් නොමැත"
                      : "No upcoming sessions. The hospital must publish a doctor’s schedule before appointments can be booked."}
                  </p>
                ) : (
                  visibleSlots.map((s) => (
                    <article key={s.id} className="booking-session">
                      <strong>{s.doctor}</strong>
                      <p>
                        {s.specialty} · {date(s.starts_at)}
                      </p>
                      <span
                        className={`session-availability ${s.remaining === 0 ? "full" : ""}`}
                      >
                        {s.already_booked
                          ? si
                            ? "ඔබ වෙන්කර ඇත"
                            : "Already booked"
                          : s.remaining !== undefined
                            ? `${s.remaining} ${si ? "ඉතිරි ස්ථාන" : "places available"}`
                            : `${si ? "ධාරිතාව" : "Capacity"}: ${s.capacity}`}
                      </span>
                      <button
                        className="button primary"
                        disabled={
                          busy ||
                          !enrolled ||
                          s.remaining === 0 ||
                          s.already_booked
                        }
                        onClick={() => setConfirmSlot(s)}
                      >
                        {si ? "වෙන්කරන්න" : "Book session"}
                      </button>
                    </article>
                  ))
                )}
                {!sessionsLoading &&
                  !sessionsError &&
                  slots.length > 0 &&
                  !visibleSlots.length && (
                    <p>
                      {si
                        ? "ගැළපෙන හමුවීම් නොමැත."
                        : "No sessions match your filters."}
                    </p>
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
                  <p>{date(a.starts_at, a.timezone || "Asia/Colombo")}</p>
                  {a.center && (
                    <p>
                      <MapPin size={15} /> {a.center}
                    </p>
                  )}
                  {a.address && <small>{a.address}</small>}
                  <span
                    className={`appointment-status status-${a.status.toLowerCase()}`}
                  >
                    {appointmentLabels[a.status]?.[si ? 1 : 0] || a.status}
                  </span>
                  {a.review_reason && <p>{a.review_reason}</p>}
                  {["PENDING", "BOOKED"].includes(a.status) && (
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
                          !/(^id$|_ids?$)/.test(k) &&
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
      {confirmSlot && (
        <ModalSurface
          label={si ? "හමුවීම තහවුරු කරන්න" : "Confirm your appointment"}
          onClose={() => setConfirmSlot(null)}
          busy={busy}
        >
          <section className="booking-dialog">
            <button
              className="care-icon-button booking-dialog-close"
              aria-label={si ? "වසන්න" : "Close confirmation"}
              disabled={busy}
              onClick={() => setConfirmSlot(null)}
              autoFocus
            >
              <X size={18} />
            </button>
            <span className="hospital-building">
              <CalendarDays size={25} />
            </span>
            <h2 id="booking-confirm-title">
              {si ? "හමුවීම තහවුරු කරන්න" : "Confirm your appointment"}
            </h2>
            <h3>{confirmSlot.doctor}</h3>
            <p>{confirmSlot.specialty}</p>
            <p>{selected?.name}</p>
            <p>{date(confirmSlot.starts_at)}</p>
            <p>
              {si
                ? "මෙය වෛද්‍ය සැසියේ ආරම්භක වේලාවයි. ඔබේ වාරය සඳහා පෝලිම් තොරතුරු බලන්න."
                : "This is the session start time. Your consultation order is managed by the care team."}
            </p>
            {selected && (
              <a
                href={directionsUrl(selected)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {si ? "රෝහලට මාර්ගය බලන්න" : "View hospital directions"} ↗
              </a>
            )}
            {error && (
              <p role="alert" className="care-inline-error">
                {error}
              </p>
            )}
            <div className="hospital-result-actions">
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => setConfirmSlot(null)}
              >
                {si ? "ආපසු" : "Go back"}
              </button>
              <button
                className="button primary"
                disabled={busy}
                onClick={() =>
                  void action("appointments", "POST", {
                    schedule_id: confirmSlot.id,
                  })
                }
              >
                {busy
                  ? si
                    ? "වෙන්කරමින්…"
                    : "Booking…"
                  : si
                    ? "හමුවීම තහවුරු කරන්න"
                    : "Confirm booking"}
              </button>
            </div>
          </section>
        </ModalSurface>
      )}
    </PatientShell>
  );
}
