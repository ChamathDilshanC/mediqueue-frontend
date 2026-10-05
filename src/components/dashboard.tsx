"use client";

import { AppointmentInbox } from "./appointment-inbox";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  Building2,
  CalendarClock,
  ClipboardList,
  DoorOpen,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import { useLanguage } from "./providers";
import { SiteHeader } from "./site-header";
import { ResourcePanel } from "./resource-panel";
import { WorkflowPanel } from "./workflow-panel";
import { Loader } from "./loader";
import { WardBedBoard } from "./ward-bed-board";
import Link from "next/link";
import { OperationsReport, reportSchema } from "./operations-report";
import { resources, type ResourceKey } from "@/lib/dashboard-resources";
import { resourceConfigs } from "@/lib/resource-config";
import { profileSchema } from "@/lib/auth-contract";
import { activeMembership, canRead, canWrite } from "@/lib/permissions";

type Row = Record<string, unknown>;

/* ─────────────────── Overview Dashboard ─────────────────── */

function OverviewDashboard() {
  const { language } = useLanguage();
  const router = useRouter();

  const [loadError, setLoadError] = useState(false);

  // Live stats from backend
  const [stats, setStats] = useState({
    doctors: 0,
    departments: 0,
    patients: 0,
    queues: 0,
    appointments: 0,
    loading: true,
  });
  const [recentAppointments, setRecentAppointments] = useState<Row[]>([]);
  const [recentDoctors, setRecentDoctors] = useState<Row[]>([]);
  const [recentDepartments, setRecentDepartments] = useState<Row[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    async function load() {
      try {
        const responses = await Promise.all([
          fetch("/api/backend/reports/overview", { cache: "no-store", signal }),
          fetch("/api/backend/doctors?limit=10", { cache: "no-store", signal }),
          fetch("/api/backend/departments?limit=10", {
            cache: "no-store",
            signal,
          }),
          fetch("/api/backend/appointment-inbox?limit=10", {
            cache: "no-store",
            signal,
          }),
        ]);
        if (responses.some((response) => !response.ok))
          throw new Error("Overview unavailable");
        const [report, doctorsData, departmentsData, appointmentsData] =
          await Promise.all(responses.map((response) => response.json()));
        const totals = reportSchema.parse(report).totals;
        setStats({
          doctors: totals.doctors,
          departments: totals.departments,
          patients: totals.patients,
          queues: totals.queues,
          appointments: totals.appointments,
          loading: false,
        });

        if (Array.isArray(appointmentsData.items))
          setRecentAppointments(appointmentsData.items.slice(0, 5));
        if (Array.isArray(doctorsData))
          setRecentDoctors(doctorsData.slice(0, 5));
        if (Array.isArray(departmentsData))
          setRecentDepartments(departmentsData.slice(0, 5));
      } catch {
        if (!signal.aborted) setLoadError(true);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  const si = language === "si";

  const cards = [
    {
      label: si ? "අංශ" : "Departments",
      value: stats.departments,
      icon: <DoorOpen size={18} />,
      color:
        "bg-transparent text-[var(--flat-accent)] dark:bg-transparent dark:text-[var(--flat-accent)]",
      gradient: "from-transparent",
    },
    {
      label: si ? "වෛද්‍යවරු" : "Doctors",
      value: stats.doctors,
      icon: <Stethoscope size={18} />,
      color:
        "bg-transparent text-[var(--flat-accent)] dark:bg-transparent dark:text-[var(--flat-accent)]",
      gradient: "from-transparent",
    },
    {
      label: si ? "රෝගීන්" : "Patients",
      value: stats.patients,
      icon: <Users size={18} />,
      color:
        "bg-transparent text-[var(--flat-accent)] dark:bg-transparent dark:text-[var(--flat-accent)]",
      gradient: "from-transparent",
    },
    {
      label: si ? "සජීවී පෝලිම්" : "Active Queues",
      value: stats.queues,
      icon: <Activity size={18} />,
      color:
        "bg-transparent text-[var(--flat-accent)] dark:bg-transparent dark:text-[var(--flat-accent)]",
      gradient: "from-transparent",
    },
    {
      label: si ? "හමුවීම්" : "Appointments",
      value: stats.appointments,
      icon: <CalendarClock size={18} />,
      color:
        "bg-transparent text-[var(--flat-accent)] dark:bg-transparent dark:text-[var(--flat-accent)]",
      gradient: "from-transparent",
    },
  ];

  if (loadError)
    return (
      <div className="account-error" role="alert">
        {si ? "දත්ත පූරණය කළ නොහැක" : "Unable to load the operations overview."}
        <button
          className="button secondary"
          onClick={() => window.location.reload()}
        >
          {si ? "නැවත උත්සාහ කරන්න" : "Retry"}
        </button>
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex flex-col p-5 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-[#f4f4f4] dark:border-gray-800 shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[#727272] dark:text-[#a2a2a2]">
                {card.label}
              </span>
              <div className={`p-2 rounded-lg ${card.color}`}>{card.icon}</div>
            </div>
            {stats.loading ? (
              <Loader2 size={24} className="animate-spin text-[#d5d5d5]" />
            ) : (
              <strong className="text-3xl font-semibold text-[#000000] dark:text-gray-100 mb-1">
                {card.value}
              </strong>
            )}
            <small className="text-xs text-[#a2a2a2] font-medium">
              {si ? "සම්බන්ධිත දත්ත" : "Live data"}
            </small>
            <div
              className={`absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br ${card.gradient} to-transparent rounded-full opacity-50 pointer-events-none`}
            ></div>
          </div>
        ))}
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl border border-[#f4f4f4] dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[#ffffff] dark:border-gray-800 bg-[#ffffff] dark:bg-[#1a1a1a] flex items-center justify-between">
            <h3 className="font-bold text-[#000000] dark:text-gray-100">
              {si ? "මෑත හමුවීම්" : "Recent Appointments"}
            </h3>
            <button
              onClick={() => router.push("/dashboard?resource=appointments")}
              className="text-xs text-[#00CAFF] font-semibold hover:underline"
            >
              {si ? "සියල්ල බලන්න →" : "View all →"}
            </button>
          </div>
          <div className="p-0">
            {recentAppointments.length === 0 ? (
              <div className="p-8 text-center text-[#a2a2a2] text-sm">
                {si ? "හමුවීම් හමු නොවීය" : "No appointments found"}
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#727272] dark:text-[#a2a2a2] uppercase bg-[#ffffff]/50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-5 py-3 font-medium">
                      {si ? "රෝගියා" : "Patient"}
                    </th>
                    <th className="px-5 py-3 font-medium">
                      {si ? "තත්ත්වය" : "Status"}
                    </th>
                    <th className="px-5 py-3 font-medium text-right">
                      {si ? "සාදන ලද" : "Created"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentAppointments.map((apt, i) => (
                    <tr
                      key={String(apt.id ?? i)}
                      className="hover:bg-[#ffffff]/50 dark:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-[#000000] dark:text-gray-100">
                        <span className="text-xs text-[#727272] dark:text-[#a2a2a2] font-mono">
                          {String(
                            apt.patient_name || (si ? "රෝගියා" : "Patient"),
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            String(apt.status) === "BOOKED"
                              ? "bg-transparent text-[var(--flat-accent)]"
                              : String(apt.status) === "CHECKED_IN"
                                ? "bg-transparent text-[var(--flat-accent)]"
                                : String(apt.status) === "COMPLETED"
                                  ? "bg-transparent text-[var(--flat-accent)]"
                                  : "bg-[#f4f4f4] dark:bg-gray-800 text-[#727272] dark:text-[#a2a2a2]"
                          }`}
                        >
                          {String(apt.status ?? "").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-[#727272] dark:text-[#a2a2a2] text-xs">
                        {apt.created_at
                          ? new Date(
                              String(apt.created_at),
                            ).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Doctors */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl border border-[#f4f4f4] dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[#ffffff] dark:border-gray-800 bg-[#ffffff] dark:bg-[#1a1a1a] flex items-center justify-between">
            <h3 className="font-bold text-[#000000] dark:text-gray-100">
              {si ? "වෛද්‍යවරු" : "Doctors"}
            </h3>
            <button
              onClick={() => router.push("/dashboard?resource=doctors")}
              className="text-xs text-[#00CAFF] font-semibold hover:underline"
            >
              {si ? "සියල්ල බලන්න →" : "View all →"}
            </button>
          </div>
          <div className="p-0">
            {recentDoctors.length === 0 ? (
              <div className="p-8 text-center text-[#a2a2a2] text-sm">
                {si ? "වෛද්‍යවරු හමු නොවීය" : "No doctors found"}
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#727272] dark:text-[#a2a2a2] uppercase bg-[#ffffff]/50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-5 py-3 font-medium">
                      {si ? "වෛද්‍යවරයා" : "Doctor"}
                    </th>
                    <th className="px-5 py-3 font-medium text-right">
                      {si ? "විශේෂත්වය" : "Specialty"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentDoctors.map((doc, i) => (
                    <tr
                      key={String(doc.id ?? i)}
                      className="hover:bg-[#ffffff]/50 dark:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-[#000000] dark:text-gray-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-transparent text-[var(--flat-accent)] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {String(doc.name ?? "?")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                        {String(doc.name ?? "—")}
                      </td>
                      <td className="px-5 py-3 text-right text-[#727272] dark:text-[#a2a2a2]">
                        {String(doc.specialty ?? "—") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Departments */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl border border-[#f4f4f4] dark:border-gray-800 shadow-sm overflow-hidden flex flex-col lg:col-span-2">
          <div className="p-5 border-b border-[#ffffff] dark:border-gray-800 bg-[#ffffff] dark:bg-[#1a1a1a] flex items-center justify-between">
            <h3 className="font-bold text-[#000000] dark:text-gray-100 flex items-center gap-2">
              <DoorOpen size={18} className="text-[#00CAFF]" />
              {si ? "රෝහල් අංශ (Departments)" : "Hospital Departments"}
            </h3>
            <button
              onClick={() => router.push("/dashboard?resource=departments")}
              className="text-xs text-[#00CAFF] font-semibold hover:underline"
            >
              {si ? "සියල්ල බලන්න →" : "View all →"}
            </button>
          </div>
          <div className="p-0">
            {recentDepartments.length === 0 ? (
              <div className="p-8 text-center text-[#a2a2a2] text-sm">
                {si ? "අංශ හමු නොවීය" : "No departments found"}
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#727272] dark:text-[#a2a2a2] uppercase bg-[#ffffff]/50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-5 py-3 font-medium">
                      {si ? "අංශයේ නම" : "Department"}
                    </th>
                    <th className="px-5 py-3 font-medium">
                      {si ? "සංකේතය" : "Code"}
                    </th>
                    <th className="px-5 py-3 font-medium">
                      {si ? "ස්ථානය" : "Location"}
                    </th>
                    <th className="px-5 py-3 font-medium">
                      {si ? "අංශ ප්‍රධානියා" : "Head of Dept"}
                    </th>
                    <th className="px-5 py-3 font-medium text-right">
                      {si ? "තත්ත්වය" : "Status"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentDepartments.map((dept, i) => (
                    <tr
                      key={String(dept.id ?? i)}
                      className="hover:bg-[#ffffff]/50 dark:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-[#000000] dark:text-gray-100">
                        {String(dept.name ?? "—")}
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs font-mono font-semibold text-gray-700 dark:text-gray-300">
                          {String(dept.code || "—")}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[#727272] dark:text-[#a2a2a2] text-xs">
                        {String(dept.location || "—")}
                      </td>
                      <td className="px-5 py-3 text-[#727272] dark:text-[#a2a2a2] text-xs">
                        {String(dept.head_of_dept || "—")}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            dept.is_active !== false
                              ? "bg-transparent text-[var(--flat-accent)] border-[var(--flat-line)] dark:bg-transparent dark:text-[var(--flat-accent)]"
                              : "bg-transparent text-[var(--flat-accent)] border-[var(--flat-line)] dark:bg-transparent dark:text-[var(--flat-accent)]"
                          }`}
                        >
                          {dept.is_active !== false ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Main Dashboard ─────────────────── */

export function Dashboard() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [accessError, setAccessError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/auth/me", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        if (!response.ok) throw new Error("Profile unavailable");
        const member = activeMembership(
          profileSchema.parse(await response.json()),
        );
        if (!member) {
          router.replace("/patient");
          return;
        }
        document.cookie = `active_tenant_id=${member.tenant_id}; path=/; SameSite=Lax`;
        document.cookie = `active_branch_id=${member.branch_id}; path=/; SameSite=Lax`;
        setRole(member.role);
      })
      .catch(() => {
        if (!controller.signal.aborted) setAccessError(true);
      });
    return () => controller.abort();
  }, [router]);
  const searchParams = useSearchParams();
  const selected = searchParams.get("resource");
  const resource = (
    selected && resources.some(({ key }) => key === selected)
      ? selected
      : selected === null
        ? "overview"
        : "hospitals"
  ) as ResourceKey | "overview";

  const si = language === "si";

  if (accessError)
    return (
      <main className="container account-page" role="alert">
        {t.unavailable}
        <button
          className="button secondary"
          onClick={() => window.location.reload()}
        >
          {t.retry}
        </button>
      </main>
    );
  if (!role)
    return (
      <main className="workspace-loading">
        <Loader fullPage />
      </main>
    );
  if (resource !== "overview" && !canRead(resource, role))
    return (
      <main className="container account-page" role="alert">
        {si
          ? "මෙම කොටසට ප්‍රවේශ අවසර නැත"
          : "Your role does not have access to this section."}
      </main>
    );

  return (
    <>
      <SiteHeader simple />
      <main className="staff-workspace flex-1 w-full bg-[#ffffff] dark:bg-[#000000] min-h-screen pb-12">
        <div className="px-6 md:px-10 lg:px-12 pt-6">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 mt-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-[#1e1e1e] border border-[#ffffff] rounded-full text-xs font-medium text-[#00CAFF] mb-4 shadow-sm">
                <ShieldCheck size={14} className="text-[#00CAFF]" />
                {t.account}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#000000] dark:text-gray-100 mb-2">
                {resource === "overview"
                  ? si
                    ? "ප්‍රධාන පුවරුව"
                    : "Operations Dashboard"
                  : resource === "bed-board"
                    ? si
                      ? "ඇඳන් පුවරුව"
                      : "Bed board"
                    : resource === "reports"
                      ? si
                        ? "වාර්තා"
                        : "Reports"
                      : si
                        ? (resourceConfigs[resource]?.si.plural ??
                          "ප්‍රධාන පුවරුව")
                        : (resourceConfigs[resource]?.en.plural ?? "Dashboard")}
              </h1>
              <p className="text-[#727272] dark:text-[#a2a2a2] text-sm md:text-base">
                {resource === "overview"
                  ? si
                    ? "MediQueue පද්ධතිය එකම තැනකින් කළමනාකරණය කරන්න."
                    : "Manage every MediQueue resource from one place."
                  : resourceConfigs[resource]?.si
                    ? si
                      ? resourceConfigs[resource].si.description
                      : resourceConfigs[resource].en.description
                    : ""}
              </p>
            </div>
          </div>

          {/* Content */}
          {["wards", "beds", "ward-admissions"].includes(resource) && (
            <Link
              className="button secondary mb-6"
              href="/dashboard?resource=bed-board"
            >
              {si ? "වෝඩ් ඇඳන් දෘශ්‍ය පුවරුව" : "Open visual bed board"}
            </Link>
          )}
          {resource === "queues" && (
            <WorkflowPanel kind={resource} role={role} />
          )}
          {resource === "bed-board" || resource === "beds" ? (
            <>
              <WardBedBoard />
              {resource === "beds" && (
                <details className="mt-8">
                  <summary className="button secondary">
                    {si ? "ඇඳන් කළමනාකරණය" : "Manage bed records"}
                  </summary>
                  <div className="mt-4">
                    <ResourcePanel
                      config={{
                        ...resourceConfigs.beds,
                        canCreate: canWrite("beds", role),
                        canEdit: canWrite("beds", role),
                        canDelete: role === "admin",
                      }}
                    />
                  </div>
                </details>
              )}
            </>
          ) : resource === "appointments" ? (
            <>
              <AppointmentInbox role={role} />
              {canWrite("appointments", role) && (
                <details className="mt-6">
                  <summary className="button secondary">
                    {si
                      ? "කාර්ය මණ්ඩල හමුවීමක් වෙන්කරන්න"
                      : "Create a staff booking"}
                  </summary>
                  <div className="mt-4">
                    <ResourcePanel
                      config={{
                        ...resourceConfigs.appointments,
                        canCreate: true,
                        canEdit: false,
                        canDelete: false,
                      }}
                    />
                  </div>
                </details>
              )}
            </>
          ) : resource === "reports" ? (
            <OperationsReport />
          ) : resource === "overview" ? (
            <OverviewDashboard />
          ) : resourceConfigs[resource] ? (
            <ResourcePanel
              key={resource}
              config={{
                ...resourceConfigs[resource],
                canCreate:
                  resourceConfigs[resource].canCreate &&
                  canWrite(resource, role) &&
                  !(resource === "prescriptions" && role === "staff"),
                canEdit:
                  resourceConfigs[resource].canEdit && canWrite(resource, role),
                canDelete:
                  resourceConfigs[resource].canDelete && role === "admin",
              }}
            />
          ) : (
            <div className="p-12 text-center text-[#a2a2a2]">
              {si ? "සම්පත හමු නොවීය" : "Resource not found"}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
