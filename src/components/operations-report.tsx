"use client";
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
      <p role="status">
        {si ? "වාර්තාව පූරණය වෙමින්..." : "Loading report..."}
      </p>
    );
  return (
    <div className="patient-grid">
      <section className="account-card">
        <h2>{si ? "මෙහෙයුම් ගණනය" : "Operations totals"}</h2>
        <dl className="report-values">
          {Object.entries(data.totals).map(([key, value]) => (
            <div key={key}>
              <dt>{si ? labels[key] : key.replaceAll("_", " ")}</dt>
              <dd>{value.toLocaleString()}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="account-card">
        <h2>{si ? "හමුවීම් තත්ත්ව" : "Appointment statuses"}</h2>
        <dl className="report-values">
          {Object.entries(data.appointment_statuses).map(([key, value]) => (
            <div key={key}>
              <dt>{key.replaceAll("_", " ")}</dt>
              <dd>{value}</dd>
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
                <div key={r.id}>
                  <dt>{r.name}</dt>
                  <dd>
                    {r.quantity} / {r.reorder_level}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      )}
    </div>
  );
}
