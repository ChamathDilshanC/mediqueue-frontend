export const resources = [
  { key: "hospitals", label: "Hospitals", si: "රෝහල්" },
  { key: "branches", label: "Branches", si: "ශාඛා" },
  { key: "users", label: "Users", si: "පරිශීලකයන්" },
  { key: "memberships", label: "Memberships", si: "සාමාජිකත්ව" },
  { key: "departments", label: "Departments", si: "අංශ" },
  { key: "rooms", label: "Rooms", si: "කාමර" },
  { key: "wards", label: "Wards", si: "වෝඩ්" },
  { key: "beds", label: "Beds", si: "ඇඳන්" },
  { key: "ward-admissions", label: "Ward Admissions", si: "වෝඩ් ඇතුළත් කිරීම්" },
  { key: "doctors", label: "Doctors", si: "වෛද්‍යවරු" },
  { key: "schedules", label: "Schedules", si: "කාලසටහන්" },
  { key: "patients", label: "Patients", si: "රෝගීන්" },
  { key: "queues", label: "Queues", si: "පෝලිම්" },
  { key: "visits", label: "Visits", si: "රෝහල් පැමිණීම්" },
  { key: "appointments", label: "Appointments", si: "හමුවීම්" },
  { key: "audit-events", label: "Audit events", si: "විගණන සටහන්" },
] as const;
export type ResourceKey = (typeof resources)[number]["key"];

