"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "./providers";
import { SiteHeader } from "./site-header";
import MorphSelect, {
  MorphSelectContent,
  MorphSelectItem,
  MorphSelectTrigger,
  MorphSelectValue,
} from "./ui/select-morph";

import { resources, type ResourceKey } from "@/lib/dashboard-resources";

type Row = Record<string, unknown>;

const pageSize = 10;

function displayValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function Dashboard() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected =
    (searchParams.get("resource") as ResourceKey | null) ?? "hospitals";
  const resource = resources.some(({ key }) => key === selected)
    ? selected
    : "hospitals";
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/backend/${resource}?limit=${pageSize}&offset=${page * pageSize}`,
        { cache: "no-store" },
      );
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (!response.ok) throw new Error("Unable to load records");
      const data: unknown = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid records response");
      setRows(data as Row[]);
    } catch {
      setError(t.unavailable);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, resource, router, t.unavailable]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  useEffect(() => {
    setPage(0);
    setQuery("");
  }, [resource]);

  const columns = useMemo(() => {
    const keys = new Set<string>();
    rows.forEach((row) => Object.keys(row).forEach((key) => keys.add(key)));
    return Array.from(keys).slice(0, 6);
  }, [rows]);
  const filteredRows = rows.filter((row) =>
    query
      ? Object.values(row).some((value) =>
          displayValue(value).toLowerCase().includes(query.toLowerCase()),
        )
      : true,
  );
  const title =
    resources.find(({ key }) => key === resource)?.label ?? "Hospitals";

  function selectResource(key: ResourceKey) {
    router.push(`/dashboard?resource=${key}`);
  }

  return (
    <>
      <SiteHeader simple />
      <main className="dashboard-page dashboard-shell container">
        <div className="dashboard-content">
          <div className="dashboard-searchbar">
            <Search size={18} aria-hidden />
            <input
              aria-label="Search workspace"
              placeholder="Search this page"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="dashboard-topbar">
            <div>
              <span className="eyebrow-pill">
                <ShieldCheck size={14} />
                {t.account}
              </span>
              <h1>Operations dashboard</h1>
              <p>Manage every MediQueue backend resource from one place.</p>
            </div>
            <button
              className="button secondary"
              onClick={() => void loadRows()}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          <div className="dashboard-stats" aria-label="Workspace summary">
            <div>
              <span>Total resources</span>
              <strong>{resources.length}</strong>
              <small>Connected endpoints</small>
            </div>
            <div>
              <span>Records this page</span>
              <strong>{rows.length}</strong>
              <small>Live API response</small>
            </div>
            <div>
              <span>System status</span>
              <strong className={error ? "" : "status-good"}>
                {loading ? "Checking…" : error ? "Unavailable" : "Connected"}
              </strong>
              <small>
                {error ? "Could not load records" : "Selected resource"}
              </small>
            </div>
          </div>

          <div className="dashboard-layout">
            <aside className="resource-nav" aria-label="Resources">
              <p className="eyebrow">Resources</p>
              <MorphSelect
                value={resource}
                onValueChange={(value) => selectResource(value as ResourceKey)}
                className="resource-select"
              >
                <MorphSelectTrigger>
                  <MorphSelectValue placeholder="Select resource" />
                </MorphSelectTrigger>
                <MorphSelectContent>
                  {resources.map(({ key, label }) => (
                    <MorphSelectItem key={key} value={key}>
                      {label}
                    </MorphSelectItem>
                  ))}
                </MorphSelectContent>
              </MorphSelect>
            </aside>
            <section className="resource-panel">
              <div className="resource-heading">
                <div>
                  <p className="eyebrow">Live API records</p>
                  <h2>{title}</h2>
                </div>
                <label className="table-search">
                  <Search size={16} aria-hidden />
                  <span className="sr-only">Search {title}</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search this page"
                  />
                </label>
              </div>
              {error ? (
                <div className="account-error" role="alert">
                  <p>{error}</p>
                  <button
                    className="button primary"
                    onClick={() => void loadRows()}
                  >
                    {t.retry}
                  </button>
                </div>
              ) : (
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {columns.map((column) => (
                          <th key={column}>{column.replaceAll("_", " ")}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={Math.max(columns.length, 1)}>
                            Loading records…
                          </td>
                        </tr>
                      ) : filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={Math.max(columns.length, 1)}>
                            No records found.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row, index) => (
                          <tr key={String(row.id ?? index)}>
                            {columns.map((column) => (
                              <td key={column}>{displayValue(row[column])}</td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="table-footer">
                <span>
                  Page {page + 1} · {rows.length} records loaded
                </span>
                <div className="pagination">
                  <button
                    aria-label="Previous page"
                    disabled={page === 0 || loading}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <strong>{page + 1}</strong>
                  <button
                    aria-label="Next page"
                    disabled={rows.length < pageSize || loading}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
