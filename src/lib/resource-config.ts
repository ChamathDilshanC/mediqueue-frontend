/**
 * Declarative field definitions for each backend resource.
 * The dashboard CRUD panel reads these to render forms, tables, and labels
 * in both English and Sinhala — zero hard-coded UI per resource.
 */

export type FieldType = "text" | "select" | "datetime" | "number" | "boolean" | "uuid-ref" | "readonly";

export interface FieldDef {
  key: string;
  en: string;
  si: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  /** For select fields */
  options?: { value: string; en: string; si: string }[];
  /** For uuid-ref fields: which resource endpoint to fetch options from */
  refResource?: string;
  /** Which field on the referenced resource to display as the label */
  refLabel?: string;
  /** Hide from table but show in forms */
  formOnly?: boolean;
  /** Hide from forms but show in table */
  tableOnly?: boolean;
  /** Show only in create form */
  createOnly?: boolean;
  /** Show only in edit form */
  editOnly?: boolean;
  /** Show in table */
  showInTable?: boolean;
  /** Max length for text inputs */
  maxLength?: number;
}

export interface ResourceConfig {
  key: string;
  endpoint: string;
  en: { singular: string; plural: string; description: string };
  si: { singular: string; plural: string; description: string };
  fields: FieldDef[];
  /** Fields that are part of POST/PUT body */
  inputFields: string[];
  /** Can records be created */
  canCreate: boolean;
  /** Can records be edited */
  canEdit: boolean;
  /** Can records be deleted */
  canDelete: boolean;
}

