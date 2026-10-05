"use client";
import { hospitalDate } from "./ward-stay";
import { BranchLocationPicker } from "./branch-location-picker";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Activity,
  AlignLeft,
  Award,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  DoorOpen,
  FileText,
  Globe,
  Hash,
  Hospital,
  Info,
  Layers,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Tag,
  ToggleLeft,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useLanguage } from "./providers";
import MorphSelect, {
  MorphSelectContent,
  MorphSelectItem,
  MorphSelectTrigger,
  MorphSelectValue,
} from "./ui/select-morph";
import type { ResourceConfig, FieldDef } from "@/lib/resource-config";

/* ─────────────────── Helpers ─────────────────── */

function getFieldIcon(key: string, type: string) {
  const k = key.toLowerCase();
  const iconProps = {
    size: 14,
    className: "text-[#76aa32] dark:text-[#8bc34a] shrink-0",
  };

  if (k.includes("hospital")) return <Hospital {...iconProps} />;
  if (k.includes("branch")) return <Building2 {...iconProps} />;
  if (k.includes("department")) return <Layers {...iconProps} />;
  if (k.includes("ward")) return <Building2 {...iconProps} />;
  if (k.includes("bed")) return <DoorOpen {...iconProps} />;
  if (k.includes("admission")) return <Activity {...iconProps} />;
  if (k.includes("room")) return <DoorOpen {...iconProps} />;
  if (k.includes("doctor") || k.includes("staff"))
    return <Stethoscope {...iconProps} />;
  if (k.includes("user") || k.includes("patient"))
    return <UserCheck {...iconProps} />;
  if (k.includes("queue")) return <Users {...iconProps} />;
  if (k.includes("name")) return <Tag {...iconProps} />;
  if (k.includes("code") || k.includes("number") || k.includes("token"))
    return <Hash {...iconProps} />;
  if (
    k.includes("address") ||
    k.includes("location") ||
    k.includes("floor") ||
    k.includes("building")
  )
    return <MapPin {...iconProps} />;
  if (k.includes("phone") || k.includes("contact") || k.includes("extension"))
    return <Phone {...iconProps} />;
  if (k.includes("email")) return <Mail {...iconProps} />;
  if (k.includes("capacity") || k.includes("count"))
    return <Users {...iconProps} />;
  if (k.includes("status") || k.includes("active"))
    return <Activity {...iconProps} />;
  if (k.includes("role")) return <ShieldCheck {...iconProps} />;
  if (
    k.includes("time") ||
    k.includes("date") ||
    k.includes("start") ||
    k.includes("end") ||
    k.includes("admitted") ||
    k.includes("discharged")
  )
    return <CalendarClock {...iconProps} />;
  if (k.includes("note") || k.includes("desc"))
    return <AlignLeft {...iconProps} />;
  if (k.includes("fee") || k.includes("price") || k.includes("cost"))
    return <CreditCard {...iconProps} />;

  if (type === "number") return <Hash {...iconProps} />;
  if (type === "boolean") return <ToggleLeft {...iconProps} />;
  if (type === "datetime") return <CalendarClock {...iconProps} />;
  if (type === "uuid-ref") return <Layers {...iconProps} />;

  return <Sparkles {...iconProps} />;
}

/* ─────────────────── Types ─────────────────── */

type Row = Record<string, unknown>;
type RefCache = Record<string, Row[]>;

const PAGE_SIZE = 20;

/* ─────────────────── Helpers ─────────────────── */

function statusColor(status: string) {
  const s = status.toUpperCase();
  if (
    ["ACTIVE", "BOOKED", "WAITING", "TRUE", "AVAILABLE", "ADMITTED"].includes(s)
  )
    return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800";
  if (
    [
      "CHECKED_IN",
      "SERVING",
      "CALLED",
      "RESERVED",
      "CLEANING",
      "TRANSFERRED",
    ].includes(s)
  )
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800";
  if (["COMPLETED", "DISCHARGED", "OCCUPIED"].includes(s))
    return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800";
  if (
    [
      "CANCELLED",
      "NO_SHOW",
      "FALSE",
      "INACTIVE",
      "REJECTED",
      "MAINTENANCE",
    ].includes(s)
  )
    return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800";
  return "bg-[#f9fafb] dark:bg-gray-800 text-[#4b5563] dark:text-[#9ca3af] border-[#e5e7eb] dark:border-gray-700";
}

