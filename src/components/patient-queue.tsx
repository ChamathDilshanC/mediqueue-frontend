"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ticket,
  ArrowUpRight,
  RefreshCw,
  MapPin,
  Users,
  CheckCircle2,
} from "lucide-react";
import { apiJson } from "@/lib/api-json";
import { useLanguage } from "./providers";
type TicketRow = {
  id: string;
  visit_id: string;
  label: string;
  status: string;
  stage: string;
  queue: string;
  room: string;
  business_date: string;
  is_today: boolean;
  ahead: number | null;
  now_serving: string[];
};
const labels: Record<string, [string, string]> = {
  WAITING: ["Waiting", "රැඳී සිටී"],
  CALLED: ["Your turn", "ඔබේ වාරය"],
  RECALLED: ["Called again", "නැවත කැඳවා ඇත"],
  IN_SERVICE: ["In progress", "සේවාව ලබාදෙමින්"],
  COMPLETED: ["Completed", "සම්පූර්ණයි"],
  NO_SHOW: [
    "Missed call — contact the counter",
    "කැඳවීම මඟහැරුණි — කවුන්ටරය අමතන්න",
  ],
  CANCELLED: ["Cancelled", "අවලංගුයි"],
};
export function PatientQueue({
  center,
  enrolled,
}: {
  center: string;
  enrolled: boolean;
}) {
  const { language } = useLanguage();
  const si = language === "si";
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [queues, setQueues] = useState<{ id: string; name: string }[]>([]);
  const [queue, setQueue] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pending = useRef<string | null>(null);
  const request = useCallback(
    async (path: string, init?: RequestInit) => {
      const r = await fetch(`/api/backend/patient/${path}`, {
        ...init,
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
      if (r.status === 401) router.replace("/patient/login");
      return apiJson(
        r,
        si
          ? "පෝලිම් තොරතුරු දැනට ලබාගත නොහැක. නැවත උත්සාහ කරන්න."
          : "Queue information is temporarily unavailable. Please retry.",
      );
    },
    [router, si],
  );
  const load = useCallback(async () => {
    try {
      setTickets(await request("tickets"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [request]);
  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 15000);
    return () => clearInterval(timer);
  }, [load]);
  useEffect(() => {
    let cancelled = false;
    setQueue("");
    setQueues([]);
    if (center)
      void request(`queues/${center}`)
        .then((data) => {
          if (!cancelled) setQueues(data);
        })
        .catch((e) => {
          if (!cancelled) setError(e.message);
        });
    return () => {
      cancelled = true;
    };
  }, [center, request]);
  async function take() {
    setBusy(true);
    setError("");
    pending.current ??= crypto.randomUUID();
    try {
      await request(`queues/${queue}/tickets`, {
        method: "POST",
        headers: { "Idempotency-Key": pending.current },
      });
      pending.current = null;
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const latest = tickets.filter(
    (t, i) => tickets.findIndex((x) => x.visit_id === t.visit_id) === i,
  );
  const active = tickets.filter(
    (t) => t.is_today && !["COMPLETED", "CANCELLED"].includes(t.status),
  );
  return (
    <section className="care-queue" id="my-queue">
      <div className="care-section-heading">
        <div>
          <span className="care-kicker">
            {si ? "ඔබේ රෝහල් ගමන" : "YOUR VISIT, STEP BY STEP"}
          </span>
          <h2>{si ? "මගේ පෝලිම" : "My queue"}</h2>
        </div>
        <button
          className="care-icon-button"
          aria-label={si ? "පෝලිම යාවත්කාලීන කරන්න" : "Refresh my queue"}
          onClick={() => void load()}
        >
          <RefreshCw size={18} />
        </button>
      </div>
      <ol className="care-steps">
        <li>
          <span>01</span>
          {si ? "ලියාපදිංචිය" : "Registration"}
        </li>
        <li>
          <span>02</span>
          {si ? "වෛද්‍ය හමුව" : "Consultation"}
        </li>
        <li>
          <span>03</span>
          {si ? "ඊළඟ සේවාව" : "Onward care"}
        </li>
      </ol>
      {error && (
        <p role="alert" className="care-inline-error">
          {error}
        </p>
      )}
      {loading && (
        <p role="status">
          {si ? "ටිකට් පූරණය වෙමින්..." : "Loading your tickets..."}
        </p>
      )}
      {active.map((t) => (
        <article
          key={t.id}
          className={`care-ticket ${["CALLED", "RECALLED"].includes(t.status) ? "called" : ""}`}
        >
          <div className="care-ticket-number">
            <Ticket size={24} />
            <small>{si ? "ඔබේ අංකය" : "YOUR NUMBER"}</small>
            <strong>{t.label}</strong>
            <span>{labels[t.status]?.[si ? 1 : 0] || t.status}</span>
          </div>
          <div className="care-ticket-info">
            <span className="care-kicker">{t.stage.replaceAll("_", " ")}</span>
            <h3>{t.queue}</h3>
            <p>
              <MapPin size={17} />
              {t.room}
            </p>
            {t.status === "WAITING" && (
              <p>
                <Users size={17} />
                {t.ahead} {si ? "දෙනෙක් ඔබට ඉදිරියෙන්" : "people ahead of you"}
              </p>
            )}
            <div className="care-now-serving">
              <span>{si ? "දැන් කැඳවන අංක" : "Now serving"}</span>
              <strong>
                {t.now_serving.length ? t.now_serving.join(" · ") : "—"}
              </strong>
            </div>
            {["CALLED", "RECALLED"].includes(t.status) && (
              <p className="care-call-message" role="status">
                {si
                  ? "කරුණාකර පෙන්වා ඇති කාමරයට / කවුන්ටරයට යන්න."
                  : "Please proceed to the room or counter shown above."}
              </p>
            )}
          </div>
        </article>
      ))}
      {!loading && !active.length && (
        <div className="care-queue-empty">
          <Ticket size={30} />
          <div>
            <h3>{si ? "ඔබේ වාරය, සරලව" : "Your turn, made simple."}</h3>
            <p>
              {si
                ? "මධ්‍යස්ථානයක් තෝරා ලියාපදිංචි ටිකට් එකක් ලබාගන්න. සේවකයින් ඔබව ඊළඟ කාමරයට යොමු කරනු ඇත."
                : "Choose a center and take a registration ticket. The care team will route you to your next room."}
            </p>
          </div>
        </div>
      )}
      <div className="care-ticket-actions">
        {!center ? (
          <a href="#book-care" className="button secondary">
            {si ? "මධ්‍යස්ථානය තෝරන්න" : "Choose a center"}
            <ArrowUpRight size={16} />
          </a>
        ) : !enrolled ? (
          <p>
            {si
              ? "ටිකට් ලබාගැනීමට පහත රෝගී පැතිකඩ සාදන්න."
              : "Create your patient profile below to take a ticket."}
          </p>
        ) : queues.length ? (
          <>
            <label htmlFor="patient-registration-queue">
              {si ? "ලියාපදිංචි කවුන්ටරය" : "Registration counter"}
            </label>
            <select
              id="patient-registration-queue"
              value={queue}
              onChange={(e) => {
                setQueue(e.target.value);
                pending.current = null;
              }}
            >
              <option value="">
                {si ? "කවුන්ටරය තෝරන්න" : "Choose counter"}
              </option>
              {queues.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name}
                </option>
              ))}
            </select>
            <button
              className="button primary"
              disabled={!queue || busy || active.length > 0}
              onClick={() => void take()}
            >
              {si ? "ලියාපදිංචි ටිකට් ගන්න" : "Take registration ticket"}
              <ArrowUpRight size={16} />
            </button>
          </>
        ) : (
          <p>
            {si
              ? "මෙම මධ්‍යස්ථානයේ ලියාපදිංචි පෝලිම තවම සකසා නැත."
              : "This center has no registration queue configured yet."}
          </p>
        )}
      </div>
      {!!tickets.length && (
        <details className="care-ticket-history">
          <summary>{si ? "මගේ ටිකට් ඉතිහාසය" : "My ticket history"}</summary>
          {tickets.map((t) => (
            <div key={t.id}>
              <span>
                #{t.label} · {t.queue}
              </span>
              <span>
                {t.business_date} · {labels[t.status]?.[si ? 1 : 0] || t.status}
              </span>
            </div>
          ))}
          {latest.some((t) => t.status === "COMPLETED" && t.is_today) && (
            <p>
              <CheckCircle2 size={16} />
              {si
                ? "මෙම සේවාව අවසන්. තවත් සේවාවක් අවශ්‍ය නම් කාර්ය මණ්ඩලය ඊළඟ ටිකට් නිකුත් කරයි."
                : "This station is complete. Staff will issue your next ticket if onward care is needed."}
            </p>
          )}
        </details>
      )}
    </section>
  );
}
