import type { Language } from "@/lib/translations";
export type WardStay = {
  id: string;
  status: string;
  admitted_at: string;
  bed_assigned_at: string | null;
  stay_days: number;
  bed_days: number | null;
  planned_discharge_at: string | null;
  discharged_at: string | null;
  discharge_state: string;
};
const labels: Record<string, [string, string]> = {
  AVAILABLE: ["Available", "ලබාගත හැක"],
  OCCUPIED: ["Occupied", "භාවිතයේ"],
  RESERVED: ["Reserved", "වෙන්කර ඇත"],
  CLEANING: ["Cleaning", "පිරිසිදු කරමින්"],
  MAINTENANCE: ["Maintenance", "නඩත්තු"],
  INACTIVE: ["Inactive", "අක්‍රිය"],
  ADMITTED: ["Admitted", "ඇතුළත් කර ඇත"],
  DISCHARGED: ["Discharged", "පිටත් කර ඇත"],
  TRANSFERRED: ["Transferred", "මාරුකර ඇත"],
  CANCELLED: ["Cancelled", "අවලංගුයි"],
  NOT_SCHEDULED: ["Not scheduled", "දිනයක් නියම කර නැත"],
  SCHEDULED: ["Discharge scheduled", "පිටත් කිරීම නියමිතයි"],
  DUE_TODAY: ["Discharge due today", "අද පිටත් කිරීමට නියමිතයි"],
  OVERDUE: ["Past planned discharge", "නියමිත පිටත් දිනය ඉක්මවා ඇත"],
};
export function wardLabel(value: string, language: Language) {
  return (
    labels[value]?.[language === "si" ? 1 : 0] ?? value.replaceAll("_", " ")
  );
}
export function hospitalDate(
  value: string | null,
  language: Language,
  zone = "Asia/Colombo",
) {
  if (!value) return "—";
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: zone,
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function StayDetails({
  stay,
  language,
  zone,
}: {
  stay: WardStay;
  language: Language;
  zone: string;
}) {
  const si = language === "si";
  const entries = [
    [
      si ? "ඇතුළත් කළ දිනය" : "Admission date",
      hospitalDate(stay.admitted_at, language, zone),
    ],
    [
      si ? "ඇඳ ලබාදුන් දිනය" : "Bed allocated",
      hospitalDate(stay.bed_assigned_at, language, zone),
    ],
    [
      si ? "රෝහල්ගතව සිටි දින" : "Total stay",
      `${stay.stay_days} ${si ? "දින" : "days"}`,
    ],
    [
      si ? "මෙම ඇඳේ සිටි දින" : "Days in this bed",
      stay.bed_days === null ? "—" : `${stay.bed_days} ${si ? "දින" : "days"}`,
    ],
    [
      si ? "නියමිත පිටත් දිනය" : "Planned discharge",
      stay.planned_discharge_at
        ? hospitalDate(stay.planned_discharge_at, language, zone)
        : wardLabel("NOT_SCHEDULED", language),
    ],
    [
      si ? "පිටත් කළ දිනය" : "Actual discharge",
      hospitalDate(stay.discharged_at, language, zone),
    ],
    [
      si ? "ඇතුළත් කිරීමේ තත්ත්වය" : "Admission status",
      wardLabel(stay.status, language),
    ],
  ];
  return (
    <>
      <span
        className={`ward-discharge-chip ${stay.discharge_state.toLowerCase()}`}
      >
        {wardLabel(stay.discharge_state, language)}
      </span>
      <dl className="ward-stay-details">
        {entries.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="ward-day-note">
        {si
          ? "ඇතුළත් වූ දිනය පළමු දින ලෙස ගණන් කෙරේ. පිටත් කළ පසු දින ගණන වෙනස් නොවේ."
          : "Admission day counts as day 1. Completed stays stop counting at discharge."}
      </p>
    </>
  );
}
