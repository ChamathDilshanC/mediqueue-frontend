"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BedDouble,
  CalendarClock,
  Clock3,
  RefreshCw,
  Search,
  UsersRound,
  ArrowUpRight,
  Building2,
  UserPlus,
} from "lucide-react";
import { z } from "zod";
import { apiJson } from "@/lib/api-json";
import { useLanguage } from "./providers";
import { hospitalDate, StayDetails, wardLabel } from "./ward-stay";
import { ModalSurface } from "./ui/modal-surface";
const staySchema = z.object({
  id: z.string(),
  status: z.string(),
  patient_id: z.string(),
  patient_name: z.string(),
  mrn: z.string(),
  admitted_at: z.string(),
  bed_assigned_at: z.string().nullable(),
  stay_days: z.number(),
  bed_days: z.number().nullable(),
  planned_discharge_at: z.string().nullable(),
  discharged_at: z.string().nullable(),
  discharge_state: z.string(),
  assigned_by: z.string(),
  discharged_by: z.string(),
});
const bedSchema = z.object({
  id: z.string(),
  number: z.string(),
  type: z.string(),
  status: z.string(),
  active: z.boolean(),
  room_id: z.string().nullable().optional(),
  room_name: z.string().nullable().optional(),
  admission: staySchema.nullable(),
});
const snapshotSchema = z.object({
  ward: z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    type: z.string(),
    floor: z.string(),
    building: z.string(),
    capacity: z.number(),
  }),
  timezone: z.string(),
  as_of: z.string(),
  summary: z.record(z.string(), z.number()),
  beds: z.array(bedSchema),
});
type Snapshot = z.infer<typeof snapshotSchema>;
type PatientOption = { id: string; external_ref?: string; mobile?: string; nic?: string };
const statuses = [
  "ALL",
  "OCCUPIED",
  "AVAILABLE",
  "RESERVED",
  "CLEANING",
  "MAINTENANCE",
  "INACTIVE",
];
export function WardBedBoard() {
  const { language } = useLanguage();
  const si = language === "si";
  const router = useRouter();
  const params = useSearchParams();
  const [wards, setWards] = useState<{ id: string; name: string }[]>([]);
  const [ward, setWard] = useState(params.get("ward") ?? "");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [selected, setSelected] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [wardAttempt, setWardAttempt] = useState(0);
  const [admissionOpen, setAdmissionOpen] = useState(false);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing");
  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientMobile, setPatientMobile] = useState("");
  const [patientNic, setPatientNic] = useState("");
  const [admissionBusy, setAdmissionBusy] = useState(false);
  const [admissionError, setAdmissionError] = useState("");
  const fallback = si
    ? "ඇඳන් තොරතුරු දැනට ලබාගත නොහැක. නැවත උත්සාහ කරන්න."
    : "Bed information is temporarily unavailable. Please try again.";
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const list: { id: string; name: string }[] = [];
        for (let offset = 0; ; offset += 200) {
          const response = await fetch(
            `/api/backend/wards?limit=200&offset=${offset}`,
            { signal: controller.signal, cache: "no-store" },
          );
          if (response.status === 401) {
            router.replace("/login");
            return;
          }
          const page = z
            .array(z.object({ id: z.string(), name: z.string() }))
            .parse(await apiJson(response, fallback));
          list.push(...page);
          if (page.length < 200) break;
        }
        setWards(list);
        setWard((value) =>
          list.some((w) => w.id === value) ? value : (list[0]?.id ?? ""),
        );
        setError("");
      } catch {
        if (!controller.signal.aborted) setError(fallback);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [router, fallback, wardAttempt]);
  useEffect(() => {
    if (!ward) return;
    const controller = new AbortController();
    setSnapshot(null);
    setSelected("");
    setLoading(true);
    setError("");
    async function load() {
      try {
        const response = await fetch(`/api/backend/wards/${ward}/bed-map`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        const data = snapshotSchema.parse(await apiJson(response, fallback));
        if (!controller.signal.aborted) {
          setSnapshot(data);
          setError("");
        }
      } catch {
        if (!controller.signal.aborted) setError(fallback);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    const interval = window.setInterval(() => void load(), 30000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [ward, attempt, router, fallback]);
  const beds = useMemo(
    () =>
      snapshot?.beds.filter(
        (b) =>
          (filter === "ALL" || b.status === filter) &&
          `${b.number} ${b.admission?.status === "ADMITTED" ? `${b.admission.patient_name} ${b.admission.mrn}` : ""}`
            .toLowerCase()
            .includes(search.toLowerCase().trim()),
      ) ?? [],
    [snapshot, filter, search],
  );
  useEffect(() => {
    if (!beds.some((b) => b.id === selected)) setSelected(beds[0]?.id ?? "");
  }, [beds, selected]);
  const bed = snapshot?.beds.find((b) => b.id === selected);
  const occupied = snapshot?.summary.occupied ?? 0;
  const available = snapshot?.summary.available ?? 0;
  const activeCount =
    snapshot?.beds.filter((b) => b.status !== "INACTIVE").length ?? 0;
  const percent = activeCount ? Math.round((occupied / activeCount) * 100) : 0;
  function refresh() {
    if (!wards.length) setWardAttempt((a) => a + 1);
    else setAttempt((a) => a + 1);
  }
  async function openAdmission() {
    setAdmissionError("");
    setAdmissionOpen(true);
    if (patients.length) return;
    try {
      const response = await fetch("/api/backend/patients?limit=100&offset=0", {
        cache: "no-store",
      });
      const data = await apiJson(response, fallback);
      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      setAdmissionError(error instanceof Error ? error.message : fallback);
    }
  }
  async function registerAdmission() {
    if (!bed || bed.status !== "AVAILABLE") return;
    setAdmissionBusy(true);
    setAdmissionError("");
    try {
      let selectedPatient = patientId;
      if (patientMode === "new") {
        if (!patientName.trim() || !patientMobile.trim()) {
          throw new Error(
            si ? "රෝගියාගේ නම සහ ජංගම දුරකථනය ඇතුළත් කරන්න." : "Enter the patient's name and mobile number.",
          );
        }
        const patientResponse = await fetch("/api/backend/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            external_ref: patientName.trim(),
            mobile: patientMobile.trim(),
            nic: patientNic.trim(),
          }),
        });
        const created = await apiJson(patientResponse, fallback);
        selectedPatient = created.id;
      }
      if (!selectedPatient) {
        throw new Error(si ? "රෝගියෙකු තෝරන්න." : "Select a patient.");
      }
      const admissionResponse = await fetch("/api/backend/ward-admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedPatient,
          ward_id: ward,
          bed_id: bed.id,
          admission_status: "ADMITTED",
          assigned_by: "Ward desk",
        }),
      });
      await apiJson(admissionResponse, fallback);
      setAdmissionOpen(false);
      setPatientId("");
      setPatientName("");
      setPatientMobile("");
      setPatientNic("");
      setAttempt((value) => value + 1);
    } catch (error) {
      setAdmissionError(error instanceof Error ? error.message : fallback);
    } finally {
      setAdmissionBusy(false);
    }
  }
  return (
    <section className="ward-board">
      <div className="ward-toolbar">
        <div>
          <span className="ward-eyebrow">
            <Building2 size={14} />
            {si ? "වෝඩ් එකේ සජීවී තත්ත්වය" : "WARD AT A GLANCE"}
          </span>
          <h2>
            {si
              ? "සෑම ඇඳක්ම. පැහැදිලි තොරතුරු."
              : "Every bed. A clear picture."}
          </h2>
          <p>
            {si
              ? "ඇඳක් තෝරා රෝගී තොරතුරු සහ රෝහල්ගතව සිටින කාලය බලන්න."
              : "Select a bed to view its patient, stay and discharge details."}
          </p>
        </div>
        <div className="ward-toolbar-actions">
          <label className="sr-only" htmlFor="board-ward">
            {si ? "වෝඩ් එක" : "Ward"}
          </label>
          <select
            id="board-ward"
            value={ward}
            onChange={(e) => {
              setWard(e.target.value);
              setSearch("");
              setFilter("ALL");
            }}
          >
            <option value="" disabled>
              {si ? "වෝඩ් එක තෝරන්න" : "Select ward"}
            </option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <button
            className="button secondary"
            disabled={loading}
            onClick={refresh}
            aria-label={si ? "නැවුම් කරන්න" : "Refresh bed board"}
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
      {error && (
        <div className="ward-error" role="alert">
          <span>{error}</span>
          <button className="button secondary" onClick={refresh}>
            {si ? "නැවත උත්සාහ කරන්න" : "Retry"}
          </button>
        </div>
      )}
      {loading && !snapshot && (
        <div className="ward-empty" role="status">
          <BedDouble size={36} />
          {si ? "ඇඳන් තොරතුරු පූරණය වෙමින්..." : "Loading bed information..."}
        </div>
      )}
      {!loading && !error && !wards.length && (
        <div className="ward-empty">
          <BedDouble size={36} />
          <h3>{si ? "තවම වෝඩ් නොමැත" : "No wards yet"}</h3>
          <Link className="button primary" href="/dashboard?resource=wards">
            {si ? "වෝඩ් කළමනාකරණය" : "Manage wards"}
          </Link>
        </div>
      )}
      {snapshot && (
        <>
          <div className="ward-summary">
            <article>
              <span className="ward-stat-icon occupied">
                <UsersRound size={20} />
              </span>
              <div>
                <span>{si ? "භාවිතයේ ඇඳන්" : "Occupied beds"}</span>
                <strong>
                  {occupied}
                  <small> / {activeCount}</small>
                </strong>
              </div>
            </article>
            <article>
              <span className="ward-stat-icon available">
                <BedDouble size={20} />
              </span>
              <div>
                <span>{si ? "ලබාගත හැකි ඇඳන්" : "Available beds"}</span>
                <strong>{available}</strong>
              </div>
            </article>
            <article>
              <span className="ward-stat-icon reserved">
                <CalendarClock size={20} />
              </span>
              <div>
                <span>{si ? "අද පිටත් කිරීම්" : "Discharge due today"}</span>
                <strong>{snapshot.summary.due_today ?? 0}</strong>
              </div>
            </article>
            <article>
              <span className="ward-stat-icon cleaning">
                <Clock3 size={20} />
              </span>
              <div>
                <span>
                  {si ? "නියමිත දිනය ඉක්මවා" : "Past planned discharge"}
                </span>
                <strong>{snapshot.summary.overdue ?? 0}</strong>
              </div>
            </article>
          </div>
          <div className="ward-occupancy">
            <div>
              <strong>{snapshot.ward.name}</strong>
              <span>
                {[
                  snapshot.ward.code,
                  snapshot.ward.building,
                  snapshot.ward.floor
                    ? `${si ? "මහල" : "Floor"} ${snapshot.ward.floor}`
                    : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
            <div className="ward-progress">
              <span>
                {percent}% {si ? "භාවිතයේ" : "occupancy"}
              </span>
              <div
                role="progressbar"
                aria-label={si ? "ඇඳන් භාවිතය" : "Bed occupancy"}
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${percent}%` }} />
              </div>
            </div>
          </div>
          <div className="ward-content">
            <div className="ward-map-side">
              <div className="ward-map-controls">
                <div className="ward-search">
                  <Search size={16} />
                  <input
                    aria-label={
                      si ? "ඇඳ හෝ රෝගියා සොයන්න" : "Search bed or patient"
                    }
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={
                      si
                        ? "ඇඳ, රෝගියා හෝ MRN සොයන්න"
                        : "Search bed, patient or MRN"
                    }
                  />
                </div>
                <span className="ward-bed-count">
                  {beds.length} {si ? "ඇඳන්" : "beds"}
                </span>
              </div>
              <div
                className="ward-filters"
                aria-label={si ? "ඇඳන් තත්ත්ව පෙරහන්" : "Bed status filters"}
              >
                {statuses.map((s) => (
                  <button
                    key={s}
                    className={filter === s ? "selected" : ""}
                    aria-pressed={filter === s}
                    onClick={() => setFilter(s)}
                  >
                    {s === "ALL" ? (
                      si ? (
                        "සියල්ල"
                      ) : (
                        "All beds"
                      )
                    ) : (
                      <>
                        <i className={`ward-dot ${s.toLowerCase()}`} />
                        {wardLabel(s, language)}
                      </>
                    )}
                  </button>
                ))}
              </div>
              <div className="ward-plan-heading">
                <Building2 size={18} />
                <strong>{si ? "වෝඩ් සැලැස්ම" : "Ward floor plan"}</strong>
                <span>
                  {si ? "ඇඳක් තෝරා විස්තර බලන්න" : "Select a numbered bed"}
                </span>
              </div>
              <div className="ward-floor-plan">
                <div className="ward-corridor" aria-hidden="true">
                  {si ? "මැද කොරිඩෝව" : "CENTRAL AISLE"}
                </div>
                <div className="ward-bed-grid">
                  {beds.map((b) => {
                    const current =
                      b.admission?.status === "ADMITTED" ? b.admission : null;
                    return (
                      <button
                        key={b.id}
                        className={`ward-bed-tile ${b.status.toLowerCase()} ${selected === b.id ? "chosen" : ""}`}
                        aria-label={`${si ? "ඇඳ" : "Bed"} ${b.number}, ${wardLabel(b.status, language)}`}
                        aria-pressed={selected === b.id}
                        onClick={() => setSelected(b.id)}
                      >
                        <div className="ward-bed-sketch" aria-hidden="true">
                          <span className="sketch-pillow" />
                          <span className="sketch-blanket" />
                          <span className="sketch-number">{b.number}</span>
                        </div>
                        <div className="ward-tile-top">
                          <span className="ward-bed-icon">
                            <BedDouble size={26} />
                          </span>
                          <span
                            className={`ward-status ${b.status.toLowerCase()}`}
                          >
                            {wardLabel(b.status, language)}
                          </span>
                        </div>
                        <strong>{b.number}</strong>
                        <span className="ward-bed-type">
                          {b.type.replaceAll("_", " ")}
                          {b.room_name ? ` · ${b.room_name}` : ""}
                        </span>
                        <div className="ward-tile-patient">
                          {current ? (
                            <>
                              <span>{current.patient_name}</span>
                              <small>
                                {si ? "රෝහල්ගත දින" : "Stay day"}{" "}
                                {current.stay_days} ·{" "}
                                {si ? "ඇඳේ දින" : "Bed day"} {current.bed_days}
                              </small>
                            </>
                          ) : (
                            <span>
                              {b.status === "AVAILABLE"
                                ? si
                                  ? "නව රෝගියෙකු සඳහා සූදානම්"
                                  : "Ready for a new patient"
                                : b.status === "OCCUPIED"
                                  ? si
                                    ? "ඇතුළත් කිරීමේ වාර්තාවක් නොමැත"
                                    : "Admission details unavailable"
                                  : wardLabel(b.status, language)}
                            </span>
                          )}
                        </div>
                        {current && (
                          <span
                            className={`ward-discharge-line ${current.discharge_state.toLowerCase()}`}
                          >
                            <CalendarClock size={13} />
                            {wardLabel(current.discharge_state, language)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="ward-plan-entry">
                {si ? "වෝඩ් පිවිසුම" : "WARD ENTRANCE"} ↑
              </div>
              {!beds.length && (
                <div className="ward-empty">
                  {snapshot.beds.length
                    ? si
                      ? "මෙම පෙරහනට ගැළපෙන ඇඳන් නොමැත"
                      : "No beds match your filters."
                    : si
                      ? "මෙම වෝඩ් එකට තවම ඇඳන් එකතු කර නැත"
                      : "No beds have been added to this ward."}
                  <Link href="/dashboard?resource=beds">
                    {si ? "ඇඳන් කළමනාකරණය" : "Manage beds"}
                  </Link>
                </div>
              )}
            </div>
            <aside
              className="ward-bed-detail"
              aria-label={si ? "තෝරාගත් ඇඳේ විස්තර" : "Selected bed details"}
            >
              {bed ? (
                <>
                  <div className="ward-detail-heading">
                    <span
                      className={`ward-bed-icon ${bed.status.toLowerCase()}`}
                    >
                      <BedDouble size={29} />
                    </span>
                    <div>
                      <span className="ward-eyebrow">
                        {si ? "ඇඳේ විස්තර" : "BED DETAILS"}
                      </span>
                      <h3>{bed.number}</h3>
                    </div>
                    <span className={`ward-status ${bed.status.toLowerCase()}`}>
                      {wardLabel(bed.status, language)}
                    </span>
                  </div>
                  <p className="ward-detail-location">
                    {snapshot.ward.name} · {bed.room_name ?? (si ? "කාමරයක් තෝරා නැත" : "No room assigned")} · {bed.type}
                  </p>
                  {bed.admission ? (
                    <>
                      {bed.admission.status !== "ADMITTED" && (
                        <p className="ward-last-stay">
                          {si
                            ? "අවසන් රෝහල්ගත වීම — මෙම ඇඳේ වර්තමාන රෝගියෙක් නොවේ"
                            : "Last stay — this patient is no longer in this bed"}
                        </p>
                      )}
                      <div className="ward-patient-info">
                        <UsersRound size={18} />
                        <div>
                          <strong>{bed.admission.patient_name}</strong>
                          <span>
                            {bed.admission.mrn ||
                              (si ? "MRN නොමැත" : "No MRN recorded")}
                          </span>
                        </div>
                      </div>
                      <StayDetails
                        stay={bed.admission}
                        language={language}
                        zone={snapshot.timezone}
                      />
                      {bed.admission.assigned_by && (
                        <p className="ward-day-note">
                          {si ? "භාරදුන්නේ" : "Assigned by"}:{" "}
                          {bed.admission.assigned_by}
                        </p>
                      )}
                      <Link
                        className="button secondary"
                        href="/dashboard?resource=ward-admissions"
                      >
                        {si ? "ඇතුළත් කිරීම් කළමනාකරණය" : "Manage admissions"}
                        <ArrowUpRight size={15} />
                      </Link>
                    </>
                  ) : (
                    <div className="ward-empty">
                      <BedDouble size={32} />
                      <p>
                        {bed.status === "AVAILABLE"
                          ? si
                            ? "මෙම ඇඳ ලබාගත හැක. ඇතුළත් කිරීමේ වාර්තාවක් නැත."
                            : "This bed is available. No admission has been recorded."
                          : si
                            ? "මෙම ඇඳ සඳහා ඇතුළත් කිරීමේ වාර්තාවක් නැත."
                            : "No admission has been recorded for this bed."}
                      </p>
                      {bed.status === "AVAILABLE" && (
                        <button className="button primary" onClick={() => void openAdmission()}>
                          <UserPlus size={16} />
                          {si ? "රෝගියා ඇතුළත් කරන්න" : "Register patient here"}
                        </button>
                      )}
                      <Link
                        className="button secondary"
                        href="/dashboard?resource=ward-admissions"
                      >
                        {si ? "ඇතුළත් කිරීම්" : "Manage admissions"}
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <div className="ward-empty">
                  {si
                    ? "විස්තර බැලීමට ඇඳක් තෝරන්න"
                    : "Select a bed to view details."}
                </div>
              )}
            </aside>
          </div>
          {admissionOpen && bed && (
            <ModalSurface
              label={si ? "ඇඳට රෝගියා ඇතුළත් කරන්න" : "Register patient to bed"}
              onClose={() => !admissionBusy && setAdmissionOpen(false)}
              busy={admissionBusy}
            >
              <div className="ward-admission-dialog">
                <h3>{si ? `${bed.number} සඳහා රෝගියා` : `Register patient to ${bed.number}`}</h3>
                <p>{si ? "රෝගියා තෝරන්න හෝ නව රෝගියෙකු ලියාපදිංචි කරන්න." : "Choose an existing patient or create a new patient profile."}</p>
                {admissionError && <div className="ward-error" role="alert">{admissionError}</div>}
                <div className="ward-admission-mode">
                  <button className={`button ${patientMode === "existing" ? "primary" : "secondary"}`} onClick={() => setPatientMode("existing")}>
                    {si ? "දැනට සිටින රෝගියා" : "Existing patient"}
                  </button>
                  <button className={`button ${patientMode === "new" ? "primary" : "secondary"}`} onClick={() => setPatientMode("new")}>
                    {si ? "නව රෝගියා" : "New patient"}
                  </button>
                </div>
                {patientMode === "existing" ? (
                  <label className="mq-field">
                    <span className="mq-field-label">{si ? "රෝගියා" : "Patient"}</span>
                    <select value={patientId} onChange={(event) => setPatientId(event.target.value)}>
                      <option value="">{si ? "රෝගියෙකු තෝරන්න" : "Select a patient"}</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>{patient.external_ref || patient.id} {patient.mobile ? `· ${patient.mobile}` : ""}</option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <div className="ward-admission-fields">
                    <label className="mq-field">
                      <span className="mq-field-label">{si ? "රෝගියාගේ නම" : "Patient name"}</span>
                      <input value={patientName} onChange={(event) => setPatientName(event.target.value)} placeholder={si ? "උදා: නිමල් පෙරේරා" : "e.g. Nimal Perera"} autoComplete="name" />
                    </label>
                    <label className="mq-field">
                      <span className="mq-field-label">{si ? "ජංගම දුරකථනය" : "Mobile number"}</span>
                      <input value={patientMobile} onChange={(event) => setPatientMobile(event.target.value)} placeholder="07XXXXXXXX" inputMode="tel" autoComplete="tel" />
                    </label>
                    <label className="mq-field">
                      <span className="mq-field-label">{si ? "ජා.හැ. අංකය (විකල්ප)" : "NIC (optional)"}</span>
                      <input value={patientNic} onChange={(event) => setPatientNic(event.target.value)} placeholder={si ? "විකල්ප" : "Optional"} />
                    </label>
                  </div>
                )}
                <div className="ward-admission-actions">
                  <button className="button secondary" onClick={() => setAdmissionOpen(false)} disabled={admissionBusy}>{si ? "අවලංගු කරන්න" : "Cancel"}</button>
                  <button className="button primary" onClick={() => void registerAdmission()} disabled={admissionBusy}>{admissionBusy ? "…" : si ? "ඇතුළත් කරන්න" : "Admit patient"}</button>
                </div>
              </div>
            </ModalSurface>
          )}
          <footer className="ward-board-footer">
            <span>
              <i className="ward-live-dot" />
              {si
                ? "තත්පර 30කට වරක් යාවත්කාලීන වේ"
                : "Updates every 30 seconds"}
              {error
                ? si
                  ? " · අවසන් සාර්ථක දත්ත පෙන්වයි"
                  : " · showing last successful data"
                : ""}
            </span>
            <span>
              {si ? "අවසන් යාවත්කාලීනය" : "Last updated"}:{" "}
              {hospitalDate(snapshot.as_of, language, snapshot.timezone)}
            </span>
          </footer>
        </>
      )}
    </section>
  );
}
