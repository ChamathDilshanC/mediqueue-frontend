"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  ShieldCheck,
  Activity,
  Stethoscope,
  CalendarClock,
  ClipboardList,
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
  const selected = searchParams.get("resource");
  const resource = (selected && resources.some(({ key }) => key === selected)
    ? selected
    : selected === null ? "overview" : "hospitals") as ResourceKey | "overview";
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const loadRows = useCallback(
    async (signal?: AbortSignal) => {
      if (resource === 'overview') {
        setRows([]);
        setLoading(false);
        return;
      }
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

  return (
    <>
      <SiteHeader simple />
      <main className="flex-1 w-full bg-white min-h-screen pb-12">
        <div className="px-6 md:px-10 lg:px-12 pt-6">
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

          {resource === 'overview' ? (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col p-5 bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-500">Waiting Now</span>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Activity size={16} /></div>
                  </div>
                  <strong className="text-3xl font-semibold text-gray-900 mb-1">18</strong>
                  <small className="text-xs text-green-600 font-medium">+3 last hour</small>
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-full opacity-50 pointer-events-none"></div>
                </div>
                <div className="flex flex-col p-5 bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-500">Doctors Active</span>
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Stethoscope size={16} /></div>
                  </div>
                  <strong className="text-3xl font-semibold text-gray-900 mb-1">7</strong>
                  <small className="text-xs text-gray-400 font-medium">of 9 scheduled</small>
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-green-50 to-transparent rounded-full opacity-50 pointer-events-none"></div>
                </div>
                <div className="flex flex-col p-5 bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-500">Avg Wait Time</span>
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><CalendarClock size={16} /></div>
                  </div>
                  <strong className="text-3xl font-semibold text-gray-900 mb-1">14m</strong>
                  <small className="text-xs text-gray-400 font-medium">Across all branches</small>
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-amber-50 to-transparent rounded-full opacity-50 pointer-events-none"></div>
                </div>
                <div className="flex flex-col p-5 bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-500">Visits Today</span>
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><ClipboardList size={16} /></div>
                  </div>
                  <strong className="text-3xl font-semibold text-gray-900 mb-1">126</strong>
                  <small className="text-xs text-gray-400 font-medium">Completed</small>
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-purple-50 to-transparent rounded-full opacity-50 pointer-events-none"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-gray-50 bg-[#fafcfa]">
                    <h3 className="font-bold text-gray-900">Live Queue Status</h3>
                  </div>
                  <div className="p-0">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                        <tr>
                          <th className="px-5 py-3 font-medium">Patient</th>
                          <th className="px-5 py-3 font-medium">Status</th>
                          <th className="px-5 py-3 font-medium text-right">Wait</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        <tr className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-gray-900">Patient A</td>
                          <td className="px-5 py-3"><span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Waiting</span></td>
                          <td className="px-5 py-3 text-right text-gray-500">08m</td>
                        </tr>
                        <tr className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-gray-900">Patient B</td>
                          <td className="px-5 py-3"><span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Called</span></td>
                          <td className="px-5 py-3 text-right text-gray-500">03m</td>
                        </tr>
                        <tr className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-gray-900">Patient C</td>
                          <td className="px-5 py-3"><span className="px-2 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Serving</span></td>
                          <td className="px-5 py-3 text-right text-gray-500">11m</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-gray-50 bg-[#fafcfa]">
                    <h3 className="font-bold text-gray-900">Doctor Status</h3>
                  </div>
                  <div className="p-0">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                        <tr>
                          <th className="px-5 py-3 font-medium">Doctor</th>
                          <th className="px-5 py-3 font-medium text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        <tr className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-gray-900 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">DS</div>
                            Dr. Silva
                          </td>
                          <td className="px-5 py-3 text-right"><span className="px-2 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Active</span></td>
                        </tr>
                        <tr className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-gray-900 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">DP</div>
                            Dr. Perera
                          </td>
                          <td className="px-5 py-3 text-right"><span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Busy</span></td>
                        </tr>
                        <tr className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-gray-900 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs">DF</div>
                            Dr. Fernando
                          </td>
                          <td className="px-5 py-3 text-right"><span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-bold uppercase tracking-wider">Offline</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <section className="w-full bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="flex flex-col p-6 border-b border-gray-50 bg-[#fafcfa] gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                      <p className="text-sm text-gray-500 mt-1">Manage registered {title.toLowerCase()} in your system.</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#76aa32] hover:bg-[#68982a] text-white font-medium rounded-xl text-sm transition-colors shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      New {title.endsWith('s') ? title.slice(0, -1) : title}
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={`Search ${title.toLowerCase()}...`}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#76aa32]/20 focus:border-[#76aa32] transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <select className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#76aa32]/20">
                        <option>All Status</option>
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                      <button className="px-3 py-2 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors">Clear filters</button>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-x-auto">
                {error ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
                      <ShieldCheck size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load data</h3>
                    <p className="text-gray-500 text-sm mb-6 max-w-md">{error}</p>
                    <button
                      className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl text-sm transition-all shadow-sm"
                      onClick={() => void loadRows()}
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <div className="w-full">
                    {loading ? (
                      <div className="p-12 text-center text-gray-400">Loading records…</div>
                    ) : filteredRows.length === 0 ? (
                      <div className="p-16 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mb-4">
                          <Search size={28} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No {title.toLowerCase()} found</h3>
                        <p className="text-gray-500 text-sm mb-6 max-w-sm">No records match your filters. Try clearing your filters or adding a new record.</p>
                      </div>
                    ) : (
                      <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                          <tr>
                            {columns.slice(0, 5).map(col => (
                              <th key={col} className="px-6 py-4 font-semibold tracking-wider">{formatColumnName(col)}</th>
                            ))}
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredRows.map((row, index) => (
                            <tr key={String(row.id ?? index)} className="hover:bg-[#fcfdfa] transition-colors group cursor-pointer">
                              {columns.slice(0, 5).map((col, colIdx) => (
                                <td key={col} className={`px-6 py-4 ${colIdx === 0 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                                  {displayValue(col, row[col])}
                                </td>
                              ))}
                              <td className="px-6 py-4 text-right">
                                <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Actions">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
                </div>
                <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-[#fafcfa] text-sm text-gray-500">
                  <span>
                    Showing {rows.length === 0 ? 0 : (page * pageSize) + 1}–{Math.min((page + 1) * pageSize, (page * pageSize) + rows.length)} records
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      aria-label="Previous page"
                      disabled={page === 0 || loading}
                      onClick={() => setPage((current) => current - 1)}
                      className="p-2 rounded-lg border border-transparent hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="px-4 font-medium text-gray-900">Page {page + 1}</span>
                    <button
                      aria-label="Next page"
                      disabled={rows.length < pageSize || loading}
                      onClick={() => setPage((current) => current + 1)}
                      className="p-2 rounded-lg border border-transparent hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
