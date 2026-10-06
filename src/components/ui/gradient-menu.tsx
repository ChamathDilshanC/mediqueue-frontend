"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import {
  IoCalendarOutline,
  IoChatbubblesOutline,
  IoGridOutline,
  IoHeartOutline,
  IoPeopleOutline,
} from "react-icons/io5";

export type GradientMenuItem = {
  title: string;
  href: string;
  icon: ReactNode;
  gradientFrom: string;
  gradientTo: string;
};

const menuItems: GradientMenuItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: <IoGridOutline />,
    gradientFrom: "#0065f8",
    gradientTo: "#0065f8",
  },
  {
    title: "Patients",
    href: "/dashboard?resource=patients",
    icon: <IoPeopleOutline />,
    gradientFrom: "#4300ff",
    gradientTo: "#4300ff",
  },
  {
    title: "Appointments",
    href: "/dashboard?resource=appointments",
    icon: <IoCalendarOutline />,
    gradientFrom: "#0065f8",
    gradientTo: "#0065f8",
  },
  {
    title: "Queues",
    href: "/dashboard?resource=queues",
    icon: <IoChatbubblesOutline />,
    gradientFrom: "#0065f8",
    gradientTo: "#4300ff",
  },
  {
    title: "Audit",
    href: "/dashboard?resource=audit-events",
    icon: <IoHeartOutline />,
    gradientFrom: "#0065f8",
    gradientTo: "#0065f8",
  },
];

export default function GradientMenu({
  items = menuItems,
  className,
}: {
  items?: GradientMenuItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Dashboard navigation"
      className={`gradient-menu${className ? ` ${className}` : ""}`}
    >
      <ul>
        {items.map(({ title, href, icon, gradientFrom, gradientTo }) => (
          <li
            key={href}
            style={
              {
                "--gradient-from": gradientFrom,
                "--gradient-to": gradientTo,
              } as CSSProperties
            }
          >
            <Link href={href} aria-label={title}>
              <span className="gradient-menu-background" aria-hidden />
              <span className="gradient-menu-glow" aria-hidden />
              <span className="gradient-menu-icon" aria-hidden>
                {icon}
              </span>
              <span className="gradient-menu-title">{title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
