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
  UsersRound,
  X,
} from "lucide-react";
import { useLanguage } from "./providers";
import { resources } from "@/lib/dashboard-resources";
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
  const selected = params.get("resource") ?? "hospitals";
  const resource = resources.some(({ key }) => key === selected)
    ? selected
    : "hospitals";
  useEffect(() => {
    if (!workspace) return;
    const controller = new AbortController();
    void fetch("/api/auth/me", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((value) => {
        if (value) setProfile(value as Profile);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [workspace]);
  const hasAdminMembership = profile?.memberships?.some(
    (membership) => membership.active && membership.role === "admin",
  );
  const userResources = new Set([
    "hospitals",
    "branches",
    "departments",
    "rooms",
    "doctors",
    "schedules",
    "patients",
    "queues",
    "visits",
    "appointments",
  ]);
  const visibleResources = resources.filter(
    ({ key }) =>
      !profile?.memberships?.length ||
      hasAdminMembership ||
      userResources.has(key),
  );
  const publicLinks = [
    { title: t.home, href: "/", icon: Home },
    { title: t.how, href: "/#how-it-works", icon: HeartPulse },
    { title: t.features, href: "/#features", icon: Sparkles },
    { title: t.faq, href: "/#faq", icon: CircleHelp },
  ];
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
          <AnimatedSidebarGroup>
            <AnimatedSidebarGroupLabel>
              {workspace
                ? language === "si"
                  ? "කළමනාකරණය"
                  : "Workspace"
                : language === "si"
                  ? "MediQueue වෙත සාදරයෙන්"
                  : "Explore MediQueue"}
            </AnimatedSidebarGroupLabel>
            <AnimatedSidebarMenu>
              {workspace
                ? visibleResources.map(({ key, label, si }) => {
                    const Icon =
                      icons[resources.findIndex((item) => item.key === key)];
                    return (
                      <AnimatedSidebarMenuItem key={key}>
                        <AnimatedSidebarMenuButton
                          href={`/dashboard?resource=${key}`}
                          icon={<Icon size={19} />}
                          isActive={
                            pathname === "/dashboard" && resource === key
                          }
                        >
                          {language === "si" ? si : label}
                        </AnimatedSidebarMenuButton>
                      </AnimatedSidebarMenuItem>
                    );
                  })
                : publicLinks.map(({ title, href, icon: Icon }) => (
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
        </nav>
      </AnimatedSidebarContent>
      <AnimatedSidebarFooter>
        <AnimatedSidebarMenu>
          {(workspace
            ? [
                { title: t.account, href: "/account", icon: UserRound },
                { title: t.backToDashboard || "Dashboard", href: "/dashboard", icon: LayoutGrid },
                {
                  title: t.registerOrganization,
                  href: "/organization/register",
                  icon: Building2,
                },
              ]
            : [
                { title: t.login, href: "/login", icon: LogIn },
                { title: t.create, href: "/register", icon: ArrowUpRight },
              ]
          ).map(({ title, href, icon: Icon }) => (
            <AnimatedSidebarMenuItem key={href}>
              <AnimatedSidebarMenuButton
                href={href}
                icon={<Icon size={19} />}
                isActive={pathname === href}
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
