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
  placeholderSi?: string;
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
      { key: "code", en: "Code", si: "සංකේතය", type: "text", showInTable: true, maxLength: 20, placeholder: "Auto-generated (e.g. DEPT-01)", placeholderSi: "ස්වයංක්‍රීයව සෑදේ (උදා. DEPT-01)" },
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

  wards: {
    key: "wards",
    endpoint: "wards",
    en: { singular: "Ward", plural: "Wards", description: "Manage hospital wards, capacities, floor locations, and departments." },
    si: { singular: "වෝඩ් එක", plural: "වෝඩ්", description: "රෝහල් වෝඩ්, ධාරිතාව, තට්ටු පිහිටීම සහ අංශ කළමනාකරණය කරන්න." },
    fields: [
      { key: "name", en: "Ward Name", si: "වෝඩ් නම", type: "text", required: true, showInTable: true, maxLength: 200, placeholder: "e.g. General Ward A" },
      { key: "ward_code", en: "Ward Code", si: "වෝඩ් සංකේතය", type: "text", required: false, showInTable: true, maxLength: 50, placeholder: "Auto-generated (e.g. WARD-001)", placeholderSi: "ස්වයංක්‍රීයව සෑදේ (උදා. WARD-001)" },
      { key: "department_id", en: "Department", si: "අංශය", type: "uuid-ref", required: true, showInTable: true, refResource: "departments", refLabel: "name" },
      { key: "ward_type", en: "Ward Type", si: "වෝඩ් වර්ගය", type: "select", required: true, showInTable: true, options: [
        { value: "General", en: "General", si: "සාමාන්‍ය" },
        { value: "ICU", en: "ICU", si: "අති දැඩි සත්කාර (ICU)" },
        { value: "Pediatric", en: "Pediatric", si: "ළමා" },
        { value: "Maternity", en: "Maternity", si: "මාතෘ" },
      ]},
      { key: "floor", en: "Floor", si: "තට්ටුව", type: "text", showInTable: true, maxLength: 50, placeholder: "e.g. 2nd Floor" },
      { key: "building", en: "Building / Wing", si: "ගොඩනැගිල්ල", type: "text", showInTable: false, maxLength: 100, placeholder: "e.g. Block A" },
      { key: "gender_type", en: "Gender Type", si: "ලිංගිකත්වය", type: "select", required: true, showInTable: true, options: [
        { value: "Mixed", en: "Mixed", si: "මිශ්‍ර" },
        { value: "Male", en: "Male", si: "පිරිමි" },
        { value: "Female", en: "Female", si: "කාන්තා" },
      ]},
      { key: "age_group", en: "Age Group", si: "වයස් කාණ්ඩය", type: "text", showInTable: false, maxLength: 50, placeholder: "e.g. Adult / Pediatric / All" },
      { key: "bed_capacity", en: "Bed Capacity", si: "ඇඳන් ධාරිතාව", type: "number", required: true, showInTable: true },
      { key: "in_charge_staff_id", en: "Ward In-Charge", si: "වෝඩ් භාරකරු", type: "text", showInTable: false, maxLength: 200, placeholder: "e.g. Staff / Nurse ID" },
      { key: "phone_extension", en: "Extension", si: "දුරකථන අංකය", type: "text", showInTable: false, maxLength: 50, placeholder: "e.g. Ext 204" },
      { key: "description", en: "Notes", si: "විස්තරය", type: "text", showInTable: false, maxLength: 1000 },
      { key: "status", en: "Status", si: "තත්ත්වය", type: "select", required: true, showInTable: true, options: [
        { value: "ACTIVE", en: "Active", si: "සක්‍රිය" },
        { value: "INACTIVE", en: "Inactive", si: "අක්‍රිය" },
        { value: "MAINTENANCE", en: "Maintenance", si: "නඩත්තු" },
      ]},
      { key: "id", en: "ID", si: "හැඳුනුම්පත", type: "readonly", showInTable: false },
    ],
    inputFields: ["name", "ward_code", "department_id", "ward_type", "floor", "building", "gender_type", "age_group", "bed_capacity", "in_charge_staff_id", "phone_extension", "description", "status"],
    canCreate: true, canEdit: true, canDelete: true,
  },

  beds: {
    key: "beds",
    endpoint: "beds",
    en: { singular: "Bed", plural: "Beds", description: "Manage individual beds within wards and their real-time status." },
    si: { singular: "ඇඳ", plural: "ඇඳන්", description: "වෝඩ් ඇතුළත තනි ඇඳන් සහ ඒවායේ සජීවී තත්ත්වය කළමනාකරණය කරන්න." },
    fields: [
      { key: "bed_number", en: "Bed Number", si: "ඇඳ අංකය", type: "text", required: false, showInTable: true, maxLength: 50, placeholder: "Auto-generated (e.g. BED-001)", placeholderSi: "ස්වයංක්‍රීයව සෑදේ (උදා. BED-001)" },
      { key: "ward_id", en: "Ward", si: "වෝඩ් එක", type: "uuid-ref", required: true, showInTable: true, refResource: "wards", refLabel: "name" },
      { key: "bed_type", en: "Bed Type", si: "ඇඳ වර්ගය", type: "select", required: true, showInTable: true, options: [
        { value: "STANDARD", en: "Standard", si: "සාමාන්‍ය" },
        { value: "ICU", en: "ICU", si: "ICU" },
        { value: "ISOLATION", en: "Isolation", si: "වෙන්කළ" },
        { value: "PEDIATRIC", en: "Pediatric", si: "ළමා" },
        { value: "MATERNITY", en: "Maternity", si: "මාතෘ" },
      ]},
      { key: "status", en: "Status", si: "තත්ත්වය", type: "select", required: true, showInTable: true, options: [
        { value: "AVAILABLE", en: "Available", si: "ලබාගත හැක" },
        { value: "OCCUPIED", en: "Occupied", si: "භාවිතයේ" },
        { value: "RESERVED", en: "Reserved", si: "වෙන්කර ඇත" },
        { value: "CLEANING", en: "Cleaning", si: "පිරිසිදු කරමින්" },
        { value: "MAINTENANCE", en: "Maintenance", si: "නඩත්තු" },
      ]},
      { key: "is_active", en: "Active", si: "සක්‍රිය", type: "boolean", showInTable: true },
      { key: "id", en: "ID", si: "හැඳුනුම්පත", type: "readonly", showInTable: false },
    ],
    inputFields: ["bed_number", "ward_id", "bed_type", "status", "is_active"],
    canCreate: true, canEdit: true, canDelete: true,
  },

  "ward-admissions": {
    key: "ward-admissions",
    endpoint: "ward-admissions",
    en: { singular: "Ward Admission", plural: "Ward Admissions", description: "Track patient admission and transfer history across wards and beds." },
    si: { singular: "වෝඩ් ඇතුළත් කිරීම", plural: "වෝඩ් ඇතුළත් කිරීම්", description: "වෝඩ් සහ ඇඳන් අතර රෝගී ඇතුළත් කිරීම් සහ මාරුකිරීම් වාර්තා නිරීක්ෂණය කරන්න." },
    fields: [
      { key: "patient_id", en: "Patient", si: "රෝගියා", type: "uuid-ref", required: true, showInTable: true, refResource: "patients", refLabel: "external_ref" },
      { key: "ward_id", en: "Ward", si: "වෝඩ් එක", type: "uuid-ref", required: true, showInTable: true, refResource: "wards", refLabel: "name" },
      { key: "bed_id", en: "Bed", si: "ඇඳ", type: "uuid-ref", required: false, showInTable: true, refResource: "beds", refLabel: "bed_number" },
      { key: "admission_status", en: "Admission Status", si: "ඇතුළත් කිරීමේ තත්ත්වය", type: "select", required: true, showInTable: true, options: [
        { value: "ADMITTED", en: "Admitted", si: "ඇතුළත් කර ඇත" },
        { value: "TRANSFERRED", en: "Transferred", si: "මාරුකර ඇත" },
        { value: "DISCHARGED", en: "Discharged", si: "පිටවගොස් ඇත" },
        { value: "CANCELLED", en: "Cancelled", si: "අවලංගුයි" },
      ]},
      { key: "assigned_by", en: "Assigned By", si: "භාරදුන්නේ", type: "text", showInTable: true, maxLength: 200, placeholder: "Staff Name / ID" },
      { key: "discharged_by", en: "Discharged By", si: "පිටත් කළේ", type: "text", showInTable: false, maxLength: 200, placeholder: "Staff Name / ID" },
      { key: "admitted_at", en: "Admitted At", si: "ඇතුළත් කළ වෙලාව", type: "readonly", showInTable: true },
      { key: "discharged_at", en: "Discharged At", si: "පිටවූ වෙලාව", type: "readonly", showInTable: true },
    ],
    inputFields: ["patient_id", "ward_id", "bed_id", "admission_status", "assigned_by", "discharged_by"],
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
    en: { singular: "Patient", plural: "Patients", description: "Manage patient master profiles, MRNs, contacts, and clinical information." },
    si: { singular: "රෝගියා", plural: "රෝගීන්", description: "රෝගී ප්‍රධාන පැතිකඩ, MRN, සම්බන්ධතා සහ සායනික තොරතුරු කළමනාකරණය කරන්න." },
    fields: [
      { key: "external_ref", en: "Full Name", si: "සම්පූර්ණ නම", type: "text", required: true, showInTable: true, maxLength: 200, placeholder: "e.g. Chamath Dilshan" },
      { key: "mrn", en: "MRN", si: "MRN අංකය", type: "text", showInTable: true, maxLength: 50, placeholder: "Auto-generated (e.g. MRN-2026-000101)", placeholderSi: "ස්වයංක්‍රීයව සෑදේ (උදා. MRN-2026-000101)" },
      { key: "gender", en: "Gender", si: "ලිංගිකත්වය", type: "select", showInTable: true, options: [
        { value: "Male", en: "Male", si: "පිරිමි" },
        { value: "Female", en: "Female", si: "කාන්තා" },
        { value: "Other", en: "Other", si: "වෙනත්" },
      ]},
      { key: "date_of_birth", en: "Date of Birth", si: "උපන් දිනය", type: "text", showInTable: true, maxLength: 30, placeholder: "e.g. 2003-05-12" },
      { key: "nic", en: "NIC / Passport", si: "ජා.හැ. අංකය / විදේශගමන් බලපත්‍රය", type: "text", showInTable: true, maxLength: 30, placeholder: "e.g. 200312345678" },
      { key: "mobile", en: "Mobile Phone", si: "දුරකථන අංකය", type: "text", showInTable: true, maxLength: 30, placeholder: "e.g. 0771234567" },
      { key: "email", en: "Email", si: "විද්‍යුත් තැපෑල", type: "text", showInTable: false, maxLength: 254, placeholder: "e.g. patient@example.com" },
      { key: "blood_group", en: "Blood Group", si: "ලේ වර්ගය", type: "select", showInTable: true, options: [
        { value: "A+", en: "A+", si: "A+" },
        { value: "A-", en: "A-", si: "A-" },
        { value: "B+", en: "B+", si: "B+" },
        { value: "B-", en: "B-", si: "B-" },
        { value: "O+", en: "O+", si: "O+" },
        { value: "O-", en: "O-", si: "O-" },
        { value: "AB+", en: "AB+", si: "AB+" },
        { value: "AB-", en: "AB-", si: "AB-" },
      ]},
      { key: "allergies", en: "Allergies Warning", si: "ආසාත්මිකතා අවවාදය", type: "text", showInTable: true, maxLength: 500, placeholder: "e.g. ⚠️ Penicillin Allergy" },
      { key: "address_line_1", en: "Address", si: "ලිපිනය", type: "text", showInTable: false, maxLength: 200, placeholder: "e.g. No. 12, Main Street" },
      { key: "city", en: "City", si: "නගරය", type: "text", showInTable: false, maxLength: 100, placeholder: "e.g. Colombo" },
      { key: "status", en: "Status", si: "තත්ත්වය", type: "select", showInTable: true, options: [
        { value: "ACTIVE", en: "Active", si: "සක්‍රිය" },
        { value: "INACTIVE", en: "Inactive", si: "අක්‍රිය" },
        { value: "DECEASED", en: "Deceased", si: "අභාවප්‍රාප්ත" },
        { value: "ARCHIVED", en: "Archived", si: "ලේඛනගත" },
      ]},
      { key: "id", en: "Patient ID", si: "රෝගී හැඳුනුම්පත", type: "readonly", showInTable: false },
    ],
    inputFields: ["external_ref", "mrn", "gender", "date_of_birth", "nic", "mobile", "email", "blood_group", "allergies", "address_line_1", "city", "status"],
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