export const resourceConfigs: Record<string, ResourceConfig> = {
  hospitals: {
    key: "hospitals",
    endpoint: "hospitals",
    en: { singular: "Hospital", plural: "Hospitals", description: "Manage registered hospitals in the system." },
    si: { singular: "රෝහල", plural: "රෝහල්", description: "පද්ධතියේ ලියාපදිංචි රෝහල් කළමනාකරණය කරන්න." },
    fields: [
      { key: "name", en: "Name", si: "නම", type: "text", required: true, showInTable: true, maxLength: 200 },
      { key: "id", en: "ID", si: "හැඳුනුම්පත", type: "readonly", showInTable: false, tableOnly: true },
    ],
    inputFields: ["name"],
    canCreate: true, canEdit: true, canDelete: true,
  },

  branches: {
    key: "branches",
    endpoint: "branches",
    en: { singular: "Branch", plural: "Branches", description: "Manage hospital branch locations." },
    si: { singular: "ශාඛාව", plural: "ශාඛා", description: "රෝහල් ශාඛා ස්ථාන කළමනාකරණය කරන්න." },
    fields: [
      { key: "name", en: "Name", si: "නම", type: "text", required: true, showInTable: true, maxLength: 200 },
      { key: "timezone", en: "Timezone", si: "වේලා කලාපය", type: "text", required: true, showInTable: true, maxLength: 64, placeholder: "Asia/Colombo" },
      { key: "tenant_id", en: "Hospital", si: "රෝහල", type: "uuid-ref", required: true, showInTable: true, refResource: "hospitals", refLabel: "name", createOnly: true },
    ],
    inputFields: ["tenant_id", "name", "timezone"],
    canCreate: true, canEdit: true, canDelete: true,
  },

  departments: {
    key: "departments",
    endpoint: "departments",
    en: { singular: "Department", plural: "Departments", description: "Manage hospital departments, locations, HODs, and active status." },
    si: { singular: "අංශය", plural: "අංශ", description: "රෝහල් අංශ, පිහිටීම, අංශ ප්‍රධානී සහ සක්‍රිය තත්ත්වය කළමනාකරණය කරන්න." },
    fields: [
      { key: "name", en: "Department Name", si: "අංශයේ නම", type: "text", required: true, showInTable: true, maxLength: 200, placeholder: "e.g. Cardiology" },
      { key: "code", en: "Code", si: "සංකේතය", type: "text", showInTable: true, maxLength: 20, placeholder: "e.g. CARD" },
      { key: "location", en: "Location", si: "ස්ථානය", type: "text", showInTable: true, maxLength: 200, placeholder: "e.g. Building A, 2nd Floor" },
      { key: "head_of_dept", en: "Head of Dept", si: "අංශ ප්‍රධානියා", type: "text", showInTable: true, maxLength: 200, placeholder: "e.g. Dr. Perera" },
      { key: "description", en: "Description", si: "විස්තරය", type: "text", showInTable: false, maxLength: 500, placeholder: "Scope and details" },
      { key: "is_active", en: "Status", si: "තත්ත්වය", type: "boolean", showInTable: true },
      { key: "id", en: "ID", si: "හැඳුනුම්පත", type: "readonly", showInTable: false },
    ],
    inputFields: ["name", "code", "location", "head_of_dept", "description", "is_active"],
    canCreate: true, canEdit: true, canDelete: true,
  },

  rooms: {
    key: "rooms",
    endpoint: "rooms",
    en: { singular: "Room", plural: "Rooms", description: "Manage consultation and examination rooms by department." },
    si: { singular: "කාමරය", plural: "කාමර", description: "අංශය අනුව උපදේශන සහ පරීක්ෂණ කාමර කළමනාකරණය කරන්න." },
    fields: [
      { key: "name", en: "Name", si: "නම", type: "text", required: true, showInTable: true, maxLength: 120, placeholder: "e.g. Room 101" },
      { key: "department_id", en: "Department", si: "අංශය", type: "uuid-ref", required: false, showInTable: true, refResource: "departments", refLabel: "name" },
      { key: "id", en: "ID", si: "හැඳුනුම්පත", type: "readonly", showInTable: false },
    ],
    inputFields: ["name", "department_id"],
    canCreate: true, canEdit: true, canDelete: true,
  },

  doctors: {
    key: "doctors",
    endpoint: "doctors",
    en: { singular: "Doctor", plural: "Doctors", description: "Manage doctors and their specialties." },
    si: { singular: "වෛද්‍යවරයා", plural: "වෛද්‍යවරු", description: "වෛද්‍යවරුන් සහ ඔවුන්ගේ විශේෂතා කළමනාකරණය කරන්න." },
    fields: [
      { key: "name", en: "Name", si: "නම", type: "text", required: true, showInTable: true, maxLength: 200 },
      { key: "department_id", en: "Department", si: "අංශය", type: "uuid-ref", required: true, showInTable: true, refResource: "departments", refLabel: "name" },
      { key: "specialty", en: "Specialty", si: "විශේෂත්වය", type: "text", showInTable: true, maxLength: 200 },
    ],
    inputFields: ["name", "department_id", "specialty"],
    canCreate: true, canEdit: true, canDelete: true,
  },

  schedules: {
    key: "schedules",
    endpoint: "schedules",
    en: { singular: "Schedule", plural: "Schedules", description: "Manage doctor schedules and time slots." },
    si: { singular: "කාලසටහන", plural: "කාලසටහන්", description: "වෛද්‍ය කාලසටහන් සහ කාල පරාසයන් කළමනාකරණය කරන්න." },
    fields: [
      { key: "doctor_id", en: "Doctor", si: "වෛද්‍යවරයා", type: "uuid-ref", required: true, showInTable: true, refResource: "doctors", refLabel: "name" },
      { key: "room_id", en: "Room", si: "කාමරය", type: "uuid-ref", required: true, showInTable: true, refResource: "rooms", refLabel: "name" },
      { key: "starts_at", en: "Starts At", si: "ආරම්භය", type: "datetime", required: true, showInTable: true },
      { key: "ends_at", en: "Ends At", si: "අවසානය", type: "datetime", required: true, showInTable: true },
      { key: "capacity", en: "Capacity", si: "ධාරිතාව", type: "number", required: true, showInTable: true },
    ],
    inputFields: ["doctor_id", "room_id", "starts_at", "ends_at", "capacity"],
    canCreate: true, canEdit: true, canDelete: true,
  },

  patients: {
    key: "patients",
    endpoint: "patients",
    en: { singular: "Patient", plural: "Patients", description: "Manage patient records." },
    si: { singular: "රෝගියා", plural: "රෝගීන්", description: "රෝගී වාර්තා කළමනාකරණය කරන්න." },
    fields: [
      { key: "external_ref", en: "Reference ID", si: "යොමු අංකය", type: "text", required: true, showInTable: true, maxLength: 200 },
      { key: "id", en: "Patient ID", si: "රෝගී හැඳුනුම්පත", type: "readonly", showInTable: true },
    ],
    inputFields: ["external_ref"],
    canCreate: true, canEdit: true, canDelete: true,
  },

  queues: {
    key: "queues",
    endpoint: "queues",
    en: { singular: "Queue", plural: "Queues", description: "Manage live queues by department." },
    si: { singular: "පෝලිම", plural: "පෝලිම්", description: "අංශය අනුව සජීවී පෝලිම් කළමනාකරණය කරන්න." },
    fields: [
      { key: "name", en: "Name", si: "නම", type: "text", required: true, showInTable: true, maxLength: 120, placeholder: "e.g. OPD Queue" },
      { key: "department_id", en: "Department", si: "අංශය", type: "uuid-ref", required: false, showInTable: true, refResource: "departments", refLabel: "name" },
      { key: "timezone", en: "Timezone", si: "වේලා කලාපය", type: "readonly", showInTable: true },
      { key: "token_sequence", en: "Token Seq.", si: "ටෝකන් අනුපිළිවෙල", type: "readonly", showInTable: true },
    ],
    inputFields: ["name", "department_id"],
    canCreate: true, canEdit: true, canDelete: true,
  },

  visits: {
    key: "visits",
    endpoint: "visits",
    en: { singular: "Visit", plural: "Visits", description: "Track patient visits." },
    si: { singular: "පැමිණීම", plural: "රෝහල් පැමිණීම්", description: "රෝගී පැමිණීම් නිරීක්ෂණය කරන්න." },
    fields: [
      { key: "patient_id", en: "Patient", si: "රෝගියා", type: "uuid-ref", required: true, showInTable: true, refResource: "patients", refLabel: "external_ref" },
      { key: "id", en: "Visit ID", si: "පැමිණීම් හැඳුනුම්පත", type: "readonly", showInTable: true },
    ],
    inputFields: ["patient_id"],
    canCreate: true, canEdit: false, canDelete: false,
  },

  appointments: {
    key: "appointments",
    endpoint: "appointments",
    en: { singular: "Appointment", plural: "Appointments", description: "Manage appointment bookings." },
    si: { singular: "හමුවීම", plural: "හමුවීම්", description: "හමුවීම් වෙන්කිරීම් කළමනාකරණය කරන්න." },
    fields: [
      { key: "patient_id", en: "Patient", si: "රෝගියා", type: "uuid-ref", required: true, showInTable: true, refResource: "patients", refLabel: "external_ref" },
      { key: "schedule_id", en: "Schedule", si: "කාලසටහන", type: "uuid-ref", required: true, showInTable: true, refResource: "schedules", refLabel: "starts_at" },
      { key: "status", en: "Status", si: "තත්ත්වය", type: "readonly", showInTable: true },
      { key: "created_at", en: "Created", si: "සාදන ලද", type: "readonly", showInTable: true },
    ],
    inputFields: ["patient_id", "schedule_id"],
    canCreate: true, canEdit: false, canDelete: false,
  },

  users: {
    key: "users",
    endpoint: "users",
    en: { singular: "User", plural: "Users", description: "View system user accounts." },
    si: { singular: "පරිශීලකයා", plural: "පරිශීලකයන්", description: "පද්ධති පරිශීලක ගිණුම් බලන්න." },
    fields: [
      { key: "display_name", en: "Name", si: "නම", type: "readonly", showInTable: true },
      { key: "id", en: "User ID", si: "පරිශීලක හැඳුනුම්පත", type: "readonly", showInTable: true },
    ],
    inputFields: [],
    canCreate: false, canEdit: false, canDelete: false,
  },

  memberships: {
    key: "memberships",
    endpoint: "memberships",
    en: { singular: "Membership", plural: "Memberships", description: "Manage user access roles." },
    si: { singular: "සාමාජිකත්වය", plural: "සාමාජිකත්ව", description: "පරිශීලක ප්‍රවේශ භූමිකා කළමනාකරණය කරන්න." },
    fields: [
      { key: "user_id", en: "User", si: "පරිශීලකයා", type: "uuid-ref", required: true, showInTable: true, refResource: "users", refLabel: "display_name", createOnly: true },
      { key: "role", en: "Role", si: "භූමිකාව", type: "select", required: true, showInTable: true, options: [
        { value: "admin", en: "Administrator", si: "පරිපාලක" },
        { value: "staff", en: "Staff", si: "කාර්ය මණ්ඩලය" },
        { value: "reception", en: "Reception", si: "පිළිගැනීම" },
        { value: "doctor", en: "Doctor", si: "වෛද්‍ය" },
      ]},
      { key: "active", en: "Active", si: "සක්‍රිය", type: "boolean", showInTable: true, editOnly: true },
    ],
    inputFields: ["user_id", "role", "active"],
    canCreate: true, canEdit: true, canDelete: true,
  },

  "audit-events": {
    key: "audit-events",
    endpoint: "audit-events",
    en: { singular: "Audit Event", plural: "Audit Events", description: "View system audit trail." },
    si: { singular: "විගණන සටහන", plural: "විගණන සටහන්", description: "පද්ධති විගණන මාර්ගය බලන්න." },
    fields: [
      { key: "action", en: "Action", si: "ක්‍රියාව", type: "readonly", showInTable: true },
      { key: "actor_id", en: "Actor", si: "ක්‍රියාකරු", type: "readonly", showInTable: true },
      { key: "entity_id", en: "Entity", si: "අයිතමය", type: "readonly", showInTable: true },
      { key: "created_at", en: "Time", si: "කාලය", type: "readonly", showInTable: true },
      { key: "payload", en: "Details", si: "විස්තර", type: "readonly", showInTable: false },
    ],
    inputFields: [],
    canCreate: false, canEdit: false, canDelete: false,
  },
};
