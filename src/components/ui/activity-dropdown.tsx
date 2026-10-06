"use client";

import type React from "react";

import { useId, useState } from "react";
import {
  Award,
  Bell,
  Calendar,
  CheckSquare,
  ChevronUp,
  MessageCircle,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Activity {
  id: string | number;
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
  /** Optional emphasis for items that need someone to act. */
  tone?: "default" | "attention";
  onSelect?: () => void;
}

export const sampleActivities: Activity[] = [
  {
    id: 1,
    icon: <MessageCircle className="h-4 w-4" />,
    title: "New Message!",
    description: "Sarah sent you a message.",
    time: "Just Now",
  },
  {
    id: 2,
    icon: <Award className="h-4 w-4" />,
    title: "Level Up!",
    description: "You've unlocked a new achievement.",
    time: "2 min ago",
  },
  {
    id: 3,
    icon: <Calendar className="h-4 w-4" />,
    title: "Reminder: Meeting Today",
    description: "Your team meeting starts in 30 minutes.",
    time: "3 hour ago",
  },
  {
    id: 4,
    icon: <Tag className="h-4 w-4" />,
    title: "Special Offer!",
    description: "Save 20% off on subscription upgrade.",
    time: "12 hours ago",
  },
  {
    id: 5,
    icon: <CheckSquare className="h-4 w-4" />,
    title: "Task Assigned!",
    description: "A new task is awaiting your action.",
    time: "Yesterday",
  },
];

const ease = "ease-[cubic-bezier(0.4,0,0.2,1)]";

export function ActivityDropdown({
  activities = sampleActivities,
  title,
  subtitle = "What's happening around you",
  emptyLabel = "Nothing new right now.",
  className,
}: {
  activities?: Activity[];
  title?: string;
  subtitle?: string;
  emptyLabel?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const listId = useId();

  return (
    <div
      className={cn(
        "w-full max-w-md overflow-hidden select-none",
        "bg-white dark:bg-neutral-900",
        "shadow-xl shadow-black/10 dark:shadow-black/50",
        `transition-all duration-500 ${ease}`,
        isOpen ? "rounded-3xl" : "rounded-2xl",
        className,
      )}
    >
      {/* Header */}
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-4 p-4 text-left"
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 transition-colors duration-300 dark:bg-neutral-800">
          <Bell className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
        </div>
        <div className="flex-1 overflow-hidden">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
            {title ?? `${activities.length} New Activities`}
          </h3>
          <p
            className={cn(
              "text-sm text-neutral-500 dark:text-neutral-400",
              `transition-all duration-500 ${ease}`,
              isOpen ? "mt-0 max-h-0 opacity-0" : "mt-0.5 max-h-6 opacity-100",
            )}
          >
            {subtitle}
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center">
          <ChevronUp
            className={cn(
              `h-5 w-5 text-neutral-400 transition-transform duration-500 ${ease}`,
              isOpen ? "rotate-0" : "rotate-180",
            )}
          />
        </div>
      </button>

      {/* Activity List */}
      <div
        id={listId}
        className={cn(
          "grid",
          `transition-all duration-500 ${ease}`,
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
        inert={!isOpen}
      >
        <div className="overflow-hidden">
          <div className="px-2 pb-4">
            {activities.length === 0 ? (
              <p className="px-3 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                {emptyLabel}
              </p>
            ) : (
              <ul className="space-y-1">
                {activities.map((activity, index) => {
                  const content = (
                    <>
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300",
                          activity.tone === "attention"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                            : "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
                        )}
                      >
                        {activity.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                          {activity.title}
                        </h4>
                        <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                          {activity.description}
                        </p>
                      </div>
                      <span className="shrink-0 pt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                        {activity.time}
                      </span>
                    </>
                  );
                  const rowClass = cn(
                    "flex w-full items-start gap-3 rounded-xl p-3 text-left",
                    `transition-all duration-500 ${ease}`,
                    "hover:bg-neutral-100 dark:hover:bg-neutral-800/50",
                    isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                  );
                  const style = {
                    transitionDelay: isOpen ? `${index * 75}ms` : "0ms",
                  };
                  return (
                    <li key={activity.id}>
                      {activity.onSelect ? (
                        <button
                          type="button"
                          className={cn(rowClass, "cursor-pointer")}
                          style={style}
                          onClick={activity.onSelect}
                        >
                          {content}
                        </button>
                      ) : (
                        <div className={rowClass} style={style}>
                          {content}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
