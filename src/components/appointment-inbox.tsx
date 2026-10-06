"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
} from "lucide-react";
import { useLanguage } from "./providers";
import { ModalSurface } from "./ui/modal-surface";

export const appointmentLabels: Record<string, [string, string]> = {
  PENDING: ["Pending approval", "අනුමැතිය බලාපොරොත්තුවෙන්"],
  BOOKED: ["Approved", "අනුමතයි"],
  REJECTED: ["Rejected", "ප්‍රතික්ෂේපයි"],
  CHECKED_IN: ["Arrived", "පැමිණ ඇත"],
  COMPLETED: ["Completed", "අවසන්"],
  CANCELLED: ["Cancelled", "අවලංගුයි"],
  NO_SHOW: ["Did not attend", "පැමිණ නැත"],
};
export const paymentLabels: Record<string, [string, string]> = {
  PAY_AT_HOSPITAL: ["Pay at hospital", "රෝහලේදී ගෙවීම"],
  CHECKOUT_STARTED: ["Online payment started", "Online ගෙවීම ආරම්භ කර ඇත"],
  PAID: ["Paid", "ගෙවා ඇත"],
  REVIEW_REQUIRED: ["Payment needs review", "ගෙවීම පරීක්ෂා කළ යුතුයි"],
  REFUND_REQUIRED: ["Refund required", "මුදල් ආපසු දිය යුතුයි"],
  REFUNDED: ["Refunded", "මුදල් ආපසු දී ඇත"],
};
// Money was received: the quotation can no longer change.
export const paymentLocked = new Set([
  "PAID",
  "REVIEW_REQUIRED",
  "REFUND_REQUIRED",
  "REFUNDED",
]);
type Resolution = "REFUND" | "ACCEPT";
type Appointment = {
  id: string;
  patient_name: string;
  patient_ref: string;
  doctor: string;
  room: string;
  starts_at: string;
  timezone: string;
  status: string;
  source: string;
  review_reason: string;
  reviewed_at: string | null;
  quotation?: { name: string; amount: number }[];
  payment_status?: string;
};
type Inbox = {
  items: Appointment[];
  total: number;
  counts: Record<string, number>;
};
const transitions: Record<string, string[]> = {
  PENDING: ["BOOKED", "REJECTED", "CANCELLED"],
  BOOKED: ["CHECKED_IN", "NO_SHOW", "CANCELLED"],
  CHECKED_IN: ["COMPLETED"],
};
const actionLabels: Record<string, [string, string]> = {
  BOOKED: ["Approve", "අනුමත කරන්න"],
  REJECTED: ["Reject", "ප්‍රතික්ෂේප කරන්න"],
  CHECKED_IN: ["Mark arrived", "පැමිණීම සටහන් කරන්න"],
  NO_SHOW: ["Mark absent", "නොපැමිණීම සටහන් කරන්න"],
  COMPLETED: ["Complete", "අවසන් කරන්න"],
  CANCELLED: ["Cancel", "අවලංගු කරන්න"],
};

