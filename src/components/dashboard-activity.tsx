"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  CalendarClock,
  CalendarX,
  CheckSquare,
  UserCheck,
  Wallet,
} from "lucide-react";
import { useLanguage } from "./providers";
import { ActivityDropdown, type Activity } from "./ui/activity-dropdown";
import { DATA_UPDATED_EVENT } from "@/lib/data-sync";

type InboxItem = {
  id: string;
  patient_name: string;
  doctor: string;
  status: string;
  payment_status?: string;
  created_at: string;
};

const statusCopy: Record<string, { en: string; si: string; icon: ReactNode }> = {
  PENDING: { en: "New appointment request", si: "නව හමුවීම් ඉල්ලීමක්", icon: <CalendarClock className="h-4 w-4" /> },
  BOOKED: { en: "Appointment approved", si: "හමුවීම අනුමතයි", icon: <CalendarCheck className="h-4 w-4" /> },
  CHECKED_IN: { en: "Patient arrived", si: "රෝගියා පැමිණ ඇත", icon: <UserCheck className="h-4 w-4" /> },
  COMPLETED: { en: "Appointment completed", si: "හමුවීම අවසන්", icon: <CheckSquare className="h-4 w-4" /> },
  CANCELLED: { en: "Appointment cancelled", si: "හමුවීම අවලංගුයි", icon: <CalendarX className="h-4 w-4" /> },
  REJECTED: { en: "Appointment rejected", si: "හමුවීම ප්‍රතික්ෂේපයි", icon: <CalendarX className="h-4 w-4" /> },
  NO_SHOW: { en: "Patient did not attend", si: "රෝගියා පැමිණ නැත", icon: <CalendarX className="h-4 w-4" /> },
};
const paymentCopy: Record<string, { en: string; si: string }> = {
  REFUND_REQUIRED: { en: "Refund required", si: "මුදල් ආපසු දිය යුතුයි" },
  REVIEW_REQUIRED: { en: "Payment needs review", si: "ගෙවීම පරීක්ෂා කළ යුතුයි" },
};

function relativeTime(value: string, locale: string) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  if (!Number.isFinite(seconds)) return "";
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units)
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  return format.format(0, "minute");
}

/** Recent appointment and payment activity for the selected branch. */
export function DashboardActivity() {
  const { language } = useLanguage();
  const si = language === "si";
  const router = useRouter();
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    window.addEventListener(DATA_UPDATED_EVENT, refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => {
      window.removeEventListener(DATA_UPDATED_EVENT, refresh);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/backend/appointment-inbox?limit=6", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const value = await response.json();
        if (!response.ok || !Array.isArray(value.items)) throw Error("unavailable");
        setItems(value.items);
        setFailed(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [version]);

  const open = () => router.push("/dashboard?resource=appointments");
  const locale = si ? "si-LK" : "en-GB";
  const activities: Activity[] = (items ?? []).map((item) => {
    const payment = item.payment_status ? paymentCopy[item.payment_status] : undefined;
    const status = statusCopy[item.status];
    return {
      id: item.id,
      icon: payment ? <Wallet className="h-4 w-4" /> : status?.icon,
      tone: payment ? "attention" : "default",
      title: payment ? (si ? payment.si : payment.en) : status ? (si ? status.si : status.en) : item.status,
      description: `${item.patient_name} · ${item.doctor}`,
      time: relativeTime(item.created_at, locale),
      onSelect: open,
    };
  });
  const attention = activities.filter((a) => a.tone === "attention").length;

  return (
    <ActivityDropdown
      activities={activities}
      title={
        items === null && !failed
          ? si
            ? "ක්‍රියාකාරකම් පූරණය වෙමින්..."
            : "Loading activity..."
          : si
            ? `මෑත ක්‍රියාකාරකම් ${activities.length}`
            : `${activities.length} recent ${activities.length === 1 ? "activity" : "activities"}`
      }
      subtitle={
        failed
          ? si
            ? "ක්‍රියාකාරකම් පූරණය කළ නොහැක"
            : "Activity is unavailable right now"
          : attention
            ? si
              ? `ගෙවීම් ${attention}ක් ඔබේ ක්‍රියාව බලාපොරොත්තුවෙන්`
              : `${attention} payment${attention === 1 ? "" : "s"} need your action`
            : si
              ? "හමුවීම් සහ ගෙවීම් යාවත්කාලීන"
              : "Appointment and payment updates"
      }
      emptyLabel={si ? "නව ක්‍රියාකාරකම් නැත." : "No recent activity."}
    />
  );
}
