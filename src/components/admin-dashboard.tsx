"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Search, ShieldCheck } from "lucide-react";
import { useLanguage } from "./providers";
import { SiteHeader } from "./site-header";
import { gooeyToast } from "goey-toast";

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
  const [query, setQuery] = useState("");

  const loadApps = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
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
          setError(t.accessDenied || "Access Denied. You must be the system admin.");
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

  return (
    <>
      <SiteHeader simple />
      <main className="dashboard-page dashboard-shell container">
        <div className="dashboard-content">
          <div className="dashboard-topbar">
            <div>
              <span className="eyebrow-pill">
                <ShieldCheck size={14} />
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
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Organization</th>
                        <th>Type</th>
                        <th>Email / Phone</th>
                        <th>Administrator</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6}>Loading applications...</td>
                        </tr>
                      ) : filteredApps.length === 0 ? (
                        <tr>
                          <td colSpan={6}>No applications found.</td>
                        </tr>
                      ) : (
                        filteredApps.map((app) => (
                          <tr key={app.id}>
                            <td>
                              <strong>{app.official_name}</strong>
                              <br />
                              <small>{app.registration_number}</small>
                            </td>
                            <td>{app.organization_type}</td>
                            <td>
                              {app.official_email}
                              <br />
                              <small>{app.phone}</small>
                            </td>
                            <td>
                              {app.administrator_name}
                              <br />
                              <small>{app.administrator_role}</small>
                            </td>
                            <td>
                              <span className={`status-badge ${app.status}`}>
                                {app.status}
                              </span>
                            </td>
                            <td>
                              {app.status === "pending_review" && (
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                  <button
                                    onClick={() => updateStatus(app.id, "verified")}
                                    className="button primary"
                                    style={{ padding: "0.25rem 0.5rem" }}
                                    title="Approve"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    onClick={() => updateStatus(app.id, "rejected")}
                                    className="button secondary"
                                    style={{ padding: "0.25rem 0.5rem" }}
                                    title="Reject"
                                  >
                                    <X size={16} />
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
