"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  Building2,
  CalendarClock,
  ClipboardList,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import { useLanguage } from "./providers";
import { SiteHeader } from "./site-header";
import { ResourcePanel } from "./resource-panel";
import { resources, type ResourceKey } from "@/lib/dashboard-resources";
import { resourceConfigs } from "@/lib/resource-config";

type Row = Record<string, unknown>;

/* ─────────────────── Overview Dashboard ─────────────────── */

function OverviewDashboard() {
  const { language } = useLanguage();
  const router = useRouter();

  // Live stats from backend
  const [stats, setStats] = useState({
    doctors: 0,
    patients: 0,
    queues: 0,
    appointments: 0,
    loading: true,
  });
  const [recentAppointments, setRecentAppointments] = useState<Row[]>([]);
  const [recentDoctors, setRecentDoctors] = useState<Row[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    async function load() {
      try {
        const [doctorsRes, patientsRes, queuesRes, appointmentsRes] =
          await Promise.allSettled([
            fetch("/api/backend/doctors?limit=200", {
              cache: "no-store",
              signal,
            }),
            fetch("/api/backend/patients?limit=200", {
              cache: "no-store",
              signal,
            }),
            fetch("/api/backend/queues?limit=200", {
              cache: "no-store",
              signal,
            }),
            fetch("/api/backend/appointments?limit=10", {
              cache: "no-store",
              signal,
            }),
          ]);

        const doctorsData =
          doctorsRes.status === "fulfilled" && doctorsRes.value.ok
            ? await doctorsRes.value.json()
            : [];
        const patientsData =
          patientsRes.status === "fulfilled" && patientsRes.value.ok
            ? await patientsRes.value.json()
            : [];
        const queuesData =
          queuesRes.status === "fulfilled" && queuesRes.value.ok
            ? await queuesRes.value.json()
            : [];
        const appointmentsData =
          appointmentsRes.status === "fulfilled" &&
          appointmentsRes.value.ok
            ? await appointmentsRes.value.json()
            : [];

        setStats({
          doctors: Array.isArray(doctorsData) ? doctorsData.length : 0,
          patients: Array.isArray(patientsData) ? patientsData.length : 0,
          queues: Array.isArray(queuesData) ? queuesData.length : 0,
          appointments: Array.isArray(appointmentsData)
            ? appointmentsData.length
            : 0,
          loading: false,
        });

        if (Array.isArray(appointmentsData))
          setRecentAppointments(appointmentsData.slice(0, 5));
        if (Array.isArray(doctorsData))
          setRecentDoctors(doctorsData.slice(0, 5));
      } catch {
        setStats((prev) => ({ ...prev, loading: false }));
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  const si = language === "si";

  const cards = [
    {
      label: si ? "වෛද්‍යවරු" : "Doctors",
      value: stats.doctors,
      icon: <Stethoscope size={18} />,
      color: "bg-blue-50 text-blue-600",
      gradient: "from-blue-50",
    },
    {
      label: si ? "රෝගීන්" : "Patients",
      value: stats.patients,
      icon: <Users size={18} />,
      color: "bg-green-50 text-green-600",
      gradient: "from-green-50",
    },
    {
      label: si ? "සජීවී පෝලිම්" : "Active Queues",
      value: stats.queues,
      icon: <Activity size={18} />,
      color: "bg-amber-50 text-amber-600",
      gradient: "from-amber-50",
    },
    {
      label: si ? "හමුවීම්" : "Appointments",
      value: stats.appointments,
      icon: <CalendarClock size={18} />,
      color: "bg-purple-50 text-purple-600",
      gradient: "from-purple-50",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex flex-col p-5 bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">
                {card.label}
              </span>
              <div className={`p-2 rounded-lg ${card.color}`}>
                {card.icon}
              </div>
            </div>
            {stats.loading ? (
              <Loader2 size={24} className="animate-spin text-gray-300" />
            ) : (
              <strong className="text-3xl font-semibold text-gray-900 mb-1">
                {card.value}
              </strong>
            )}
            <small className="text-xs text-gray-400 font-medium">
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
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-50 bg-[#fafcfa] flex items-center justify-between">
            <h3 className="font-bold text-gray-900">
              {si ? "මෑත හමුවීම්" : "Recent Appointments"}
            </h3>
            <button
              onClick={() =>
                router.push("/dashboard?resource=appointments")
              }
              className="text-xs text-[#76aa32] font-semibold hover:underline"
            >
              {si ? "සියල්ල බලන්න →" : "View all →"}
            </button>
          </div>
          <div className="p-0">
            {recentAppointments.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                {si
                  ? "හමුවීම් හමු නොවීය"
                  : "No appointments found"}
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
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
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-gray-900">
                        <span className="text-xs text-gray-500 font-mono">
                          {String(apt.patient_id ?? "").slice(0, 8)}…
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            String(apt.status) === "BOOKED"
                              ? "bg-blue-50 text-blue-600"
                              : String(apt.status) === "CHECKED_IN"
                                ? "bg-amber-50 text-amber-600"
                                : String(apt.status) === "COMPLETED"
                                  ? "bg-green-50 text-green-600"
                                  : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {String(apt.status ?? "").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-500 text-xs">
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
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-50 bg-[#fafcfa] flex items-center justify-between">
            <h3 className="font-bold text-gray-900">
              {si ? "වෛද්‍යවරු" : "Doctors"}
            </h3>
            <button
              onClick={() =>
                router.push("/dashboard?resource=doctors")
              }
              className="text-xs text-[#76aa32] font-semibold hover:underline"
            >
              {si ? "සියල්ල බලන්න →" : "View all →"}
            </button>
          </div>
          <div className="p-0">
            {recentDoctors.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                {si ? "වෛද්‍යවරු හමු නොවීය" : "No doctors found"}
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
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
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-gray-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {String(doc.name ?? "?")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                        {String(doc.name ?? "—")}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-500">
                        {String(doc.specialty ?? "—") || "—"}
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

  return (
    <>
      <SiteHeader simple />
      <main className="flex-1 w-full bg-[#f8f9fa] min-h-screen pb-12">
        <div className="px-6 md:px-10 lg:px-12 pt-6">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 mt-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#e2ead8] rounded-full text-xs font-medium text-[#61714d] mb-4 shadow-sm">
                <ShieldCheck size={14} className="text-[#76aa32]" />
                {t.account}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-2">
                {resource === "overview"
                  ? si
                    ? "ප්‍රධාන පුවරුව"
                    : "Operations Dashboard"
                  : si
                    ? resourceConfigs[resource]?.si.plural ??
                      "ප්‍රධාන පුවරුව"
                    : resourceConfigs[resource]?.en.plural ?? "Dashboard"}
              </h1>
              <p className="text-gray-500 text-sm md:text-base">
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
          {resource === "overview" ? (
            <OverviewDashboard />
          ) : resourceConfigs[resource] ? (
            <ResourcePanel
              key={resource}
              config={resourceConfigs[resource]}
            />
          ) : (
            <div className="p-12 text-center text-gray-400">
              {si ? "සම්පත හමු නොවීය" : "Resource not found"}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
