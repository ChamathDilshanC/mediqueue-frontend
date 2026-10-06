"use client";

import { useCallback, useEffect, useState } from "react";
import { statusLabel, statusTone } from "@/lib/status-tone";
import { useRouter } from "next/navigation";
import { Check, X, Search, ShieldCheck } from "lucide-react";
import { useLanguage } from "./providers";
import { SiteHeader } from "./site-header";
import { gooeyToast } from "goey-toast";
import { Error403 } from "./error-403";

type Application = {
  id: string;
  applicant_id: string;
  organization_type: string;
  official_name: string;
  address: string;
  phone: string;
  official_email: string;
  registration_number: string;
  license_number: string;
  supporting_document_url: string;
  website_url: string;
  administrator_name: string;
  administrator_role: string;
  status: "pending_review" | "verified" | "rejected";
};

export function AdminDashboard() {
  const { t } = useLanguage();
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isForbidden, setIsForbidden] = useState(false);
  const [query, setQuery] = useState("");

  const loadApps = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      setIsForbidden(false);
      try {
        const response = await fetch(`/api/backend/admin/hospital-applications`, {
          cache: "no-store",
          signal,
        });
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        if (response.status === 403) {
          setIsForbidden(true);
          setApps([]);
          return;
        }
        if (!response.ok) throw new Error("Unable to load records");
        const data = await response.json();
        setApps(data);
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(t.unavailable || "Service unavailable");
        setApps([]);
      } finally {
        setLoading(false);
      }
    },
    [router, t]
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadApps(controller.signal);
    return () => controller.abort();
  }, [loadApps]);

  async function updateStatus(id: string, status: "verified" | "rejected") {
    try {
      const res = await fetch(`/api/backend/admin/hospital-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      gooeyToast.success(status === "verified" ? "Application Approved" : "Application Rejected");
      void loadApps();
    } catch {
      gooeyToast.error("Failed to update status");
    }
  }

  const filteredApps = apps.filter((app) =>
    query
      ? Object.values(app).some((val) =>
          String(val).toLowerCase().includes(query.toLowerCase())
        )
      : true
  );

  if (isForbidden) return <Error403 />;

  return (
    <>
      <SiteHeader simple />
      <main className="dashboard-page dashboard-shell container">
        <div className="dashboard-content">
          <div className="dashboard-topbar">
            <div>
              <span className="eyebrow-pill">
                <ShieldCheck size={14} aria-hidden="true" />
                System Admin
              </span>
              <h1>Application Management</h1>
              <p>Review and approve hospital/medical center registrations.</p>
            </div>
          </div>

          <div className="dashboard-layout" style={{ display: "block" }}>
            <section className="resource-panel" style={{ width: "100%" }}>
              <div className="resource-heading">
                <div>
                  <p className="eyebrow">Organization Applications</p>
                  <h2>Pending Reviews</h2>
                </div>
                <label className="table-search">
                  <Search size={16} aria-hidden />
                  <span className="sr-only">Search</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search applications..."
                  />
                </label>
              </div>

              {error ? (
                <div className="account-error" role="alert">
                  <p>{error}</p>
                </div>
              ) : (
                <div className="data-table-wrap mq-table-wrap">
                  <table className="data-table mq-table mq-responsive">
                    <caption>Organization applications</caption>
                    <thead>
                      <tr>
                        <th scope="col">Organization</th>
                        <th scope="col">Type</th>
                        <th scope="col">Email / Phone</th>
                        <th scope="col">Administrator</th>
                        <th scope="col">Status</th>
                        <th scope="col" className="mq-num">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6}>
                            <span className="mq-skeleton block h-10 w-full" role="status" aria-label="Loading applications" />
                          </td>
                        </tr>
                      ) : filteredApps.length === 0 ? (
                        <tr>
                          <td colSpan={6}>No applications found.</td>
                        </tr>
                      ) : (
                        filteredApps.map((app) => (
                          <tr key={app.id}>
                            <td data-label="Organization">
                              <span className="flex flex-col">
                                <strong>{app.official_name}</strong>
                                <small className="font-normal text-[var(--mq-subtle)]">{app.registration_number}</small>
                              </span>
                            </td>
                            <td data-label="Type">
                              <span className="mq-badge accent">
                                {app.organization_type === "medical_center" ? "Medical center" : "Hospital"}
                              </span>
                            </td>
                            <td data-label="Email / Phone">
                              <span className="flex flex-col">
                                <a className="mq-link" href={`mailto:${app.official_email}`}>{app.official_email}</a>
                                <small>{app.phone}</small>
                              </span>
                            </td>
                            <td data-label="Administrator">
                              <span className="flex flex-col">
                                <span className="text-[var(--mq-text)]">{app.administrator_name}</span>
                                <small>{app.administrator_role}</small>
                              </span>
                            </td>
                            <td data-label="Status">
                              <span className={`mq-badge ${statusTone(app.status)}`}>
                                {app.status === "pending_review" ? "Pending review" : statusLabel(app.status)}
                              </span>
                            </td>
                            <td data-label="Actions" className="mq-num">
                              {app.status === "pending_review" && (
                                <div className="inline-flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => updateStatus(app.id, "verified")}
                                    className="button primary"
                                    aria-label={`Approve ${app.official_name}`}
                                    title="Approve"
                                  >
                                    <Check size={16} aria-hidden="true" />
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateStatus(app.id, "rejected")}
                                    className="button secondary"
                                    aria-label={`Reject ${app.official_name}`}
                                    title="Reject"
                                  >
                                    <X size={16} aria-hidden="true" />
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
