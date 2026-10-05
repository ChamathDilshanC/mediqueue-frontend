"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "./providers";
import { useRouter } from "next/navigation";
type Row = Record<string, unknown>;
const actions: Record<string, string[]> = {
  WAITING: ["skip", "cancel"],
  CALLED: ["start", "complete", "recall", "skip", "cancel"],
  RECALLED: ["start", "complete", "recall", "skip", "cancel"],
  NO_SHOW: ["recall", "cancel"],
  IN_SERVICE: ["complete"],
};
const appointmentStates: Record<string, string[]> = {
  BOOKED: ["CHECKED_IN", "CANCELLED", "NO_SHOW"],
  CHECKED_IN: ["COMPLETED"],
};
export function WorkflowPanel({
  kind,
  role,
}: {
  kind: "queues" | "appointments";
  role: string;
}) {
  const { language } = useLanguage();
  const si = language === "si";
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [queue, setQueue] = useState("");
  const [tokens, setTokens] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [nextQueue, setNextQueue] = useState("");
  const pending = useRef<{ signature: string; key: string } | null>(null);
  const request = useCallback(
    async (path: string, init?: RequestInit) => {
      const response = await fetch(`/api/backend/${path}`, {
        ...init,
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
      if (response.status === 401) router.replace("/login");
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to complete request",
        );
      return data;
    },
    [router],
  );
  const load = useCallback(async () => {
    const list = await request(`${kind}?limit=200`);
    setRows(list);
    if (kind === "queues" && queue) {
      const snapshot = await request(`queues/${queue}/snapshot`);
      if (!Array.isArray(snapshot.tokens))
        throw new Error("Unable to load queue snapshot");
      setTokens(snapshot.tokens);
    }
  }, [kind, queue, request]);
  useEffect(() => {
    void load().catch((e) => setError(e.message));
    const timer = window.setInterval(
      () => void load().catch((e) => setError(e.message)),
      15000,
    );
    return () => window.clearInterval(timer);
  }, [load]);
  async function command(path: string, body: unknown = {}, method = "POST") {
    setBusy(true);
    setError("");
    setNotice("");
    const signature = JSON.stringify([path, body]);
    if (pending.current?.signature !== signature)
      pending.current = { signature, key: crypto.randomUUID() };
    try {
      const result = await request(path, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": pending.current.key,
        },
        body: JSON.stringify(body),
      });
      pending.current = null;
      await load();
      setNotice(
        `${si ? "සාර්ථකයි" : "Updated"}${result.label ? ` · ${result.label}` : ""}`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const selectedQueue = rows.find((q) => q.id === queue);
  const operate =
    ["admin", "staff", "doctor"].includes(role) ||
    (role === "reception" && selectedQueue?.service_type === "REGISTRATION");
  return (
    <section className="account-card mb-6">
      <h2>
        {kind === "queues"
          ? si
            ? "සජීවී පෝලිම් මෙහෙයුම්"
            : "Live queue operations"
          : si
            ? "හමුවීම් තත්ත්වය"
            : "Appointment workflow"}
      </h2>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {kind === "queues" ? (
        <>
          <label htmlFor="live-queue">{si ? "පෝලිම" : "Queue"}</label>
          <select
            id="live-queue"
            className="border rounded-xl p-3 bg-transparent"
            value={queue}
            onChange={(e) => {
              setQueue(e.target.value);
              setNextQueue("");
              setTokens([]);
            }}
          >
            <option value="">{si ? "පෝලිම තෝරන්න" : "Choose queue"}</option>
            {rows.map((q) => (
              <option key={String(q.id)} value={String(q.id)}>
                {String(q.name)}
              </option>
            ))}
          </select>
          {queue && (
            <>
              <div className="my-4 flex flex-wrap items-center gap-3">
                <span className="eyebrow-pill">
                  {String(selectedQueue?.service_type || "GENERAL")}
                </span>
                <label htmlFor="next-care-queue">
                  {si ? "ඊළඟ කාමරය / සේවාව" : "Next room / service"}
                </label>
                <select
                  id="next-care-queue"
                  className="border rounded-xl p-3 bg-transparent"
                  value={nextQueue}
                  onChange={(e) => setNextQueue(e.target.value)}
                >
                  <option value="">
                    {si ? "ඊළඟ සේවාව තෝරන්න" : "Choose onward queue"}
                  </option>
                  {rows
                    .filter(
                      (q) =>
                        q.id !== queue && q.service_type !== "REGISTRATION",
                    )
                    .map((q) => (
                      <option key={String(q.id)} value={String(q.id)}>
                        {String(q.name)}
                      </option>
                    ))}
                </select>
              </div>
              {role !== "doctor" && (
                <form
                  className="flex flex-wrap gap-3 my-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const data = new FormData(e.currentTarget);
                    void command(`queues/${queue}/tokens`, {
                      patient_ref: data.get("patient_ref"),
                    });
                  }}
                >
                  <input
                    aria-label={si ? "රෝගී යොමුව" : "Patient reference"}
                    name="patient_ref"
                    required
                    maxLength={200}
                    className="border rounded-xl p-3 bg-transparent"
                    placeholder="Patient reference / රෝගී යොමුව"
                  />
                  <button disabled={busy} className="button primary">
                    {si ? "ඇතුළත් කරන්න" : "Check in"}
                  </button>
                </form>
              )}
              {operate && (
                <button
                  disabled={busy}
                  className="button primary"
                  onClick={() => void command(`queues/${queue}/call-next`)}
                >
                  {si ? "ඊළඟ රෝගියා කැඳවන්න" : "Call next"}
                </button>
              )}
              <div className="patient-list">
                {tokens.length === 0 && (
                  <p>{si ? "අද ටෝකන් නොමැත" : "No tokens today."}</p>
                )}
                {tokens.map((t) => (
                  <article key={String(t.id)}>
                    <strong>
                      #{String(t.label)} · {String(t.status)}
                    </strong>
                    {operate && (
                      <div className="flex flex-wrap gap-2">
                        {(actions[String(t.status)] || []).map((a) => (
                          <button
                            key={a}
                            disabled={busy}
                            className="button secondary"
                            onClick={() =>
                              void command(`tokens/${t.id}/${a}`, {
                                expected_version: t.version,
                              })
                            }
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    )}
                    {String(t.status) === "COMPLETED" &&
                      (operate || role === "reception") && (
                        <button
                          className="button secondary mt-3"
                          disabled={busy || !nextQueue}
                          onClick={() =>
                            void command(`journey/tokens/${t.id}/handoff`, {
                              queue_id: nextQueue,
                            })
                          }
                        >
                          {si
                            ? "ඊළඟ සේවාවේ ටිකට් නිකුත් කරන්න"
                            : "Issue onward ticket"}
                        </button>
                      )}
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="patient-list">
          {rows.length === 0 && (
            <p>{si ? "හමුවීම් නොමැත" : "No appointments."}</p>
          )}
          {rows.map((a) => (
            <article key={String(a.id)}>
              <strong>
                {String(a.id).slice(0, 8)} · {String(a.status)}
              </strong>
              <div className="flex flex-wrap gap-2">
                {["admin", "staff", "reception"].includes(role) &&
                  (appointmentStates[String(a.status)] || []).map((s) => (
                    <button
                      key={s}
                      disabled={busy}
                      className="button secondary"
                      onClick={() =>
                        void command(
                          `appointments/${a.id}`,
                          { status: s },
                          "PATCH",
                        )
                      }
                    >
                      {s.replaceAll("_", " ")}
                    </button>
                  ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
