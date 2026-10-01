"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useLanguage } from "./providers";
import type { ResourceConfig, FieldDef } from "@/lib/resource-config";

/* ─────────────────── Types ─────────────────── */

type Row = Record<string, unknown>;
type RefCache = Record<string, Row[]>;

const PAGE_SIZE = 20;

/* ─────────────────── Helpers ─────────────────── */

function statusColor(status: string) {
  const s = status.toUpperCase();
  if (["ACTIVE", "BOOKED", "WAITING"].includes(s))
    return "bg-blue-50 text-blue-700 border-blue-200";
  if (["CHECKED_IN", "SERVING", "CALLED"].includes(s))
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (["COMPLETED", "TRUE"].includes(s))
    return "bg-green-50 text-green-700 border-green-200";
  if (["CANCELLED", "NO_SHOW", "FALSE", "INACTIVE", "REJECTED"].includes(s))
    return "bg-red-50 text-red-700 border-red-200";
  return "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700";
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border uppercase tracking-wider ${statusColor(value)}`}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}

function cellValue(
  field: FieldDef,
  value: unknown,
  refCache: RefCache,
  language: string,
): ReactNode {
  if (value === null || value === undefined || value === "")
    return <span className="text-gray-300">—</span>;

  if (field.type === "boolean")
    return <StatusBadge value={value ? "TRUE" : "FALSE"} />;

  if (field.key === "status" || field.key === "role")
    return <StatusBadge value={String(value)} />;

  if (field.type === "uuid-ref" && field.refResource && field.refLabel) {
    const items = refCache[field.refResource] ?? [];
    const match = items.find((r) => r.id === value);
    if (match) {
      const label = match[field.refLabel];
      if (field.refLabel === "starts_at" && typeof label === "string") {
        return (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {new Date(label).toLocaleString()}
          </span>
        );
      }
      return <span className="text-sm text-gray-700 dark:text-gray-300">{String(label)}</span>;
    }
    return (
      <span className="text-gray-400 text-xs font-mono">
        {String(value).slice(0, 8)}…
      </span>
    );
  }

  if (field.type === "datetime" && typeof value === "string") {
    return (
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {new Date(value).toLocaleString()}
      </span>
    );
  }

  if (typeof value === "object")
    return (
      <span className="text-xs text-gray-500 dark:text-gray-400">{JSON.stringify(value)}</span>
    );

  return <span className="text-sm text-gray-900 dark:text-gray-100">{String(value)}</span>;
}

/* ─────────────────── Create / Edit Dialog ─────────────────── */

function FormDialog({
  config,
  language,
  editing,
  refCache,
  onClose,
  onSaved,
}: {
  config: ResourceConfig;
  language: string;
  editing: Row | null; // null = create
  refCache: RefCache;
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const editableFields = config.fields.filter(
    (f) => f.type !== "readonly" && config.inputFields.includes(f.key),
  );

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const f of editableFields) {
      if (editing) {
        initial[f.key] = String(editing[f.key] ?? "");
      } else {
        initial[f.key] = f.type === "number" ? "20" : "";
      }
    }
    setFormData(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    // Build body
    const body: Record<string, unknown> = {};
    for (const f of editableFields) {
      const val = formData[f.key] ?? "";
      if (f.required && !val.trim()) {
        setError(`${language === "si" ? f.si : f.en} is required`);
        setSubmitting(false);
        return;
      }
      if (f.type === "number") body[f.key] = Number(val);
      else if (f.type === "datetime") body[f.key] = val;
      else body[f.key] = val;
    }

    try {
      const url = editing
        ? `/api/backend/${config.endpoint}/${editing.id}`
        : `/api/backend/${config.endpoint}`;
      const resp = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (resp.status === 401) {
        router.replace("/login");
        return;
      }
      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        setError(data?.detail ?? `Error ${resp.status}`);
        setSubmitting(false);
        return;
      }
      onSaved();
    } catch {
      setError("Unable to connect");
    } finally {
      setSubmitting(false);
    }
  };

  const label = (f: FieldDef) => (language === "si" ? f.si : f.en);
  const title = editing
    ? language === "si"
      ? `${config.si.singular} සංස්කරණය`
      : `Edit ${config.en.singular}`
    : language === "si"
      ? `නව ${config.si.singular}`
      : `New ${config.en.singular}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-[#fafcfa] dark:bg-[#1a1a1a]">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {editableFields.map((f) => (
            <label key={f.key} className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {label(f)}
                {f.required && <span className="text-red-500 ml-1">*</span>}
              </span>
              {f.type === "uuid-ref" ? (
                <select
                  value={formData[f.key] ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, [f.key]: e.target.value }))
                  }
                  className="px-3 py-2.5 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#76aa32]/20 focus:border-[#76aa32] transition-all"
                  required={f.required}
                >
                  <option value="">
                    — {language === "si" ? "තෝරන්න" : "Select"} —
                  </option>
                  {(refCache[f.refResource!] ?? []).map((opt) => (
                    <option key={String(opt.id)} value={String(opt.id)}>
                      {f.refLabel === "starts_at"
                        ? new Date(String(opt[f.refLabel!])).toLocaleString()
                        : String(opt[f.refLabel!] ?? opt.id)}
                    </option>
                  ))}
                </select>
              ) : f.type === "select" ? (
                <select
                  value={formData[f.key] ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, [f.key]: e.target.value }))
                  }
                  className="px-3 py-2.5 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#76aa32]/20 focus:border-[#76aa32] transition-all"
                  required={f.required}
                >
                  <option value="">
                    — {language === "si" ? "තෝරන්න" : "Select"} —
                  </option>
                  {(f.options ?? []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {language === "si" ? opt.si : opt.en}
                    </option>
                  ))}
                </select>
              ) : f.type === "datetime" ? (
                <input
                  type="datetime-local"
                  value={
                    formData[f.key]
                      ? formData[f.key].slice(0, 16)
                      : ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      [f.key]: val ? new Date(val).toISOString() : "",
                    }));
                  }}
                  className="px-3 py-2.5 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#76aa32]/20 focus:border-[#76aa32] transition-all"
                  required={f.required}
                />
              ) : f.type === "number" ? (
                <input
                  type="number"
                  value={formData[f.key] ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, [f.key]: e.target.value }))
                  }
                  className="px-3 py-2.5 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#76aa32]/20 focus:border-[#76aa32] transition-all"
                  required={f.required}
                  min={1}
                />
              ) : (
                <input
                  type="text"
                  value={formData[f.key] ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, [f.key]: e.target.value }))
                  }
                  placeholder={f.placeholder ?? ""}
                  maxLength={f.maxLength}
                  className="px-3 py-2.5 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#76aa32]/20 focus:border-[#76aa32] transition-all"
                  required={f.required}
                />
              )}
            </label>
          ))}

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100 font-medium text-sm transition-colors"
            >
              {language === "si" ? "අවලංගු කරන්න" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#76aa32] hover:bg-[#68982a] text-white font-medium rounded-xl text-sm transition-colors shadow-sm disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {editing
                ? language === "si"
                  ? "යාවත්කාලීන කරන්න"
                  : "Update"
                : language === "si"
                  ? "සාදන්න"
                  : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────── Delete Confirm ─────────────────── */

function DeleteConfirm({
  config,
  language,
  row,
  onClose,
  onDeleted,
}: {
  config: ResourceConfig;
  language: string;
  row: Row;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      const resp = await fetch(
        `/api/backend/${config.endpoint}/${row.id}`,
        { method: "DELETE" },
      );
      if (resp.status === 401) {
        router.replace("/login");
        return;
      }
      if (resp.status === 409) {
        setError(
          language === "si"
            ? "මෙම සම්පතට පරාධීන වාර්තා ඇත. මකා දැමිය නොහැක."
            : "This record has dependent records and cannot be deleted.",
        );
        setDeleting(false);
        return;
      }
      if (!resp.ok && resp.status !== 204) {
        const data = await resp.json().catch(() => null);
        setError(data?.detail ?? `Error ${resp.status}`);
        setDeleting(false);
        return;
      }
      onDeleted();
    } catch {
      setError("Unable to connect");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <Trash2 size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            {language === "si" ? "මකා දැමීම තහවුරු කරන්න" : "Confirm Delete"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            {language === "si"
              ? `මෙම ${config.si.singular} ස්ථිරවම මකා දැමේ. මෙය ආපසු හැරවිය නොහැක.`
              : `This ${config.en.singular.toLowerCase()} will be permanently deleted. This action cannot be undone.`}
          </p>
          {error && (
            <div className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4">
              {error}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100 font-medium text-sm transition-colors"
            >
              {language === "si" ? "අවලංගු කරන්න" : "Cancel"}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl text-sm transition-colors shadow-sm disabled:opacity-60"
            >
              {deleting && <Loader2 size={16} className="animate-spin" />}
              {language === "si" ? "මකන්න" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Main CRUD Panel ─────────────────── */

export function ResourcePanel({ config }: { config: ResourceConfig }) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [refCache, setRefCache] = useState<RefCache>({});

  // Dialogs
  const [showCreate, setShowCreate] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [deleteRow, setDeleteRow] = useState<Row | null>(null);

  const meta = language === "si" ? config.si : config.en;
  const tableFields = config.fields.filter((f) => f.showInTable);

  // Fetch ref data for uuid-ref fields
  const refFields = useMemo(
    () =>
      config.fields.filter(
        (f) => f.type === "uuid-ref" && f.refResource,
      ),
    [config.fields],
  );

  const loadRefs = useCallback(async () => {
    const cache: RefCache = {};
    await Promise.all(
      refFields.map(async (f) => {
        try {
          const resp = await fetch(
            `/api/backend/${f.refResource}?limit=200`,
            { cache: "no-store" },
          );
          if (resp.ok) {
            cache[f.refResource!] = await resp.json();
          }
        } catch {
          /* ignore ref load failures */
        }
      }),
    );
    setRefCache(cache);
  }, [refFields]);

  const loadRows = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        const resp = await fetch(
          `/api/backend/${config.endpoint}?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`,
          { cache: "no-store", signal },
        );
        if (resp.status === 401) {
          router.replace("/login");
          return;
        }
        if (resp.status === 403) {
          setError(t.accessDenied);
          setRows([]);
          return;
        }
        if (!resp.ok) throw new Error("Unable to load");
        const data = await resp.json();
        if (!Array.isArray(data)) throw new Error("Invalid response");
        setRows(data);
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError")
          return;
        setError(t.unavailable);
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [config.endpoint, page, router, t.accessDenied, t.unavailable],
  );

  useEffect(() => {
    const c = new AbortController();
    void loadRows(c.signal);
    return () => c.abort();
  }, [loadRows]);

  useEffect(() => {
    void loadRefs();
  }, [loadRefs]);

  useEffect(() => {
    setPage(0);
    setQuery("");
  }, [config.key]);

  const filteredRows = query
    ? rows.filter((row) =>
        Object.values(row).some((v) =>
          String(v).toLowerCase().includes(query.toLowerCase()),
        ),
      )
    : rows;

  const onSaved = () => {
    setShowCreate(false);
    setEditRow(null);
    void loadRows();
    void loadRefs();
  };

  const onDeleted = () => {
    setDeleteRow(null);
    void loadRows();
  };

  return (
    <div className="flex-1">
      {/* Dialogs */}
      {(showCreate || editRow) && (
        <FormDialog
          config={config}
          language={language}
          editing={editRow}
          refCache={refCache}
          onClose={() => {
            setShowCreate(false);
            setEditRow(null);
          }}
          onSaved={onSaved}
        />
      )}
      {deleteRow && (
        <DeleteConfirm
          config={config}
          language={language}
          row={deleteRow}
          onClose={() => setDeleteRow(null)}
          onDeleted={onDeleted}
        />
      )}

      <section className="w-full bg-white dark:bg-[#1e1e1e] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex flex-col p-6 border-b border-gray-50 dark:border-gray-800 bg-[#fafcfa] dark:bg-[#1a1a1a] gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {meta.plural}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{meta.description}</p>
            </div>
            {config.canCreate && config.inputFields.length > 0 && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#76aa32] hover:bg-[#68982a] text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
              >
                <Plus size={16} />
                {language === "si"
                  ? `නව ${config.si.singular}`
                  : `New ${config.en.singular}`}
              </button>
            )}
          </div>

          {/* Search / Filter */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  language === "si"
                    ? `${meta.plural} සොයන්න...`
                    : `Search ${meta.plural.toLowerCase()}...`
                }
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#76aa32]/20 focus:border-[#76aa32] transition-all"
              />
            </div>
            <span className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full text-xs font-semibold border border-gray-100 dark:border-gray-800">
              {rows.length} {language === "si" ? "වාර්තා" : "records"}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          {error ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
                <X size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {language === "si"
                  ? "දත්ත පූරණය කළ නොහැක"
                  : "Unable to load data"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-md">{error}</p>
              <button
                className="px-4 py-2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl text-sm transition-all shadow-sm"
                onClick={() => void loadRows()}
              >
                {t.retry}
              </button>
            </div>
          ) : loading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <Loader2
                size={32}
                className="animate-spin text-[#76aa32] mb-4"
              />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {language === "si" ? "පූරණය වෙමින්…" : "Loading…"}
              </p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-400 mb-4">
                <Search size={28} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {language === "si"
                  ? `${meta.plural} හමු නොවීය`
                  : `No ${meta.plural.toLowerCase()} found`}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm">
                {language === "si"
                  ? "ඔබේ සෙවුම් පෙරීම් ඉවත් කරන්න හෝ නව වාර්තාවක් එකතු කරන්න."
                  : "Try clearing your search or add a new record."}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  {tableFields.map((f) => (
                    <th
                      key={f.key}
                      className="px-6 py-4 font-semibold tracking-wider"
                    >
                      {language === "si" ? f.si : f.en}
                    </th>
                  ))}
                  {(config.canEdit || config.canDelete) && (
                    <th className="px-6 py-4 font-semibold text-right">
                      {language === "si" ? "ක්‍රියා" : "Actions"}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.map((row, index) => (
                  <tr
                    key={String(row.id ?? index)}
                    className="hover:bg-[#fcfdfa] dark:bg-[#222] transition-colors group"
                  >
                    {tableFields.map((f, colIdx) => (
                      <td
                        key={f.key}
                        className={`px-6 py-4 ${colIdx === 0 ? "font-medium text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}`}
                      >
                        {cellValue(f, row[f.key], refCache, language)}
                      </td>
                    ))}
                    {(config.canEdit || config.canDelete) && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {config.canEdit &&
                            config.inputFields.length > 0 && (
                              <button
                                onClick={() => setEditRow(row)}
                                className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                title={language === "si" ? "සංස්කරණය" : "Edit"}
                              >
                                <Pencil size={15} />
                              </button>
                            )}
                          {config.canDelete && (
                            <button
                              onClick={() => setDeleteRow(row)}
                              className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title={language === "si" ? "මකන්න" : "Delete"}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-800 bg-[#fafcfa] dark:bg-[#1a1a1a] text-sm text-gray-500 dark:text-gray-400">
          <span>
            {language === "si"
              ? `${rows.length === 0 ? 0 : page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, page * PAGE_SIZE + rows.length)} වාර්තා`
              : `Showing ${rows.length === 0 ? 0 : page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, page * PAGE_SIZE + rows.length)} records`}
          </span>
          <div className="flex items-center gap-1">
            <button
              aria-label="Previous page"
              disabled={page === 0 || loading}
              onClick={() => setPage((c) => c - 1)}
              className="p-2 rounded-lg border border-transparent hover:bg-gray-100 dark:bg-gray-800 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-4 font-medium text-gray-900 dark:text-gray-100">
              {language === "si" ? `පිටුව ${page + 1}` : `Page ${page + 1}`}
            </span>
            <button
              aria-label="Next page"
              disabled={rows.length < PAGE_SIZE || loading}
              onClick={() => setPage((c) => c + 1)}
              className="p-2 rounded-lg border border-transparent hover:bg-gray-100 dark:bg-gray-800 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