function StatusBadge({ value }: { value: string }) {
  const display =
    value === "TRUE"
      ? "ACTIVE"
      : value === "FALSE"
        ? "INACTIVE"
        : value.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border uppercase tracking-wider ${statusColor(value)}`}
    >
      {display}
    </span>
  );
}

function formatRefDisplay(
  refResource: string,
  refLabel: string,
  opt: Row,
): string {
  const primary = opt[refLabel];
  if (refLabel === "starts_at" && typeof primary === "string") {
    return hospitalDate(primary, "en");
  }
  const main = String(primary ?? opt.name ?? opt.id);

  if (refResource === "departments" && opt.code) {
    return `${main} (${opt.code})`;
  }
  if (refResource === "doctors" && opt.specialty) {
    return `${main} - ${opt.specialty}`;
  }
  if (refResource === "wards" && opt.ward_code) {
    return `${main} (${opt.ward_code})`;
  }
  if (refResource === "beds" && opt.bed_type) {
    return `${main} [${opt.bed_type}]`;
  }
  return main;
}

function cellValue(
  field: FieldDef,
  value: unknown,
  refCache: RefCache,
  language: string,
): ReactNode {
  if (value === null || value === undefined || value === "")
    return <span className="text-[#d1d5db]">—</span>;

  if (field.type === "boolean")
    return <StatusBadge value={value ? "TRUE" : "FALSE"} />;

  if (field.key === "status" || field.key === "role")
    return <StatusBadge value={String(value)} />;

  if (field.type === "uuid-ref" && field.refResource && field.refLabel) {
    const items = refCache[field.refResource] ?? [];
    const match = items.find((r) => r.id === value);
    if (match) {
      return (
        <span className="text-sm text-[#374151] dark:text-[#d1d5db]">
          {formatRefDisplay(field.refResource, field.refLabel, match)}
        </span>
      );
    }
    return (
      <span className="text-[#9ca3af] text-xs font-mono">
        {String(value).slice(0, 8)}…
      </span>
    );
  }

  if (
    (field.type === "datetime" || /(_at|date)$/.test(field.key)) &&
    typeof value === "string"
  ) {
    return (
      <span className="text-sm text-[#374151] dark:text-[#d1d5db]">
        {hospitalDate(value, language === "si" ? "si" : "en")}
      </span>
    );
  }

  if (typeof value === "object")
    return (
      <span className="text-xs text-[#6b7280] dark:text-[#9ca3af]">
        {JSON.stringify(value)}
      </span>
    );

  return (
    <span className="text-sm text-[#111827] dark:text-gray-100">
      {String(value)}
    </span>
  );
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
  const [currentStep, setCurrentStep] = useState(0);

  const editableFields = config.fields.filter(
    (f) =>
      f.type !== "readonly" &&
      config.inputFields.includes(f.key) &&
      (editing ? !f.createOnly : !f.editOnly),
  );

  // Group fields into steps (up to 3 fields per step for multi-step UX)
  const steps = useMemo(() => {
    if (config.key === "wards" || config.key === "branches")
      return [editableFields];
    const chunks: FieldDef[][] = [];
    for (let i = 0; i < editableFields.length; i += 3) {
      chunks.push(editableFields.slice(i, i + 3));
    }
    return chunks.length > 0 ? chunks : [[]];
  }, [editableFields]);

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const f of editableFields) {
      if (editing) {
        initial[f.key] = String(editing[f.key] ?? "");
      } else {
        initial[f.key] =
          (f.type === "datetime" && !/planned|ends_at/.test(f.key)
            ? new Date().toISOString()
            : f.defaultValue) ??
          (f.type === "select"
            ? (f.options?.[0]?.value ?? "")
            : f.type === "number"
              ? f.required
                ? "0"
                : ""
              : f.type === "boolean"
                ? "true"
                : "");
      }
    }
    setFormData(initial);
    setCurrentStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const validateStep = (stepIdx: number) => {
    const fieldsInStep = steps[stepIdx] ?? [];
    for (const f of fieldsInStep) {
      const val = formData[f.key] ?? "";
      if (f.required && !val.trim()) {
        setError(
          `${language === "si" ? f.si : f.en} ${language === "si" ? "අවශ්‍ය වේ" : "is required"}`,
        );
        return false;
      }
    }
    setError("");
    return true;
  };

  const handleNext = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.preventDefault();
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setError("");
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If not on the last step, move to next step instead of submitting
    if (currentStep < steps.length - 1) {
      handleNext();
      return;
    }

    // Validate all steps before submission
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        return;
      }
    }

    setSubmitting(true);
    setError("");

    // Build body
    const body: Record<string, unknown> = {};
    for (const f of editableFields) {
      const val = formData[f.key] ?? "";
      if (f.type === "number")
        body[f.key] = val === "" && !f.required ? null : Number(val);
      else if (f.type === "datetime")
        body[f.key] = val ? new Date(val).toISOString() : null;
      else if (f.type === "uuid-ref" && !val && !f.required) body[f.key] = null;
      else if (f.type === "boolean") body[f.key] = val === "true";
      else body[f.key] = val;
    }

    if (config.key === "wards") {
      const department: Record<string, unknown> = {};
      for (const key of Object.keys(body))
        if (key.startsWith("new_department_")) {
          department[key.replace("new_department_", "")] = body[key];
          delete body[key];
        }
      if (!editing && !body.department_id && department.name)
        body.new_department = department;
      if (!body.department_id && !body.new_department) {
        setError(
          language === "si"
            ? "අංශයක් තෝරන්න හෝ නව අංශයක නම ඇතුළත් කරන්න"
            : "Select a department or enter a new department name",
        );
        setSubmitting(false);
        return;
      }
    }

    if (editing?.version !== undefined) body.version = editing.version;
    // References marked create-only remain part of complete replacement bodies.
    if (editing)
      for (const f of config.fields) {
        if (
          f.createOnly &&
          config.inputFields.includes(f.key) &&
          !(config.key === "branches" && f.key === "tenant_id") &&
          editing[f.key] !== undefined
        )
          body[f.key] = editing[f.key];
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
        setError(
          typeof data?.detail === "string"
            ? data.detail
            : Array.isArray(data?.detail)
              ? data.detail
                  .map((item: { msg?: string }) => item.msg || "Invalid field")
                  .join("; ")
              : `Error ${resp.status}`,
        );
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

  const stepTitlesEn = [
    "Basic Information",
    "Location & Contact",
    "Capacity & Type",
    "Management & Staff",
    "Additional Details",
    "Final Options",
  ];
  const stepTitlesSi = [
    "මූලික තොරතුරු",
    "ස්ථානය සහ සම්බන්ධතා",
    "ධාරිතාව සහ වර්ගය",
    "කළමනාකරණය",
    "අමතර විස්තර",
    "අවසාන තේරීම්",
  ];
  const stepIcons = [
    <Sparkles key="1" size={13} />,
    <Building2 key="2" size={13} />,
    <Users key="3" size={13} />,
    <UserCheck key="4" size={13} />,
    <FileText key="5" size={13} />,
    <CheckCircle2 key="6" size={13} />,
  ];

  const currentStepFields = steps[currentStep] ?? [];
  const isLastStep = currentStep === steps.length - 1;
  const progressPercent = Math.round(((currentStep + 1) / steps.length) * 100);
  const modalWidthClass =
    ["wards", "branches"].includes(config.key) || steps.length > 3
      ? "max-w-2xl"
      : "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-y-auto">
      <div
        className={`w-full ${modalWidthClass} max-h-[90vh] bg-white dark:bg-[#18181b] rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-200/50 dark:border-gray-800/50 overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col my-auto`}
      >
        {/* Multistep Header */}
        <div className="flex flex-col px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800/50 bg-white dark:bg-[#18181b] shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#76aa32]/20 to-[#76aa32]/5 text-[#76aa32] dark:text-[#8bc34a] border border-[#76aa32]/30 flex items-center justify-center shrink-0 shadow-xs">
                {editing ? <Pencil size={20} /> : <Sparkles size={20} />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#111827] dark:text-gray-100">
                  {title}
                </h3>
                {steps.length > 1 && (
                  <p className="text-xs text-[#76aa32] dark:text-[#8bc34a] font-semibold mt-0.5 flex items-center gap-1.5">
                    <Sparkles size={12} className="shrink-0 animate-pulse" />
                    {language === "si"
                      ? `පියවර ${currentStep + 1}/${steps.length}: ${stepTitlesSi[currentStep] ?? `පියවර ${currentStep + 1}`}`
                      : `Step ${currentStep + 1} of ${steps.length}: ${stepTitlesEn[currentStep] ?? `Step ${currentStep + 1}`}`}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#f3f4f6] dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={18} className="text-[#6b7280] dark:text-[#9ca3af]" />
            </button>
          </div>

          {/* Progress Bar & Step Chips */}
          {steps.length > 1 && (
            <div className="flex flex-col gap-2 pt-1">
              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#76aa32] to-[#5a8626] transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1 no-scrollbar">
                {steps.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (idx < currentStep || validateStep(currentStep)) {
                        setCurrentStep(idx);
                      }
                    }}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all shrink-0 ${
                      idx === currentStep
                        ? "bg-[#76aa32]/10 border-[#76aa32] text-[#76aa32] dark:text-[#8bc34a] shadow-xs"
                        : idx < currentStep
                          ? "bg-green-50 dark:bg-green-950/30 border-green-200 text-green-600 dark:text-green-400"
                          : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-400"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold border border-current shrink-0">
                      {idx < currentStep ? <CheckCircle2 size={10} /> : idx + 1}
                    </span>
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      {stepIcons[idx] ?? <Sparkles size={12} />}
                      {language === "si"
                        ? (stepTitlesSi[idx] ?? `පියවර ${idx + 1}`)
                        : (stepTitlesEn[idx] ?? `Step ${idx + 1}`)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step Form Body */}
        <form
          onSubmit={handleSubmit}
          className={`p-6 gap-4 overflow-y-auto ${config.key === "wards" ? "grid grid-cols-1 md:grid-cols-2" : "flex flex-col"}`}
        >
          {config.key === "branches" && (
            <BranchLocationPicker
              latitude={formData.latitude || ""}
              longitude={formData.longitude || ""}
              onChange={(latitude, longitude) =>
                setFormData((prev) => ({ ...prev, latitude, longitude }))
              }
            />
          )}
          {currentStepFields.map((f) => {
            const placeholderText =
              language === "si" && f.placeholderSi
                ? f.placeholderSi
                : f.placeholder;
            const isAutoGeneratedField = [
              "mrn",
              "ward_code",
              "bed_number",
              "code",
            ].includes(f.key);

            return (
              <div key={f.key} className="flex flex-col gap-2 relative">
                <label
                  htmlFor={`${config.key}-${f.key}`}
                  className="text-[13px] font-semibold tracking-wide text-gray-700 dark:text-gray-300 ml-1 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#76aa32]/10 dark:bg-[#76aa32]/20 flex items-center justify-center shrink-0 border border-[#76aa32]/20">
                      {getFieldIcon(f.key, f.type)}
                    </span>
                    <span>
                      {label(f)}
                      {f.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </span>
                  </span>
                  {placeholderText && (
                    <span className="text-[11px] font-normal text-[#76aa32] dark:text-[#8bc34a]">
                      {placeholderText}
                    </span>
                  )}
                </label>
                {f.type === "uuid-ref" ? (
                  <MorphSelect
                    id={`${config.key}-${f.key}`}
                    value={formData[f.key] ?? undefined}
                    onValueChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        [f.key]: val,
                        ...(config.key === "ward-admissions" &&
                        f.key === "ward_id"
                          ? { bed_id: "" }
                          : {}),
                      }))
                    }
                  >
                    <MorphSelectTrigger className="px-4 py-3 bg-gray-50/50 hover:bg-gray-50 dark:bg-[#121212] dark:hover:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl text-[14px] w-full flex items-center justify-between focus:ring-4 focus:ring-gray-200/50 dark:focus:ring-gray-800/50 focus:border-gray-300 dark:focus:border-gray-700 transition-all shadow-sm">
                      <MorphSelectValue
                        placeholder={`— ${language === "si" ? "තෝරන්න" : "Select"} —`}
                      />
                    </MorphSelectTrigger>
                    <MorphSelectContent
                      searchable
                      searchPlaceholder={
                        language === "si" ? "සොයන්න..." : "Search..."
                      }
                    >
                      {(refCache[f.refResource!] ?? [])
                        .filter((opt) => {
                          if (
                            config.key !== "ward-admissions" ||
                            f.key !== "bed_id"
                          )
                            return true;
                          return (
                            opt.ward_id === formData.ward_id &&
                            opt.is_active === true &&
                            (opt.status === "AVAILABLE" ||
                              (editing?.admission_status === "ADMITTED" &&
                                opt.id === editing.bed_id))
                          );
                        })
                        .map((opt) => (
                          <MorphSelectItem
                            key={String(opt.id)}
                            value={String(opt.id)}
                          >
                            {formatRefDisplay(f.refResource!, f.refLabel!, opt)}
                          </MorphSelectItem>
                        ))}
                    </MorphSelectContent>
                  </MorphSelect>
                ) : f.type === "select" ? (
                  <MorphSelect
                    id={`${config.key}-${f.key}`}
                    value={formData[f.key] ?? undefined}
                    onValueChange={(val) =>
                      setFormData((prev) => ({ ...prev, [f.key]: val }))
                    }
                  >
                    <MorphSelectTrigger className="px-4 py-3 bg-gray-50/50 hover:bg-gray-50 dark:bg-[#121212] dark:hover:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl text-[14px] w-full flex items-center justify-between focus:ring-4 focus:ring-gray-200/50 dark:focus:ring-gray-800/50 focus:border-gray-300 dark:focus:border-gray-700 transition-all shadow-sm">
                      <MorphSelectValue
                        placeholder={`— ${language === "si" ? "තෝරන්න" : "Select"} —`}
                      />
                    </MorphSelectTrigger>
                    <MorphSelectContent
                      searchable
                      searchPlaceholder={
                        language === "si" ? "සොයන්න..." : "Search..."
                      }
                    >
                      {(f.options ?? []).map((opt) => (
                        <MorphSelectItem key={opt.value} value={opt.value}>
                          {language === "si" ? opt.si : opt.en}
                        </MorphSelectItem>
                      ))}
                    </MorphSelectContent>
                  </MorphSelect>
                ) : f.type === "boolean" ? (
                  <MorphSelect
                    id={`${config.key}-${f.key}`}
                    value={formData[f.key] ?? "true"}
                    onValueChange={(val) =>
                      setFormData((prev) => ({ ...prev, [f.key]: val }))
                    }
                  >
                    <MorphSelectTrigger className="px-4 py-3 bg-gray-50/50 hover:bg-gray-50 dark:bg-[#121212] dark:hover:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl text-[14px] w-full flex items-center justify-between focus:ring-4 focus:ring-gray-200/50 dark:focus:ring-gray-800/50 focus:border-gray-300 dark:focus:border-gray-700 transition-all shadow-sm">
                      <MorphSelectValue
                        placeholder={`— ${language === "si" ? "තෝරන්න" : "Select"} —`}
                      />
                    </MorphSelectTrigger>
                    <MorphSelectContent>
                      <MorphSelectItem value="true">
                        {language === "si" ? "සක්‍රිය" : "Active"}
                      </MorphSelectItem>
                      <MorphSelectItem value="false">
                        {language === "si" ? "අක්‍රිය" : "Inactive"}
                      </MorphSelectItem>
                    </MorphSelectContent>
                  </MorphSelect>
                ) : f.type === "datetime" ? (
                  <>
                    <input
                      id={`${config.key}-${f.key}`}
                      type="datetime-local"
                      value={
                        formData[f.key]
                          ? new Date(
                              new Date(formData[f.key]).getTime() -
                                new Date(formData[f.key]).getTimezoneOffset() *
                                  60000,
                            )
                              .toISOString()
                              .slice(0, 16)
                          : ""
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          [f.key]: val ? new Date(val).toISOString() : "",
                        }));
                      }}
                      className="px-4 py-3 bg-gray-50/50 hover:bg-gray-50 dark:bg-[#121212] dark:hover:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl text-[14px] focus:outline-none focus:ring-4 focus:ring-gray-200/50 dark:focus:ring-gray-800/50 focus:border-gray-300 dark:focus:border-gray-700 transition-all shadow-sm"
                      required={f.required}
                    />
                    {formData[f.key] && (
                      <span className="text-xs text-gray-500">
                        {hospitalDate(
                          formData[f.key],
                          language === "si" ? "si" : "en",
                        )}
                      </span>
                    )}
                  </>
                ) : f.type === "number" ? (
                  <input
                    id={`${config.key}-${f.key}`}
                    type="number"
                    value={formData[f.key] ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [f.key]: e.target.value,
                      }))
                    }
                    className="px-4 py-3 bg-gray-50/50 hover:bg-gray-50 dark:bg-[#121212] dark:hover:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl text-[14px] focus:outline-none focus:ring-4 focus:ring-gray-200/50 dark:focus:ring-gray-800/50 focus:border-gray-300 dark:focus:border-gray-700 transition-all shadow-sm"
                    required={f.required}
                    min={f.min ?? 0}
                    step={f.step ?? "any"}
                  />
                ) : (
                  <input
                    id={`${config.key}-${f.key}`}
                    type="text"
                    value={formData[f.key] ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [f.key]: e.target.value,
                      }))
                    }
                    placeholder={placeholderText ?? ""}
                    maxLength={f.maxLength}
                    className="px-4 py-3 bg-gray-50/50 hover:bg-gray-50 dark:bg-[#121212] dark:hover:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl text-[14px] focus:outline-none focus:ring-4 focus:ring-gray-200/50 dark:focus:ring-gray-800/50 focus:border-gray-300 dark:focus:border-gray-700 transition-all shadow-sm"
                    required={f.required}
                  />
                )}

                {isAutoGeneratedField && !editing && (
                  <div className="flex items-center justify-between text-[11px] font-medium text-[#76aa32] dark:text-[#8bc34a] bg-[#76aa32]/10 dark:bg-[#76aa32]/20 px-3 py-1.5 rounded-xl border border-[#76aa32]/20 mt-0.5">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={12} className="animate-pulse shrink-0" />
                      {language === "si"
                        ? "හිස්ව තැබුවහොත් පද්ධතිය මගින් අංකය ස්වයංක්‍රීයව ජනනය වේ"
                        : "Auto-generated automatically if left blank"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const curYear = new Date().getFullYear();
                        const rand = Math.floor(1000 + Math.random() * 9000);
                        let sampleCode = "";
                        if (f.key === "mrn")
                          sampleCode = `MRN-${curYear}-${rand}`;
                        else if (f.key === "ward_code")
                          sampleCode = `WARD-${rand.toString().slice(0, 3)}`;
                        else if (f.key === "bed_number")
                          sampleCode = `BED-${rand.toString().slice(0, 3)}`;
                        else if (f.key === "code")
                          sampleCode = `DEPT-${rand.toString().slice(0, 2)}`;
                        setFormData((prev) => ({
                          ...prev,
                          [f.key]: sampleCode,
                        }));
                      }}
                      className="text-[10px] font-bold underline hover:opacity-80 transition-opacity ml-2 uppercase tracking-wide cursor-pointer shrink-0"
                    >
                      {language === "si" ? "අංකය යොදන්න ⚡" : "Auto-fill ⚡"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Controls: Prev, Next & Submit */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-800/50 mt-2">
            <div>
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="button secondary flex items-center gap-1.5"
                >
                  <ChevronLeft size={16} />
                  {language === "si" ? "ආපසු" : "Back"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="button secondary"
                >
                  {language === "si" ? "අවලංගු කරන්න" : "Cancel"}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isLastStep ? (
                <button
                  key="next-step-btn"
                  type="button"
                  onClick={handleNext}
                  className="button primary flex items-center gap-2"
                >
                  {language === "si" ? "ඊළඟ පියවර" : "Next Step"}
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  key="submit-step-btn"
                  type="submit"
                  disabled={submitting}
                  className="button primary flex items-center gap-2"
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
              )}
            </div>
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
      const resp = await fetch(`/api/backend/${config.endpoint}/${row.id}`, {
        method: "DELETE",
      });
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
      <div className="w-full max-w-md bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl border border-[#f3f4f6] dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <Trash2 size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-[#111827] dark:text-gray-100 mb-2">
            {language === "si" ? "මකා දැමීම තහවුරු කරන්න" : "Confirm Delete"}
          </h3>
          <p className="text-[#6b7280] dark:text-[#9ca3af] text-sm mb-6">
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
            <button onClick={onClose} className="button secondary">
              {language === "si" ? "අවලංගු කරන්න" : "Cancel"}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="button primary flex items-center gap-2"
              style={{
                background: "#dc2626",
                borderColor: "#b91c1c",
                color: "white",
              }}
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
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [refCache, setRefCache] = useState<RefCache>({});

  // Dialogs
  const [showCreate, setShowCreate] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [dischargeRow, setDischargeRow] = useState<Row | null>(null);
  const [discharging, setDischarging] = useState(false);
  const [dischargeError, setDischargeError] = useState("");
  const [deleteRow, setDeleteRow] = useState<Row | null>(null);

  const meta = language === "si" ? config.si : config.en;
  const tableFields = config.fields.filter((f) => f.showInTable);

  // Fetch ref data for uuid-ref fields
  const refFields = useMemo(
    () => config.fields.filter((f) => f.type === "uuid-ref" && f.refResource),
    [config.fields],
  );

  const loadRefs = useCallback(async () => {
    const cache: RefCache = {};
    await Promise.all(
      refFields.map(async (f) => {
        try {
          const records: Row[] = [];
          for (let offset = 0; ; offset += 200) {
            const resp = await fetch(
              `/api/backend/${f.refResource}?limit=200&offset=${offset}`,
              { cache: "no-store" },
            );
            if (!resp.ok) break;
            const batch: Row[] = await resp.json();
            records.push(...batch);
            if (batch.length < 200) break;
          }
          cache[f.refResource!] = records;
        } catch {
          /* ignore ref load failures */
        }
      }),
    );
    setRefCache(cache);
  }, [refFields]);

  const fetcher = useCallback(
    async (url: string) => {
      const resp = await fetch(url);
      if (resp.status === 401) {
        router.replace("/login");
        throw new Error("401");
      }
      if (resp.status === 403) throw new Error("403");
      if (!resp.ok) throw new Error("Unable to load");
      const data = await resp.json();
      if (!Array.isArray(data)) throw new Error("Invalid response");
      return data;
    },
    [router],
  );

  const {
    data: rowsData,
    error: swrError,
    mutate: mutateRows,
    isLoading,
  } = useSWR(
    `/api/backend/${config.endpoint}?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`,
    fetcher,
  );

  const rows: Row[] = rowsData ?? [];
  const loading = isLoading;
  const error =
    swrError?.message === "403"
      ? t.accessDenied
      : swrError
        ? t.unavailable
        : "";

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
    void mutateRows();
    void loadRefs();
  };

  const onDeleted = () => {
    setDeleteRow(null);
    void mutateRows();
  };

  return (
    <div className="flex-1">
      {/* Dialogs */}
      {dischargeRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Discharge patient"
            className="bg-white dark:bg-[#18181b] rounded-3xl p-6 max-w-md w-full space-y-4"
          >
            <h3>
              {language === "si" ? "රෝගියා පිටත් කරන්න" : "Discharge patient"}
            </h3>
            <p>
              {language === "si"
                ? "රෝගියා පිටත් කළ පසු ඇඳ නැවත ලබාගත හැක."
                : "Discharging this patient makes their bed available immediately."}
            </p>
            {dischargeError && <p role="alert">{dischargeError}</p>}
            <div className="flex gap-3">
              <button
                className="button secondary"
                disabled={discharging}
                onClick={() => setDischargeRow(null)}
              >
                {language === "si" ? "අවලංගු කරන්න" : "Cancel"}
              </button>
              <button
                className="button primary"
                disabled={discharging}
                onClick={async () => {
                  setDischarging(true);
                  setDischargeError("");
                  try {
                    const response = await fetch(
                      `/api/backend/ward-admissions/${dischargeRow.id}/discharge`,
                      { method: "POST" },
                    );
                    if (!response.ok) {
                      const data = await response.json();
                      throw new Error(
                        typeof data.detail === "string"
                          ? data.detail
                          : "Unable to discharge",
                      );
                    }
                    setDischargeRow(null);
                    onSaved();
                  } catch (err) {
                    setDischargeError(
                      err instanceof Error
                        ? err.message
                        : "Unable to discharge",
                    );
                  } finally {
                    setDischarging(false);
                  }
                }}
              >
                {discharging
                  ? "…"
                  : language === "si"
                    ? "පිටත් කරන්න"
                    : "Discharge"}
              </button>
            </div>
          </div>
        </div>
      )}
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

      <section className="w-full bg-white dark:bg-[#1e1e1e] rounded-3xl border border-[#f3f4f6] dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex flex-col p-6 border-b border-[#f9fafb] dark:border-gray-800 bg-[#fafcfa] dark:bg-[#1a1a1a] gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-[#111827] dark:text-gray-100">
                {meta.plural}
              </h2>
              <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mt-1">
                {meta.description}
              </p>
            </div>
            {config.canCreate && config.inputFields.length > 0 && (
              <button
                onClick={() => {
                  void loadRefs();
                  setShowCreate(true);
                }}
                className="button primary flex items-center gap-2"
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
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
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
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1e1e1e] border border-[#e5e7eb] dark:border-gray-700 text-[#111827] dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#76aa32]/20 focus:border-[#76aa32] transition-all"
              />
            </div>
            <span className="px-3 py-1.5 bg-[#f9fafb] dark:bg-gray-800 text-[#6b7280] dark:text-[#9ca3af] rounded-full text-xs font-semibold border border-[#f3f4f6] dark:border-gray-800">
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
              <h3 className="text-lg font-semibold text-[#111827] dark:text-gray-100 mb-2">
                {language === "si"
                  ? "දත්ත පූරණය කළ නොහැක"
                  : "Unable to load data"}
              </h3>
              <p className="text-[#6b7280] dark:text-[#9ca3af] text-sm mb-6 max-w-md">
                {error}
              </p>
              <button
                className="button secondary"
                onClick={() => void mutateRows()}
              >
                {t.retry}
              </button>
            </div>
          ) : loading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <Loader2 size={32} className="animate-spin text-[#76aa32] mb-4" />
              <p className="text-[#6b7280] dark:text-[#9ca3af] text-sm">
                {language === "si" ? "පූරණය වෙමින්…" : "Loading…"}
              </p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#f9fafb] dark:bg-gray-800 border border-[#f3f4f6] dark:border-gray-800 flex items-center justify-center text-[#9ca3af] mb-4">
                <Search size={28} />
              </div>
              <h3 className="text-lg font-semibold text-[#111827] dark:text-gray-100 mb-2">
                {language === "si"
                  ? `${meta.plural} හමු නොවීය`
                  : `No ${meta.plural.toLowerCase()} found`}
              </h3>
              <p className="text-[#6b7280] dark:text-[#9ca3af] text-sm mb-6 max-w-sm">
                {language === "si"
                  ? "ඔබේ සෙවුම් පෙරීම් ඉවත් කරන්න හෝ නව වාර්තාවක් එකතු කරන්න."
                  : "Try clearing your search or add a new record."}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-[#6b7280] dark:text-[#9ca3af] uppercase bg-[#f9fafb]/50 dark:bg-gray-800/50 border-b border-[#f3f4f6] dark:border-gray-800">
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
                        className={`px-6 py-4 ${colIdx === 0 ? "font-medium text-[#111827] dark:text-gray-100" : "text-[#6b7280] dark:text-[#9ca3af]"}`}
                      >
                        {cellValue(f, row[f.key], refCache, language)}
                      </td>
                    ))}
                    {(config.canEdit || config.canDelete) && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {config.key === "ward-admissions" &&
                            config.canEdit &&
                            row.admission_status === "ADMITTED" && (
                              <button
                                className="button secondary"
                                onClick={() => {
                                  setDischargeError("");
                                  setDischargeRow(row);
                                }}
                              >
                                {language === "si"
                                  ? "පිටත් කරන්න"
                                  : "Discharge"}
                              </button>
                            )}
                          {config.canEdit &&
                            config.inputFields.length > 0 &&
                            (config.key !== "ward-admissions" ||
                              row.admission_status === "ADMITTED") && (
                              <button
                                onClick={() => setEditRow(row)}
                                className="p-2 text-[#9ca3af] hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                title={language === "si" ? "සංස්කරණය" : "Edit"}
                              >
                                <Pencil size={15} />
                              </button>
                            )}
                          {config.canDelete && (
                            <button
                              onClick={() => setDeleteRow(row)}
                              className="p-2 text-[#9ca3af] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
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
        <div className="flex items-center justify-between p-4 border-t border-[#f3f4f6] dark:border-gray-800 bg-[#fafcfa] dark:bg-[#1a1a1a] text-sm text-[#6b7280] dark:text-[#9ca3af]">
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
              className="p-2 rounded-lg border border-transparent hover:bg-[#f3f4f6] dark:bg-gray-800 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-4 font-medium text-[#111827] dark:text-gray-100">
              {language === "si" ? `පිටුව ${page + 1}` : `Page ${page + 1}`}
            </span>
            <button
              aria-label="Next page"
              disabled={rows.length < PAGE_SIZE || loading}
              onClick={() => setPage((c) => c + 1)}
              className="p-2 rounded-lg border border-transparent hover:bg-[#f3f4f6] dark:bg-gray-800 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
