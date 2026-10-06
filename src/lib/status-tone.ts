/** Map record states to the badge tones of the clinical design system. */
export type Tone = "success" | "warning" | "danger" | "info" | "accent" | "neutral";

const tones: Record<string, Tone> = {
  ACTIVE: "success",
  AVAILABLE: "success",
  BOOKED: "success",
  CHECKED_IN: "success",
  COMPLETED: "success",
  VERIFIED: "success",
  PAID: "success",
  PRESENT: "success",
  DISPENSED: "success",
  RELEASED: "success",
  SIGNED: "success",
  verified: "success",
  PENDING: "warning",
  pending_review: "warning",
  WAITING: "warning",
  ASSIGNED: "warning",
  IN_PROGRESS: "info",
  SCHEDULED: "info",
  ORDERED: "info",
  COLLECTED: "info",
  PRESCRIBED: "info",
  RESERVED: "info",
  CLEANING: "info",
  LATE: "warning",
  LEAVE: "info",
  ON_LEAVE: "info",
  ADMITTED: "accent",
  TRANSFERRED: "info",
  DISCHARGED: "neutral",
  MAINTENANCE: "warning",
  OCCUPIED: "accent",
  INACTIVE: "neutral",
  ARCHIVED: "neutral",
  CANCELLED: "danger",
  REJECTED: "danger",
  rejected: "danger",
  NO_SHOW: "danger",
  ABSENT: "danger",
  DECEASED: "neutral",
  URGENT: "danger",
};

export function statusTone(value: unknown): Tone {
  return tones[String(value ?? "")] ?? "neutral";
}

export function statusLabel(value: unknown) {
  const text = String(value ?? "").replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
