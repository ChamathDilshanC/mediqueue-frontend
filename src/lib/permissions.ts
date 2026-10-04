import type { Profile } from "./auth-contract";
const managementRead: Record<string, string[]> = {
  "clinical-records": ["admin", "doctor"],
  prescriptions: ["admin", "doctor", "staff"],
  "lab-orders": ["admin", "doctor", "staff"],
  invoices: ["admin", "reception"],
  inventory: ["admin", "staff"],
  "staff-directory": ["admin"],
  users: ["admin"],
  memberships: ["admin"],
  "audit-events": ["admin"],
};
const writes: Record<string, string[]> = {
  "clinical-records": ["admin", "doctor"],
  prescriptions: ["admin", "doctor", "staff"],
  "lab-orders": ["admin", "doctor", "staff"],
  invoices: ["admin", "reception"],
  inventory: ["admin", "staff"],
  "staff-directory": ["admin"],
  patients: ["admin", "staff", "reception"],
  visits: ["admin", "staff", "reception"],
  appointments: ["admin", "staff", "reception"],
  "ward-admissions": ["admin", "staff", "reception"],
};
export function activeMembership(profile: Profile) {
  const branch =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((c) => c.startsWith("active_branch_id="))
          ?.split("=")[1]
      : undefined;
  return (
    profile.memberships.find((m) => m.active && m.branch_id === branch) ??
    profile.memberships.find((m) => m.active)
  );
}
export function canRead(resource: string, role: string) {
  return (
    managementRead[resource] ?? ["admin", "doctor", "staff", "reception"]
  ).includes(role);
}
export function canWrite(resource: string, role: string) {
  return (writes[resource] ?? ["admin"]).includes(role);
}
