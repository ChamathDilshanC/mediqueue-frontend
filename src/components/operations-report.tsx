"use client";
import { statusLabel, statusTone } from "@/lib/status-tone";
import { useEffect, useState } from "react";
import { useLanguage } from "./providers";
import { z } from "zod";
export const reportSchema = z.object({
  totals: z.record(z.string(), z.number()),
  appointment_statuses: z.record(z.string(), z.number()),
  billing: z.record(z.string(), z.string()).optional(),
  low_stock: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        quantity: z.number(),
        reorder_level: z.number(),
      }),
    )
    .optional(),
});
type Report = {
  totals: Record<string, number>;
  appointment_statuses: Record<string, number>;
  billing?: Record<string, string>;
  low_stock?: {
    id: string;
    name: string;
    quantity: number;
    reorder_level: number;
  }[];
};
export function OperationsReport() {
  const { language } = useLanguage();
  const si = language === "si";
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/backend/reports/overview", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Unable to load report");
        const value = reportSchema.safeParse(await r.json());
        if (!value.success) throw new Error("Unable to load report");
        setData(value.data);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [attempt]);
  const labels: Record<string, string> = {
    patients: "රෝගීන්",
    doctors: "වෛද්‍යවරු",
    departments: "අංශ",
    queues: "පෝලිම්",
    appointments: "හමුවීම්",
    beds: "ඇඳන්",
    active_admissions: "සක්‍රිය ඇතුළත් කිරීම්",
    available_beds: "ලබාගත හැකි ඇඳන්",
    charged: "මුළු බිල්පත්",
    collected: "ලැබුණු මුදල",
    outstanding: "හිඟ මුදල",
  };
  if (error)
    return (
      <div role="alert">
        {error}
        <button
          className="button secondary"
          onClick={() => {
            setError("");
            setAttempt((a) => a + 1);
          }}
        >
          {si ? "නැවත උත්සාහ කරන්න" : "Retry"}
        </button>
      </div>
    );
  if (!data)
    return (
      <div
        className="patient-grid"
        role="status"
        aria-label={si ? "වාර්තාව පූරණය වෙමින්" : "Loading report"}
      >
        {[0, 1].map((i) => (
          <section key={i} className="account-card flex flex-col gap-3">
            <span className="mq-skeleton block h-6 w-40" />
            {[0, 1, 2, 3].map((j) => (
              <span key={j} className="mq-skeleton block h-9 w-full" />
            ))}
          </section>
        ))}
      </div>
    );
  const statusTotal = Object.values(data.appointment_statuses).reduce(
    (sum, value) => sum + value,
    0,
  );
  return (
    <div className="patient-grid mq-stagger">
      <section className="account-card" aria-labelledby="report-totals">
        <h2 id="report-totals">{si ? "මෙහෙයුම් ගණනය" : "Operations totals"}</h2>
        <dl className="report-values">
          {Object.entries(data.totals).map(([key, value]) => (
            <div key={key}>
              <dt>{si ? labels[key] : statusLabel(key)}</dt>
              <dd className="tabular-nums">{value.toLocaleString()}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="account-card" aria-labelledby="report-statuses">
        <h2 id="report-statuses">{si ? "හමුවීම් තත්ත්ව" : "Appointment statuses"}</h2>
        <dl className="report-values">
          {Object.entries(data.appointment_statuses).map(([key, value]) => (
            <div key={key} className="!grid grid-cols-[1fr_auto] gap-2">
              <dt>
                <span className={`mq-badge ${statusTone(key)}`}>{statusLabel(key)}</span>
              </dt>
              <dd className="tabular-nums">{value.toLocaleString()}</dd>
              <span
                className="mq-meter col-span-2"
                role="img"
                aria-label={`${statusLabel(key)}: ${statusTotal ? Math.round((value / statusTotal) * 100) : 0}%`}
              >
                <span style={{ width: `${statusTotal ? (value / statusTotal) * 100 : 0}%` }} />
              </span>
            </div>
          ))}
        </dl>
        {!Object.keys(data.appointment_statuses).length && (
          <p>{si ? "හමුවීම් නොමැත" : "No appointments yet."}</p>
        )}
      </section>
      {data.billing && (
        <section className="account-card">
          <h2>{si ? "මූල්‍ය සාරාංශය" : "Billing summary"} · LKR</h2>
          <dl className="report-values">
            {Object.entries(data.billing)
              .filter(([k]) => k !== "currency")
              .map(([k, v]) => (
                <div key={k}>
                  <dt>{si ? labels[k] : k}</dt>
                  <dd>
                    {Number(v).toLocaleString("en-LK", {
                      minimumFractionDigits: 2,
                    })}
                  </dd>
                </div>
              ))}
          </dl>
        </section>
      )}
      {data.low_stock && (
        <section className="account-card">
          <h2>{si ? "අඩු තොග" : "Stock requiring reorder"}</h2>
          {data.low_stock.length === 0 ? (
            <p>{si ? "අඩු තොග නොමැත" : "No low stock items."}</p>
          ) : (
            <dl className="report-values">
              {data.low_stock.map((r) => (
                <div key={r.id} className="!grid grid-cols-[1fr_auto] gap-2">
                  <dt>{r.name}</dt>
                  <dd className="tabular-nums">
                    {r.quantity} / {r.reorder_level}
                  </dd>
                  <span
                    className="mq-meter warning col-span-2"
                    role="img"
                    aria-label={`${r.name}: ${r.quantity} ${si ? "ඇත, අවම" : "in stock, reorder level"} ${r.reorder_level}`}
                  >
                    <span
                      style={{
                        width: `${Math.min(100, r.reorder_level ? (r.quantity / r.reorder_level) * 100 : 0)}%`,
                      }}
                    />
                  </span>
                </div>
              ))}
            </dl>
          )}
        </section>
      )}
    </div>
  );
}
