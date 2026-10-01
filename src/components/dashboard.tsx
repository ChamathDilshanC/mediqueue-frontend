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

function displayValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") return <span className="muted">—</span>;
  if (typeof value === "boolean") {
    return (
      <span className={`status-badge ${value ? 'verified' : 'rejected'}`} style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 500, background: value ? 'var(--soft)' : '#fef2f2', color: value ? 'var(--green-dark)' : '#991b1b', border: `1px solid ${value ? '#cfe6a8' : '#fecaca'}` }}>
        {value ? "Active" : "Inactive"}
      </span>
    );
  }
  if (typeof value === "object") return <span className="latin text-xs">{JSON.stringify(value)}</span>;
  const str = String(value);
  if (str.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    return <span className="latin text-xs text-muted-foreground">{new Date(str).toLocaleString()}</span>;
  }
  if (key === 'status') {
    return (
      <span className="status-badge" style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 500, textTransform: 'capitalize', background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
        {str.replace(/_/g, ' ')}
      </span>
    );
  }
  return <span style={{ fontWeight: key.includes('name') || key.includes('title') ? 500 : 400 }}>{str}</span>;
}

function formatColumnName(key: string) {
  return key.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
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

  const loadRows = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/backend/${resource}?limit=${pageSize}&offset=${page * pageSize}`,
          { cache: "no-store", signal },
        );
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        if (response.status === 403) {
          setError(t.accessDenied);
          setRows([]);
          return;
        }
        if (!response.ok) throw new Error("Unable to load records");
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid records response");
        setRows(data as Row[]);
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError")
          return;
        setError(t.unavailable);
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [page, resource, router, t.accessDenied, t.unavailable],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadRows(controller.signal);
    return () => controller.abort();
  }, [loadRows]);

  useEffect(() => {
    setPage(0);
    setQuery("");
  }, [resource]);

  const columns = useMemo(() => {
    const keys = new Set<string>();
    rows.forEach((row) => Object.keys(row).forEach((key) => keys.add(key)));
    const allKeys = Array.from(keys);
    const visibleKeys = allKeys.filter((key) => key !== "id" && !key.endsWith("_id"));
    return visibleKeys.length > 0 ? visibleKeys : allKeys;
  }, [rows]);
  const filteredRows = rows.filter((row) =>
    query
      ? Object.entries(row).some(([key, value]) =>
          String(value).toLowerCase().includes(query.toLowerCase()),
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
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 mt-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#e2ead8] rounded-full text-xs font-medium text-[#61714d] mb-4 shadow-sm">
                <ShieldCheck size={14} className="text-[#76aa32]" />
                {t.account}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-2">Operations dashboard</h1>
              <p className="text-gray-500 text-sm md:text-base">Manage every MediQueue backend resource from one place.</p>
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl text-sm transition-all shadow-sm"
              onClick={() => void loadRows()}
            >
              <RefreshCw size={16} className="text-gray-500" />
              Refresh data
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" aria-label="Workspace summary">
            <div className="flex flex-col p-5 bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">Total resources</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Search size={16} /></div>
              </div>
              <strong className="text-3xl font-semibold text-gray-900 mb-1">{resources.length}</strong>
              <small className="text-xs text-gray-400 font-medium">Connected endpoints</small>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-full opacity-50 pointer-events-none"></div>
            </div>
            <div className="flex flex-col p-5 bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">Records this page</span>
                <div className="p-2 bg-green-50 text-green-600 rounded-lg"><RefreshCw size={16} /></div>
              </div>
              <strong className="text-3xl font-semibold text-gray-900 mb-1">{rows.length}</strong>
              <small className="text-xs text-gray-400 font-medium">Live API response</small>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-green-50 to-transparent rounded-full opacity-50 pointer-events-none"></div>
            </div>
            <div className="flex flex-col p-5 bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">System status</span>
                <div className={`p-2 rounded-lg ${error ? 'bg-red-50 text-red-600' : 'bg-[#f4f7f0] text-[#76aa32]'}`}><ShieldCheck size={16} /></div>
              </div>
              <strong className={`text-xl font-semibold mb-1 ${error ? "text-red-600" : "text-gray-900"}`}>
                {loading ? "Checking…" : error ? "Unavailable" : "Connected"}
              </strong>
              <small className="text-xs text-gray-400 font-medium">
                {error ? "Could not load records" : "Selected resource"}
              </small>
              <div className={`absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br rounded-full opacity-50 pointer-events-none ${error ? 'from-red-50' : 'from-[#f4f7f0]'}`}></div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <aside className="md:w-64 flex-shrink-0 flex flex-col gap-1" aria-label="Resources">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 px-3 hidden md:block">Database Resources</p>
              
              <div className="md:hidden mb-4">
                <MorphSelect
                  value={resource}
                  onValueChange={(value) => selectResource(value as ResourceKey)}
                  className="w-full"
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
              </div>

              <div className="hidden md:flex flex-col gap-1">
                {resources.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => selectResource(key)}
                    className={`text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      resource === key
                        ? "bg-[#f4f7f0] text-[#76aa32] shadow-sm ring-1 ring-inset ring-[#76aa32]/20"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </aside>
            <section className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-50 bg-[#fafcfa]">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#76aa32] mb-1">Live API records</p>
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">{rows.length} records</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search records"
                      className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#76aa32]/20 focus:border-[#76aa32] w-64 transition-all"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#76aa32] hover:bg-[#68982a] text-white font-medium rounded-xl text-sm transition-colors shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    New {title.endsWith('s') ? title.slice(0, -1) : title}
                  </button>
                </div>
              </div>
              <div className="p-6 bg-gray-50/30 flex-1">
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
                <div className="flex flex-col gap-3 mt-4">
                  {loading ? (
                    <div className="p-12 text-center text-gray-400">Loading records…</div>
                  ) : filteredRows.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">No records found.</div>
                  ) : (
                    filteredRows.map((row, index) => {
                      // Find best columns for modern display
                      const titleCol = columns.find(c => c.toLowerCase().includes('name') || c.toLowerCase().includes('title')) || columns[0];
                      const subtitleCol = columns.find(c => c !== titleCol && (c.toLowerCase().includes('email') || c.toLowerCase().includes('phone') || typeof row[c] === 'string')) || columns[1];
                      const badgeCols = columns.filter(c => typeof row[c] === 'boolean' || c === 'status' || c === 'role');
                      
                      const title = row[titleCol] ? String(row[titleCol]) : "Untitled";
                      const subtitle = subtitleCol && row[subtitleCol] ? String(row[subtitleCol]) : "";
                      const initials = title.substring(0, 2).toUpperCase();
                      
                      return (
                        <div key={String(row.id ?? index)} className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-[#f4f7f0] to-[#e6eed9] flex items-center justify-center text-[#5c7a31] font-semibold text-sm border border-[#d6e3c5]">
                              {initials}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 text-[15px] leading-tight">{title}</h3>
                                {badgeCols.map(c => (
                                  <span key={c} className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[10px] uppercase font-bold rounded-full border border-gray-100">
                                    {String(row[c])}
                                  </span>
                                ))}
                              </div>
                              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {/* Render other important columns if any */}
                            <div className="hidden md:flex gap-4 mr-4">
                              {columns.filter(c => c !== titleCol && c !== subtitleCol && !badgeCols.includes(c)).slice(0, 2).map(c => (
                                <div key={c} className="flex flex-col text-right">
                                  <span className="text-[10px] uppercase text-gray-400 font-semibold">{formatColumnName(c)}</span>
                                  <span className="text-[13px] text-gray-700 font-medium">{String(row[c] ?? "—")}</span>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Edit record">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                               </button>
                               <button className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Delete record">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                               </button>
                               <button className="cursor-grab p-2 text-gray-300 hover:text-gray-500 rounded-lg transition-colors" title="Drag to reorder">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
                               </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
              </div>
              <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-[#fafcfa] text-sm text-gray-500">
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