export function AppointmentInbox({ role }: { role: string }) {
  const { language } = useLanguage();
  const si = language === "si";
  const label = (state: string) =>
    appointmentLabels[state]?.[si ? 1 : 0] || state;
  const actionLabel = (state: string) =>
    actionLabels[state]?.[si ? 1 : 0] || state;
  const [filter, setFilter] = useState("ACTIVE");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selection, setSelection] = useState<{
    row: Appointment;
    status: string;
  } | null>(null);
  const [quotationSelection, setQuotationSelection] = useState<Appointment | null>(null);
  const [quotationText, setQuotationText] = useState("");
  const [reason, setReason] = useState("");
  const [resolution, setResolution] = useState<{
    row: Appointment;
    action: Resolution;
  } | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  const pageSize = 6;
  const key = `/api/backend/appointment-inbox?limit=${pageSize}&offset=${page * pageSize}&status=${filter}&q=${encodeURIComponent(query)}`;
  const {
    data,
    error: loadError,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<Inbox>(
    key,
    async (url: string) => {
      const response = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
      const value = await response.json();
      if (!response.ok || !Array.isArray(value.items))
        throw Error(
          si ? "හමුවීම් පූරණය කළ නොහැක." : "Unable to load appointments.",
        );
      return value;
    },
    { revalidateOnFocus: false },
  );
  async function update() {
    if (!selection || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/backend/appointments/${selection.row.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: selection.status,
            reason: reason.trim(),
          }),
          signal: AbortSignal.timeout(20000),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw Error(
          typeof result.detail === "string"
            ? result.detail
            : "Unable to update appointment.",
        );
      setNotice(`${selection.row.patient_name} · ${label(selection.status)}`);
      setSelection(null);
      await mutate();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function resolvePayment() {
    if (!resolution || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/backend/appointments/${resolution.row.id}/payment-resolution`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: resolution.action,
            note: resolutionNote.trim(),
          }),
          signal: AbortSignal.timeout(30000),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw Error(
          typeof result.detail === "string"
            ? result.detail
            : "Unable to update the payment.",
        );
      setNotice(
        `${resolution.row.patient_name} · ${paymentLabels[result.payment_status]?.[si ? 1 : 0] ?? result.payment_status}`,
      );
      setResolution(null);
      await mutate();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveQuotation() {
    if (!quotationSelection || busy) return;
    const quotation = quotationText.split("\n").map((line) => {
      const [name, amount] = line.split("|");
      return { name: name?.trim() || "", amount: Number(amount?.trim()) };
    });
    if (quotation.some((item) => !item.name || !Number.isFinite(item.amount) || item.amount < 0)) {
      setError(si ? "භාණ්ඩය සහ වලංගු මුදල ඇතුළත් කරන්න." : "Enter an item name and a valid amount on every line.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/backend/appointments/${quotationSelection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: quotationSelection.status, quotation }),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok) throw Error(typeof result.detail === "string" ? result.detail : "Unable to save quotation.");
      setNotice(si ? "Quotation සාර්ථකව සුරකින ලදී." : "Quotation saved.");
      setQuotationSelection(null);
      await mutate();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="appointment-inbox"
      aria-label={si ? "හමුවීම් කළමනාකරණය" : "Appointment management"}
    >
      <div className="appointment-tabs" role="tablist" aria-label={si ? "හමුවීම් වර්ගය" : "Appointment type"}>
        {(["ACTIVE", "INVALID"] as const).map((status) => (
          <button
            key={status}
            role="tab"
            aria-selected={filter === status}
            onClick={() => {
              setFilter(status);
              setPage(0);
            }}
          >
            <span>{status === "ACTIVE" ? (si ? "සක්‍රීය හමුවීම්" : "Active appointments") : (si ? "අවලංගු හමුවීම්" : "Invalid appointments")}</span>
            <strong>
              {data
                ? status === "ACTIVE"
                  ? ["PENDING", "BOOKED", "CHECKED_IN"].reduce((total, item) => total + (data.counts[item] ?? 0), 0)
                  : ["REJECTED", "CANCELLED", "NO_SHOW"].reduce((total, item) => total + (data.counts[item] ?? 0), 0)
                : "—"}
            </strong>
          </button>
        ))}
      </div>
      <div className="appointment-toolbar">
        <label className="appointment-search">
          <Search size={18} />
          <input
            aria-label={si ? "හමුවීම් සොයන්න" : "Search appointments"}
            placeholder={
              si ? "රෝගියා, අංකය හෝ වෛද්‍යවරයා" : "Patient, reference or doctor"
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label={si ? "හමුවීම් තත්ත්වය" : "Appointment status"}
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="ACTIVE">{si ? "සක්‍රීය හමුවීම්" : "Active appointments"}</option>
          <option value="INVALID">{si ? "අවලංගු හමුවීම්" : "Invalid appointments"}</option>
          {Object.keys(appointmentLabels).map((status) => (
            <option key={status} value={status}>
              {label(status)}
            </option>
          ))}
        </select>
        <button
          className="button secondary"
          onClick={() => void mutate()}
          disabled={isValidating}
        >
          <RefreshCw size={16} />
          {si ? "යාවත්කාලීන කරන්න" : "Refresh"}
        </button>
      </div>
      {notice && (
        <p className="appointment-notice" role="status">
          <Check size={16} />
          {notice}
        </p>
      )}
      {loadError && (
        <p className="form-error" role="alert">
          {loadError.message}{" "}
          <button className="button secondary" onClick={() => void mutate()}>
            {si ? "නැවත උත්සාහ කරන්න" : "Retry"}
          </button>
        </p>
      )}
      {isLoading && (
        <p role="status">
          {si ? "හමුවීම් පූරණය වෙමින්..." : "Loading appointments..."}
        </p>
      )}
      {!isLoading && !loadError && data?.items.length === 0 && (
        <div className="appointment-empty">
          <CalendarDays size={32} />
          <h3>{si ? "හමුවීම් හමු නොවීය" : "No appointments found"}</h3>
          <p>
            {si
              ? "වෙනත් තත්ත්වයක් හෝ සෙවුමක් භාවිතා කරන්න."
              : "Try another status or search. Patient requests will appear here."}
          </p>
        </div>
      )}
      <div className="appointment-list">
        {data?.items.map((row) => (
          <article key={row.id} className="appointment-row">
            <div className="appointment-person">
              <span className="appointment-avatar">
                {row.patient_name.slice(0, 1)}
              </span>
              <div>
                <h3>{row.patient_name}</h3>
                <p>
                  {row.patient_ref} ·{" "}
                  {row.source === "PATIENT"
                    ? si
                      ? "රෝගී ඉල්ලීම"
                      : "Patient request"
                    : si
                      ? "කාර්ය මණ්ඩල වෙන්කිරීම"
                      : "Staff booking"}
                </p>
              </div>
            </div>
            <div className="appointment-session">
              <strong>{row.doctor}</strong>
              <p>
                {new Intl.DateTimeFormat(si ? "si-LK" : "en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: row.timezone || "Asia/Colombo",
                }).format(new Date(row.starts_at))}
              </p>
              <small>{row.room}</small>
            </div>
            <div>
              <span
                className={`appointment-status status-${row.status.toLowerCase()}`}
              >
                {label(row.status)}
              </span>
              {row.payment_status && paymentLabels[row.payment_status] && (
                <span
                  className={`appointment-payment payment-${row.payment_status.toLowerCase()}`}
                >
                  {paymentLabels[row.payment_status][si ? 1 : 0]}
                </span>
              )}
              {row.review_reason && (
                <p className="appointment-reason">{row.review_reason}</p>
              )}
              {row.reviewed_at && (
                <small>
                  {si ? "තීරණය කළ දිනය" : "Reviewed"}:{" "}
                  {new Date(row.reviewed_at).toLocaleDateString(
                    si ? "si-LK" : "en-GB",
                    { timeZone: row.timezone },
                  )}
                </small>
              )}
            </div>
            <div className="appointment-actions">
              {["admin", "reception"].includes(role) &&
                row.payment_status === "REVIEW_REQUIRED" &&
                !["CANCELLED", "REJECTED"].includes(row.status) && (
                  <button
                    className="button primary"
                    disabled={busy}
                    onClick={() => {
                      setResolution({ row, action: "ACCEPT" });
                      setResolutionNote("");
                      setError("");
                    }}
                  >
                    {si ? "ගෙවීම පිළිගන්න" : "Accept payment"}
                  </button>
                )}
              {["admin", "reception"].includes(role) &&
                ["REVIEW_REQUIRED", "REFUND_REQUIRED"].includes(
                  row.payment_status ?? "",
                ) && (
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => {
                      setResolution({ row, action: "REFUND" });
                      setResolutionNote("");
                      setError("");
                    }}
                  >
                    {si ? "මුදල් ආපසු දෙන්න" : "Refund"}
                  </button>
                )}
              {["admin", "staff", "reception"].includes(role) &&
                !paymentLocked.has(row.payment_status ?? "") && (
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => {
                    setQuotationSelection(row);
                    setQuotationText((row.quotation || []).map((item) => `${item.name} | ${item.amount}`).join("\n"));
                    setError("");
                  }}
                >
                  {si ? "මිල ගණන" : "Quotation"}
                </button>
              )}
              {["admin", "staff", "reception"].includes(role) &&
                (transitions[row.status] || []).map((status) => (
                  <button
                    key={status}
                    className={`button ${status === "BOOKED" || status === "CHECKED_IN" ? "primary" : "secondary"}`}
                    disabled={busy}
                    onClick={() => {
                      setSelection({ row, status });
                      setReason("");
                      setError("");
                    }}
                  >
                    {actionLabel(status)}
                  </button>
                ))}
            </div>
          </article>
        ))}
      </div>
      <footer className="appointment-pagination">
        <span>
          {si ? "මුළු හමුවීම්" : "Total appointments"}: {data?.total ?? 0} ·{" "}
          {si ? "පිටුව" : "Page"} {page + 1}
        </span>
        <div>
          <button
            aria-label="Previous appointments page"
            className="button secondary"
            disabled={page === 0 || isLoading}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            aria-label="Next appointments page"
            className="button secondary"
            disabled={isLoading || !data || (page + 1) * pageSize >= data.total}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </footer>
      {selection && (
        <ModalSurface
          label={actionLabel(selection.status)}
          busy={busy}
          onClose={() => setSelection(null)}
        >
          <form
            className="appointment-confirm"
            onSubmit={(e) => {
              e.preventDefault();
              void update();
            }}
          >
            <h2>{actionLabel(selection.status)}</h2>
            <p>
              {selection.row.patient_name} · {selection.row.doctor}
            </p>
            <p>
              {si ? "නව තත්ත්වය" : "New status"}:{" "}
              <strong>{label(selection.status)}</strong>
            </p>
            {selection.status === "REJECTED" && (
              <label>
                {si ? "ප්‍රතික්ෂේප කිරීමට හේතුව" : "Rejection reason"}
                <textarea
                  required
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={busy}
                />
              </label>
            )}
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <div className="appointment-actions">
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={() => setSelection(null)}
              >
                {si ? "ආපසු" : "Go back"}
              </button>
              <button
                type="submit"
                className="button primary"
                disabled={
                  busy || (selection.status === "REJECTED" && !reason.trim())
                }
              >
                {busy
                  ? si
                    ? "යාවත්කාලීන වෙමින්..."
                    : "Updating..."
                  : actionLabel(selection.status)}
              </button>
            </div>
          </form>
        </ModalSurface>
      )}
      {resolution && (
        <ModalSurface
          label={
            resolution.action === "REFUND"
              ? si
                ? "මුදල් ආපසු දෙන්න"
                : "Refund payment"
              : si
                ? "ගෙවීම පිළිගන්න"
                : "Accept payment"
          }
          busy={busy}
          onClose={() => setResolution(null)}
        >
          <form
            className="appointment-confirm"
            onSubmit={(event) => {
              event.preventDefault();
              void resolvePayment();
            }}
          >
            <h2>
              {resolution.action === "REFUND"
                ? si
                  ? "මුදල් ආපසු දෙන්න"
                  : "Refund payment"
                : si
                  ? "ගෙවීම පිළිගන්න"
                  : "Accept payment"}
            </h2>
            <p>
              {resolution.row.patient_name} · {resolution.row.doctor}
            </p>
            <p>
              {resolution.action === "REFUND"
                ? si
                  ? "Online ගෙවීම් සම්පූර්ණයෙන්ම Stripe හරහා ආපසු ගෙවනු ලැබේ."
                  : "Online payments are refunded in full through Stripe."
                : si
                  ? "ලැබුණු මුදල වත්මන් quotation එකට ගැලපෙන බව තහවුරු කරන්න."
                  : "Confirm the amount received matches what the patient owes."}
            </p>
            <label>
              {si ? "සටහන (විකල්ප)" : "Note (optional)"}
              <textarea
                maxLength={500}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                disabled={busy}
              />
            </label>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <div className="appointment-actions">
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={() => setResolution(null)}
              >
                {si ? "ආපසු" : "Go back"}
              </button>
              <button type="submit" className="button primary" disabled={busy}>
                {busy
                  ? si
                    ? "යාවත්කාලීන වෙමින්..."
                    : "Updating..."
                  : resolution.action === "REFUND"
                    ? si
                      ? "මුදල් ආපසු දෙන්න"
                      : "Refund"
                    : si
                      ? "පිළිගන්න"
                      : "Accept"}
              </button>
            </div>
          </form>
        </ModalSurface>
      )}
      {quotationSelection && (
        <ModalSurface
          label={si ? "Quotation සකසන්න" : "Create appointment quotation"}
          busy={busy}
          onClose={() => setQuotationSelection(null)}
        >
          <form
            className="appointment-confirm"
            onSubmit={(event) => {
              event.preventDefault();
              void saveQuotation();
            }}
          >
            <h2>{si ? "වෛද්‍ය ගාස්තු සහ medical items" : "Appointment quotation"}</h2>
            <p>
              {quotationSelection.patient_name} · {quotationSelection.doctor}
            </p>
            <label>
              {si
                ? "එක් පේළියකට: නම | මුදල (LKR)"
                : "One item per line: name | amount (LKR)"}
              <textarea
                rows={6}
                value={quotationText}
                onChange={(event) => setQuotationText(event.target.value)}
                placeholder={"Consultation fee | 2500\nBlood test | 1500"}
                disabled={busy}
              />
            </label>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <div className="appointment-actions">
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={() => setQuotationSelection(null)}
              >
                {si ? "ආපසු" : "Go back"}
              </button>
              <button type="submit" className="button primary" disabled={busy}>
                {busy
                  ? si
                    ? "සුරකිමින්..."
                    : "Saving..."
                  : si
                    ? "සුරකින්න"
                    : "Save quotation"}
              </button>
            </div>
          </form>
        </ModalSurface>
      )}
    </section>
  );
}
