"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CalendarClock,
  CircleHelp,
  ClipboardList,
  DoorOpen,
  HeartPulse,
  Home,
  Hospital,
  LayoutGrid,
  LogIn,
  PanelLeftClose,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  UserCheck,
  UsersRound,
  X,
} from "lucide-react";
import { useLanguage } from "./providers";
import { resources } from "@/lib/dashboard-resources";
import { activeMembership, canRead } from "@/lib/permissions";
import type { Profile } from "@/lib/auth-contract";
import {
  AnimatedSidebar,
  AnimatedSidebarClose,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupLabel,
  AnimatedSidebarHeader,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuButton,
  AnimatedSidebarMenuItem,
  useAnimatedSidebar,
} from "./motion/animated-sidebar";

const icons = [
  Hospital,
  Building2,
  UsersRound,
  ShieldCheck,
  LayoutGrid,
  DoorOpen,
  Stethoscope,
  CalendarClock,
  UserRound,
  ClipboardList,
  HeartPulse,
  CalendarDays,
  Activity,
];

export function AppSidebar() {
  const pathname = usePathname();
  const params = useSearchParams();
  const { t, language } = useLanguage();
  const { state, isMobile } = useAnimatedSidebar();
  const [profile, setProfile] = useState<Profile | null>(null);
  const workspace = pathname === "/dashboard" || pathname === "/account";
  const selected = params.get("resource");
  const resource =
    selected && resources.some(({ key }) => key === selected)
      ? selected
      : selected === null
        ? "overview"
        : "hospitals";
  useEffect(() => {
    if (!workspace) return;
    const controller = new AbortController();
    void fetch("/api/auth/me", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((value) => {
        if (value) {
          setProfile(value as Profile);
          if (value.memberships && value.memberships.length > 0) {
            const activeMem =
              value.memberships.find((m: { active?: boolean }) => m.active) ||
              value.memberships[0];
            if (
              activeMem?.tenant_id &&
              !document.cookie.includes("active_tenant_id=")
            ) {
              document.cookie = `active_tenant_id=${activeMem.tenant_id}; path=/; max-age=86400`;
            }
            if (
              activeMem?.branch_id &&
              !document.cookie.includes("active_branch_id=")
            ) {
              document.cookie = `active_branch_id=${activeMem.branch_id}; path=/; max-age=86400`;
            }
          }
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [workspace]);
  const membership = profile ? activeMembership(profile) : undefined;
  const visibleResources = resources.filter(
    ({ key }) => membership && canRead(key, membership.role),
  );
  const publicLinks = [
    { title: t.home, href: "/", icon: Home },
    { title: t.how, href: "/#how-it-works", icon: HeartPulse },
    { title: t.features, href: "/#features", icon: Sparkles },
    { title: t.faq, href: "/#faq", icon: CircleHelp },
  ];
  if (
    pathname.startsWith("/patient") ||
    (pathname === "/account" && !membership)
  )
    return null;
  return (
    <AnimatedSidebar
      ariaLabel={workspace ? "Workspace navigation" : "Mobile navigation"}
      className={`app-sidebar ${workspace ? "" : "public-sidebar"}`}
      panelClassName="app-sidebar-panel"
    >
      <AnimatedSidebarHeader className="app-sidebar-header">
        <Link href="/" className="sidebar-brand" aria-label="MediQueue home">
          <Image src="/brand/logo.png" alt="" width={32} height={32} />
          {(isMobile || state === "expanded") && (
            <span>
              MediQueue<span className="brand-dot">.</span>
            </span>
          )}
        </Link>
        {(isMobile || state === "expanded") && (
          <AnimatedSidebarClose aria-label={t.close} className="sidebar-close">
            {isMobile ? <X size={18} /> : <PanelLeftClose size={18} />}
          </AnimatedSidebarClose>
        )}
      </AnimatedSidebarHeader>
      <AnimatedSidebarContent>
        <nav
          id="mobile-navigation"
          aria-label={workspace ? "Workspace" : "Site navigation"}
        >
          {workspace ? (
            <div className="flex flex-col gap-6 mt-4">
              {[
                {
                  title: "Overview",
                  items: [
                    {
                      key: "overview",
                      label: "Dashboard",
                      si: "ප්‍රධාන පුවරුව",
                      icon: LayoutGrid,
                    },
                    {
                      key: "reports",
                      label: "Reports",
                      si: "වාර්තා",
                      icon: ClipboardList,
                    },
                  ],
                },
                {
                  title: "Hospital Management",
                  items: [
                    {
                      key: "hospitals",
                      label: "Hospitals",
                      si: "රෝහල්",
                      icon: Hospital,
                    },
                    {
                      key: "branches",
                      label: "Branches",
                      si: "ශාඛා",
                      icon: Building2,
                    },
                    {
                      key: "departments",
                      label: "Departments",
                      si: "අංශ",
                      icon: DoorOpen,
                    },
                    {
                      key: "rooms",
                      label: "Rooms",
                      si: "කාමර",
                      icon: DoorOpen,
                    },
                  ],
                },
                {
                  title: "Ward & Bed Management",
                  items: [
                    {
                      key: "bed-board",
                      label: "Bed board",
                      si: "ඇඳන් පුවරුව",
                      icon: LayoutGrid,
                    },
                    {
                      key: "wards",
                      label: "Wards",
                      si: "වෝඩ්",
                      icon: Building2,
                    },
                    {
                      key: "beds",
                      label: "Beds",
                      si: "ඇඳන්",
                      icon: LayoutGrid,
                    },
                    {
                      key: "ward-admissions",
                      label: "Ward Admissions",
                      si: "වෝඩ් ඇතුළත් කිරීම්",
                      icon: HeartPulse,
                    },
                  ],
                },
                {
                  title: "Clinical Operations",
                  items: [
                    {
                      key: "doctors",
                      label: "Doctors",
                      si: "වෛද්‍යවරු",
                      icon: Stethoscope,
                    },
                    {
                      key: "schedules",
                      label: "Schedules",
                      si: "කාලසටහන්",
                      icon: CalendarClock,
                    },
                    {
                      key: "patients",
                      label: "Patients",
                      si: "රෝගීන්",
                      icon: UserRound,
                    },
                    {
                      key: "appointments",
                      label: "Appointments",
                      si: "හමුවීම්",
                      icon: CalendarDays,
                    },
                  ],
                },
                {
                  title: "Care & Administration",
                  items: resources
                    .filter((r) =>
                      [
                        "clinical-records",
                        "prescriptions",
                        "lab-orders",
                        "invoices",
                        "inventory",
                        "staff-directory",
                      ].includes(r.key),
                    )
                    .map((r) => ({ ...r, icon: ClipboardList })),
                },
                {
                  title: "Workforce Operations",
                  items: [
                    { key: "nurses", label: "Nurses", si: "හෙදියන්", icon: Stethoscope },
                    { key: "attendants", label: "Attendants", si: "උපස්ථායකයන්", icon: UserRound },
                    { key: "staff-shifts", label: "Staff shifts", si: "කාර්ය මණ්ඩල මුර", icon: CalendarClock },
                    { key: "staff-attendance", label: "Staff attendance", si: "කාර්ය මණ්ඩල පැමිණීම", icon: UserCheck },
                    { key: "ward-tasks", label: "Ward tasks", si: "වාට්ටු කාර්යයන්", icon: ClipboardList },
                  ],
                },
                {
                  title: "Queue Operations",
                  items: [
                    {
                      key: "queues",
                      label: "Queues",
                      si: "පෝලිම්",
                      icon: Activity,
                    },
                    {
                      key: "visits",
                      label: "Visits",
                      si: "රෝහල් පැමිණීම්",
                      icon: ClipboardList,
                    },
                  ],
                },
                {
                  title: "Administration",
                  items: [
                    {
                      key: "users",
                      label: "Users",
                      si: "පරිශීලකයන්",
                      icon: UsersRound,
                    },
                    {
                      key: "memberships",
                      label: "Memberships",
                      si: "සාමාජිකත්ව",
                      icon: UsersRound,
                    },
                  ],
                },
                {
                  title: "System",
                  items: [
                    {
                      key: "audit-events",
                      label: "Audit events",
                      si: "විගණන සටහන්",
                      icon: ShieldCheck,
                    },
                  ],
                },
              ].map((group, idx) => {
                const availableItems = group.items.filter(
                  (item) =>
                    item.key === "overview" ||
                    visibleResources.some((r) => r.key === item.key),
                );
                if (availableItems.length === 0) return null;

                return (
                  <AnimatedSidebarGroup key={idx}>
                    <AnimatedSidebarGroupLabel className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2 px-4">
                      {group.title}
                    </AnimatedSidebarGroupLabel>
                    <AnimatedSidebarMenu>
                      {availableItems.map(({ key, label, si, icon: Icon }) => (
                        <AnimatedSidebarMenuItem key={key}>
                          <AnimatedSidebarMenuButton
                            href={`/dashboard${key === "overview" ? "" : `?resource=${key}`}`}
                            icon={<Icon size={18} className="text-gray-500" />}
                            isActive={
                              (pathname === "/dashboard" && resource === key) ||
                              (pathname === "/dashboard" &&
                                key === "overview" &&
                                !params.get("resource"))
                            }
                            className="text-[13px] font-medium"
                          >
                            {language === "si" ? si : label}
                          </AnimatedSidebarMenuButton>
                        </AnimatedSidebarMenuItem>
                      ))}
                    </AnimatedSidebarMenu>
                  </AnimatedSidebarGroup>
                );
              })}
            </div>
          ) : (
            <AnimatedSidebarGroup>
              <AnimatedSidebarGroupLabel>
                {language === "si"
                  ? "MediQueue වෙත සාදරයෙන්"
                  : "Explore MediQueue"}
              </AnimatedSidebarGroupLabel>
              <AnimatedSidebarMenu>
                {publicLinks.map(({ title, href, icon: Icon }) => (
                  <AnimatedSidebarMenuItem key={href}>
                    <AnimatedSidebarMenuButton
                      href={href}
                      icon={<Icon size={19} />}
                    >
                      {title}
                    </AnimatedSidebarMenuButton>
                  </AnimatedSidebarMenuItem>
                ))}
              </AnimatedSidebarMenu>
            </AnimatedSidebarGroup>
          )}
        </nav>
      </AnimatedSidebarContent>
      <AnimatedSidebarFooter>
        <AnimatedSidebarMenu>
          {(workspace
            ? [
                { title: t.account, href: "/account", icon: UserRound },
                {
                  title: language === "si" ? "රෝගී සේවා" : "Patient portal",
                  href: "/patient",
                  icon: HeartPulse,
                },
                {
                  title: t.backToDashboard || "Dashboard",
                  href: "/dashboard",
                  icon: LayoutGrid,
                },
                {
                  title: t.registerOrganization,
                  href: "/organization/register",
                  icon: Building2,
                },
              ]
            : [
                {
                  title: language === "si" ? "රෝගී පිවිසුම" : "Patient sign in",
                  href: "/patient/login",
                  icon: HeartPulse,
                },
                { title: t.login, href: "/login", icon: LogIn },
                { title: t.create, href: "/register", icon: ArrowUpRight },
              ]
          ).map(({ title, href, icon: Icon }) => (
            <AnimatedSidebarMenuItem key={href}>
              <AnimatedSidebarMenuButton
                href={href}
                icon={<Icon size={19} />}
                // The shared highlight can mark only one item: inside the workspace,
                // the resource tabs above own it, never the footer's dashboard link.
                isActive={pathname === href && !(workspace && href === "/dashboard")}
              >
                {title}
              </AnimatedSidebarMenuButton>
            </AnimatedSidebarMenuItem>
          ))}
        </AnimatedSidebarMenu>
      </AnimatedSidebarFooter>
    </AnimatedSidebar>
  );
}
