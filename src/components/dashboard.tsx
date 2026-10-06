"use client";

import { AppointmentInbox } from "./appointment-inbox";
import { DashboardActivity } from "./dashboard-activity";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  ArrowRight,
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
import { DATA_UPDATED_EVENT } from "@/lib/data-sync";
import { statusLabel, statusTone } from "@/lib/status-tone";

type Row = Record<string, unknown>;

/* ─────────────────── Overview Dashboard ─────────────────── */

function OverviewDashboard() {
  const { language } = useLanguage();
  const router = useRouter();

  const [loadError, setLoadError] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

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
    const onDataUpdated = () => setDataVersion((version) => version + 1);
    window.addEventListener(DATA_UPDATED_EVENT, onDataUpdated);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, onDataUpdated);
  }, []);

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
  }, [dataVersion]);

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

  const viewAll = si ? "සියල්ල බලන්න" : "View all";
  const dateLabel = (value: unknown) =>
    value
      ? new Intl.DateTimeFormat(si ? "si-LK" : "en-GB", {
          dateStyle: "medium",
        }).format(new Date(String(value)))
      : "—";
  const panelHeader = (title: string, href: string, label: string) => (
    <div className="mq-panel-header">
      <h3>{title}</h3>
      <button
        type="button"
        className="mq-link"
        onClick={() => router.push(href)}
        aria-label={`${viewAll}: ${label}`}
        title={`${viewAll}: ${label}`}
      >
        {viewAll} <ArrowRight size={14} aria-hidden="true" />
      </button>
    </div>
  );
  const empty = (text: string) => (
    <p className="p-8 text-center text-sm text-[var(--mq-muted)]">{text}</p>
  );

  return (
    <div className="flex flex-col gap-6">
      <section
        className="mq-stat-grid mq-stagger"
        aria-label={si ? "මෙහෙයුම් සාරාංශය" : "Operations summary"}
      >
        {cards.map((card) => (
          <article key={card.label} className="mq-stat-card" aria-label={card.label}>
            <div className="mq-stat-label">
              <span>{card.label}</span>
              <span className="mq-stat-icon" aria-hidden="true">
                {card.icon}
              </span>
            </div>
            {stats.loading ? (
              <span
                className="mq-skeleton mt-4 block h-9 w-24"
                role="status"
                aria-label={si ? "පූරණය වෙමින්" : "Loading"}
              />
            ) : (
              <strong className="mq-stat-value">
                {card.value.toLocaleString()}
              </strong>
            )}
            <span className="mq-stat-caption">
              <span className="mq-live-dot" aria-hidden="true" />
              {si ? "සජීවී දත්ත" : "Live data"}
            </span>
          </article>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section
          className="mq-panel"
          aria-label={si ? "මෑත හමුවීම්" : "Recent appointments"}
        >
          {panelHeader(
            si ? "මෑත හමුවීම්" : "Recent appointments",
            "/dashboard?resource=appointments",
            si ? "හමුවීම්" : "appointments",
          )}
          {recentAppointments.length === 0 ? (
            empty(si ? "හමුවීම් හමු නොවීය" : "No appointments found")
          ) : (
            <div className="mq-table-wrap">
              <table className="mq-table mq-responsive">
                <caption>{si ? "මෑත හමුවීම්" : "Recent appointments"}</caption>
                <thead>
                  <tr>
                    <th scope="col">{si ? "රෝගියා" : "Patient"}</th>
                    <th scope="col">{si ? "තත්ත්වය" : "Status"}</th>
                    <th scope="col" className="mq-num">
                      {si ? "සාදන ලද" : "Created"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.map((apt, i) => (
                    <tr key={String(apt.id ?? i)}>
                      <td data-label={si ? "රෝගියා" : "Patient"}>
                        <span className="inline-flex items-center gap-3">
                          <span className="mq-avatar" aria-hidden="true">
                            {String(apt.patient_name || "?").slice(0, 1)}
                          </span>
                          {String(apt.patient_name || (si ? "රෝගියා" : "Patient"))}
                        </span>
                      </td>
                      <td data-label={si ? "තත්ත්වය" : "Status"}>
                        <span className={`mq-badge ${statusTone(apt.status)}`}>
                          {statusLabel(apt.status)}
                        </span>
                      </td>
                      <td data-label={si ? "සාදන ලද" : "Created"} className="mq-num">
                        {dateLabel(apt.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mq-panel" aria-label={si ? "වෛද්‍යවරු" : "Doctors"}>
          {panelHeader(
            si ? "වෛද්‍යවරු" : "Doctors",
            "/dashboard?resource=doctors",
            si ? "වෛද්‍යවරු" : "doctors",
          )}
          {recentDoctors.length === 0 ? (
            empty(si ? "වෛද්‍යවරු හමු නොවීය" : "No doctors found")
          ) : (
            <div className="mq-table-wrap">
              <table className="mq-table mq-responsive">
                <caption>{si ? "වෛද්‍යවරු" : "Doctors"}</caption>
                <thead>
                  <tr>
                    <th scope="col">{si ? "වෛද්‍යවරයා" : "Doctor"}</th>
                    <th scope="col">{si ? "විශේෂත්වය" : "Specialty"}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDoctors.map((doc, i) => (
                    <tr key={String(doc.id ?? i)}>
                      <td data-label={si ? "වෛද්‍යවරයා" : "Doctor"}>
                        <span className="inline-flex items-center gap-3">
                          <span className="mq-avatar" aria-hidden="true">
                            {String(doc.name ?? "?")
                              .replace(/^Dr\.?\s*/i, "")
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                          {String(doc.name ?? "—")}
                        </span>
                      </td>
                      <td data-label={si ? "විශේෂත්වය" : "Specialty"}>
                        {String(doc.specialty || "—")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section
          className="mq-panel lg:col-span-2"
          aria-label={si ? "රෝහල් අංශ" : "Hospital departments"}
        >
          {panelHeader(
            si ? "රෝහල් අංශ" : "Hospital departments",
            "/dashboard?resource=departments",
            si ? "අංශ" : "departments",
          )}
          {recentDepartments.length === 0 ? (
            empty(si ? "අංශ හමු නොවීය" : "No departments found")
          ) : (
            <div className="mq-table-wrap">
              <table className="mq-table mq-responsive">
                <caption>{si ? "රෝහල් අංශ" : "Hospital departments"}</caption>
                <thead>
                  <tr>
                    <th scope="col">{si ? "අංශයේ නම" : "Department"}</th>
                    <th scope="col">{si ? "සංකේතය" : "Code"}</th>
                    <th scope="col">{si ? "ස්ථානය" : "Location"}</th>
                    <th scope="col">{si ? "අංශ ප්‍රධානියා" : "Head of department"}</th>
                    <th scope="col">{si ? "තත්ත්වය" : "Status"}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDepartments.map((dept, i) => (
                    <tr key={String(dept.id ?? i)}>
                      <td data-label={si ? "අංශයේ නම" : "Department"}>
                        {String(dept.name ?? "—")}
                      </td>
                      <td data-label={si ? "සංකේතය" : "Code"}>
                        <code className="rounded-md bg-[var(--mq-surface-3)] px-2 py-0.5 text-xs font-semibold text-[var(--mq-text)]">
                          {String(dept.code || "—")}
                        </code>
                      </td>
                      <td data-label={si ? "ස්ථානය" : "Location"}>
                        {String(dept.location || "—")}
                      </td>
                      <td data-label={si ? "අංශ ප්‍රධානියා" : "Head of department"}>
                        {String(dept.head_of_dept || "—")}
                      </td>
                      <td data-label={si ? "තත්ත්වය" : "Status"}>
                        <span
                          className={`mq-badge ${dept.is_active !== false ? "success" : ""}`}
                        >
                          {dept.is_active !== false
                            ? si
                              ? "සක්‍රීය"
                              : "Active"
                            : si
                              ? "අක්‍රීය"
                              : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
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
      <main className="staff-workspace flex-1 w-full bg-[var(--mq-surface)] dark:bg-[var(--mq-bg)] min-h-screen pb-12">
        <div className="px-6 md:px-10 lg:px-12 pt-6">
          {/* Page Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 mt-4">
            <div>
              <span className="mq-page-eyebrow">
                <ShieldCheck size={14} aria-hidden="true" />
                {t.account}
              </span>
              <h1 className="mq-page-title">
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
              <p className="mq-page-subtitle">
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
            {/* Collapsed height is reserved; the expanded list overlays the page. */}
            <div className="relative h-20 w-full md:w-[380px] shrink-0">
              <div className="absolute inset-x-0 top-0 z-30">
                <DashboardActivity />
              </div>
            </div>
          </header>

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
            <div className="p-12 text-center text-[var(--mq-muted)]">
              {si ? "සම්පත හමු නොවීය" : "Resource not found"}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
