"use client";

import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import type { ReactNode } from "react";

export type DashboardSidebarItem = {
  title: string;
  href: string;
  icon?: ReactNode;
};

export default function DashboardSidebar({
  open,
  items,
  onClose,
  loginHref,
  loginLabel,
  actionHref,
  actionLabel,
}: {
  open: boolean;
  items: DashboardSidebarItem[];
  onClose: () => void;
  loginHref?: string;
  loginLabel?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  if (!open) return null;
  return (
    <div className="dashboard-sidebar-shell">
      <button
        className="dashboard-sidebar-backdrop"
        aria-label="Close navigation"
        onClick={onClose}
      />
      <aside className="dashboard-sidebar" aria-label="Mobile navigation">
        <div className="dashboard-sidebar-header">
          <strong>
            MediQueue<span className="brand-dot">.</span>
          </strong>
          <button
            className="icon-button"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <nav onClick={onClose}>
          {items.map(({ title, href, icon }) => (
            <Link key={href} href={href}>
              {icon}
              <span>{title}</span>
            </Link>
          ))}
          {loginHref && loginLabel ? (
            <Link href={loginHref}>{loginLabel}</Link>
          ) : null}
          {actionHref && actionLabel ? (
            <Link className="button primary" href={actionHref}>
              {actionLabel}
              <ArrowUpRight size={16} />
            </Link>
          ) : null}
        </nav>
      </aside>
    </div>
  );
}
