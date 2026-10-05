/**
 * Declarative field definitions for each backend resource.
 * The dashboard CRUD panel reads these to render forms, tables, and labels
 * in both English and Sinhala — zero hard-coded UI per resource.
 */

export type FieldType =
  | "text"
  | "quotation"
  | "select"
  | "datetime"
  | "number"
  | "boolean"
  | "uuid-ref"
  | "readonly";

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
  defaultValue?: string;
  min?: number;
  step?: number | "any";
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
    en: {
      singular: "Hospital",
      plural: "Hospitals",
      description: "Manage registered hospitals in the system.",
    },
    si: {
      singular: "රෝහල",
      plural: "රෝහල්",
      description: "පද්ධතියේ ලියාපදිංචි රෝහල් කළමනාකරණය කරන්න.",
    },
    fields: [
      {
        key: "name",
        en: "Name",
        si: "නම",
        type: "text",
        required: true,
        showInTable: true,
        maxLength: 200,
      },
      {
        key: "id",
        en: "ID",
        si: "හැඳුනුම්පත",
        type: "readonly",
        showInTable: false,
        tableOnly: true,
      },
    ],
    inputFields: ["name"],
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },

  branches: {
    key: "branches",
    endpoint: "branches",
    en: {
      singular: "Branch",
      plural: "Branches",
      description: "Manage hospital branch locations.",
    },
    si: {
      singular: "ශාඛාව",
      plural: "ශාඛා",
      description: "රෝහල් ශාඛා ස්ථාන කළමනාකරණය කරන්න.",
    },
    fields: [
      {
        key: "name",
        en: "Name",
        si: "නම",
        type: "text",
        required: true,
        showInTable: true,
        maxLength: 200,
      },
      {
        key: "timezone",
        en: "Timezone",
        si: "වේලා කලාපය",
        type: "text",
        required: true,
        showInTable: true,
        maxLength: 64,
        placeholder: "Asia/Colombo",
      },
      {
        key: "tenant_id",
        en: "Hospital",
        si: "රෝහල",
        type: "uuid-ref",
        required: true,
        showInTable: true,
        refResource: "hospitals",
        refLabel: "name",
        createOnly: true,
      },
    ],
    inputFields: ["tenant_id", "name", "timezone"],
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },

  departments: {
    key: "departments",
    endpoint: "departments",
    en: {
      singular: "Department",
      plural: "Departments",
      description:
        "Manage hospital departments, locations, HODs, and active status.",
    },
    si: {
      singular: "අංශය",
      plural: "අංශ",
      description:
        "රෝහල් අංශ, පිහිටීම, අංශ ප්‍රධානී සහ සක්‍රිය තත්ත්වය කළමනාකරණය කරන්න.",
    },
    fields: [
      {
        key: "name",
        en: "Department Name",
        si: "අංශයේ නම",
        type: "text",
        required: true,
        showInTable: true,
        maxLength: 200,
        placeholder: "e.g. Cardiology",
      },
      {
        key: "code",
        en: "Code",
        si: "සංකේතය",
        type: "text",
        showInTable: true,
        maxLength: 20,
        placeholder: "Auto-generated (e.g. DEPT-01)",
        placeholderSi: "ස්වයංක්‍රීයව සෑදේ (උදා. DEPT-01)",
      },
      {
        key: "location",
        en: "Location",
        si: "ස්ථානය",
        type: "text",
        showInTable: true,
        maxLength: 200,
        placeholder: "e.g. Building A, 2nd Floor",
      },
      {
        key: "head_of_dept",
        en: "Head of Dept",
        si: "අංශ ප්‍රධානියා",
        type: "text",
        showInTable: true,
        maxLength: 200,
        placeholder: "e.g. Dr. Perera",
      },
      {
        key: "description",
        en: "Description",
        si: "විස්තරය",
        type: "text",
        showInTable: false,
        maxLength: 500,
        placeholder: "Scope and details",
      },
      {
        key: "is_active",
        en: "Status",
        si: "තත්ත්වය",
        type: "boolean",
        showInTable: true,
      },
      {
        key: "id",
        en: "ID",
        si: "හැඳුනුම්පත",
        type: "readonly",
        showInTable: false,
      },
    ],
    inputFields: [
      "name",
      "code",
      "location",
      "head_of_dept",
      "description",
      "is_active",
    ],
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },

  rooms: {
    key: "rooms",
    endpoint: "rooms",
    en: {
      singular: "Room",
      plural: "Rooms",
      description: "Manage consultation and examination rooms by department.",
    },
    si: {
      singular: "කාමරය",
      plural: "කාමර",
      description: "අංශය අනුව උපදේශන සහ පරීක්ෂණ කාමර කළමනාකරණය කරන්න.",
    },
    fields: [
      {
        key: "name",
        en: "Name",
        si: "නම",
        type: "text",
        required: true,
        showInTable: true,
        maxLength: 120,
        placeholder: "e.g. Room 101",
      },
      {
        key: "department_id",
        en: "Department",
        si: "අංශය",
        type: "uuid-ref",
        required: false,
        showInTable: true,
        refResource: "departments",
        refLabel: "name",
      },
      {
        key: "id",
        en: "ID",
        si: "හැඳුනුම්පත",
        type: "readonly",
        showInTable: false,
      },
    ],
    inputFields: ["name", "department_id"],
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },

  wards: {
    key: "wards",
    endpoint: "wards",
    en: {
      singular: "Ward",
      plural: "Wards",
      description:
        "Manage hospital wards, capacities, floor locations, and departments.",
    },
    si: {
      singular: "වෝඩ් එක",
      plural: "වෝඩ්",
      description: "රෝහල් වෝඩ්, ධාරිතාව, තට්ටු පිහිටීම සහ අංශ කළමනාකරණය කරන්න.",
    },
    fields: [
      {
        key: "name",
        en: "Ward Name",
        si: "වෝඩ් නම",
        type: "text",
        required: true,
        showInTable: true,
        maxLength: 200,
        placeholder: "e.g. General Ward A",
      },
      {
        key: "ward_code",
        en: "Ward Code",
        si: "වෝඩ් සංකේතය",
        type: "text",
        required: false,
        showInTable: true,
        maxLength: 50,
        placeholder: "Auto-generated (e.g. WARD-001)",
        placeholderSi: "ස්වයංක්‍රීයව සෑදේ (උදා. WARD-001)",
      },
      {
        key: "department_id",
        en: "Department",
        si: "අංශය",
        type: "uuid-ref",
        required: true,
        showInTable: true,
        refResource: "departments",
        refLabel: "name",
      },
      {
        key: "ward_type",
        en: "Ward Type",
        si: "වෝඩ් වර්ගය",
        type: "select",
        required: true,
        showInTable: true,
        options: [
          { value: "General", en: "General", si: "සාමාන්‍ය" },
          { value: "ICU", en: "ICU", si: "අති දැඩි සත්කාර (ICU)" },
          { value: "Pediatric", en: "Pediatric", si: "ළමා" },
          { value: "Maternity", en: "Maternity", si: "මාතෘ" },
        ],
      },
      {
        key: "floor",
        en: "Floor",
        si: "තට්ටුව",
        type: "text",
        showInTable: true,
        maxLength: 50,
        placeholder: "e.g. 2nd Floor",
      },
      {
        key: "building",
        en: "Building / Wing",
        si: "ගොඩනැගිල්ල",
        type: "text",
        showInTable: false,
        maxLength: 100,
        placeholder: "e.g. Block A",
      },
      {
        key: "gender_type",
        en: "Gender Type",
        si: "ලිංගිකත්වය",
        type: "select",
        required: true,
        showInTable: true,
        options: [
          { value: "Mixed", en: "Mixed", si: "මිශ්‍ර" },
          { value: "Male", en: "Male", si: "පිරිමි" },
          { value: "Female", en: "Female", si: "කාන්තා" },
        ],
      },
      {
        key: "age_group",
        en: "Age Group",
        si: "වයස් කාණ්ඩය",
        type: "text",
        showInTable: false,
        maxLength: 50,
        placeholder: "e.g. Adult / Pediatric / All",
      },
      {
        key: "bed_capacity",
        en: "Bed Capacity",
        si: "ඇඳන් ධාරිතාව",
        type: "number",
        required: true,
        showInTable: true,
      },
      {
        key: "in_charge_staff_id",
        en: "Ward In-Charge",
        si: "වෝඩ් භාරකරු",
        type: "text",
        showInTable: false,
        maxLength: 200,
        placeholder: "e.g. Staff / Nurse ID",
      },
      {
        key: "phone_extension",
        en: "Extension",
        si: "දුරකථන අංකය",
        type: "text",
        showInTable: false,
        maxLength: 50,
        placeholder: "e.g. Ext 204",
      },
      {
        key: "description",
        en: "Notes",
        si: "විස්තරය",
        type: "text",
        showInTable: false,
        maxLength: 1000,
      },
      {
        key: "status",
        en: "Status",
        si: "තත්ත්වය",
        type: "select",
        required: true,
        showInTable: true,
        options: [
          { value: "ACTIVE", en: "Active", si: "සක්‍රිය" },
          { value: "INACTIVE", en: "Inactive", si: "අක්‍රිය" },
          { value: "MAINTENANCE", en: "Maintenance", si: "නඩත්තු" },
        ],
      },
      {
        key: "id",
        en: "ID",
        si: "හැඳුනුම්පත",
        type: "readonly",
        showInTable: false,
      },
    ],
    inputFields: [
      "name",
      "ward_code",
      "department_id",
      "ward_type",
      "floor",
      "building",
      "gender_type",
      "age_group",
      "bed_capacity",
      "in_charge_staff_id",
      "phone_extension",
      "description",
      "status",
    ],
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },

  beds: {
    key: "beds",
    endpoint: "beds",
    en: {
      singular: "Bed",
      plural: "Beds",
      description:
        "Manage individual beds within wards and their real-time status.",
    },
    si: {
      singular: "ඇඳ",
      plural: "ඇඳන්",
      description:
        "වෝඩ් ඇතුළත තනි ඇඳන් සහ ඒවායේ සජීවී තත්ත්වය කළමනාකරණය කරන්න.",
    },
    fields: [
      {
        key: "bed_number",
        en: "Bed Number",
        si: "ඇඳ අංකය",
        type: "text",
        required: false,
        showInTable: true,
        maxLength: 50,
        placeholder: "Auto-generated (e.g. BED-001)",
        placeholderSi: "ස්වයංක්‍රීයව සෑදේ (උදා. BED-001)",
      },
      {
        key: "ward_id",
        en: "Ward",
        si: "වෝඩ් එක",
        type: "uuid-ref",
        required: true,
        showInTable: true,
        refResource: "wards",
        refLabel: "name",
      },
      {
        key: "bed_type",
        en: "Bed Type",
        si: "ඇඳ වර්ගය",
        type: "select",
        required: true,
        showInTable: true,
        options: [
          { value: "STANDARD", en: "Standard", si: "සාමාන්‍ය" },
          { value: "ICU", en: "ICU", si: "ICU" },
          { value: "ISOLATION", en: "Isolation", si: "වෙන්කළ" },
          { value: "PEDIATRIC", en: "Pediatric", si: "ළමා" },
          { value: "MATERNITY", en: "Maternity", si: "මාතෘ" },
        ],
      },
      {
        key: "status",
        en: "Status",
        si: "තත්ත්වය",
        type: "select",
        required: true,
        showInTable: true,
        options: [
          { value: "AVAILABLE", en: "Available", si: "ලබාගත හැක" },
          { value: "OCCUPIED", en: "Occupied", si: "භාවිතයේ" },
          { value: "RESERVED", en: "Reserved", si: "වෙන්කර ඇත" },
          { value: "CLEANING", en: "Cleaning", si: "පිරිසිදු කරමින්" },
          { value: "MAINTENANCE", en: "Maintenance", si: "නඩත්තු" },
        ],
      },
      {
        key: "is_active",
        en: "Active",
        si: "සක්‍රිය",
        type: "boolean",
        showInTable: true,
      },
      {
        key: "id",
        en: "ID",
        si: "හැඳුනුම්පත",
        type: "readonly",
        showInTable: false,
      },
    ],
    inputFields: ["bed_number", "ward_id", "bed_type", "status", "is_active"],
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },

  "ward-admissions": {
    key: "ward-admissions",
    endpoint: "ward-admissions",
    en: {
      singular: "Ward Admission",
      plural: "Ward Admissions",
      description:
        "Track patient admission and transfer history across wards and beds.",
    },
    si: {
      singular: "වෝඩ් ඇතුළත් කිරීම",
      plural: "වෝඩ් ඇතුළත් කිරීම්",
      description:
        "වෝඩ් සහ ඇඳන් අතර රෝගී ඇතුළත් කිරීම් සහ මාරුකිරීම් වාර්තා නිරීක්ෂණය කරන්න.",
    },
    fields: [
      {
        key: "patient_id",
        en: "Patient",
        si: "රෝගියා",
        type: "uuid-ref",
        required: true,
        showInTable: true,
        refResource: "patients",
        refLabel: "external_ref",
      },
      {
        key: "ward_id",
        en: "Ward",
        si: "වෝඩ් එක",
        type: "uuid-ref",
        required: true,
        showInTable: true,
        refResource: "wards",
        refLabel: "name",
      },
      {
        key: "bed_id",
        en: "Bed",
        si: "ඇඳ",
        type: "uuid-ref",
        required: false,
        showInTable: true,
        refResource: "beds",
        refLabel: "bed_number",
      },
      {
        key: "admission_status",
        en: "Admission Status",
        si: "ඇතුළත් කිරීමේ තත්ත්වය",
        type: "select",
        required: true,
        showInTable: true,
        options: [
          { value: "ADMITTED", en: "Admitted", si: "ඇතුළත් කර ඇත" },
          { value: "TRANSFERRED", en: "Transferred", si: "මාරුකර ඇත" },
          { value: "DISCHARGED", en: "Discharged", si: "පිටවගොස් ඇත" },
          { value: "CANCELLED", en: "Cancelled", si: "අවලංගුයි" },
        ],
      },
      {
        key: "assigned_by",
        en: "Assigned By",
        si: "භාරදුන්නේ",
        type: "text",
        showInTable: true,
        maxLength: 200,
        placeholder: "Staff Name / ID",
      },
      {
        key: "discharged_by",
        en: "Discharged By",
        si: "පිටත් කළේ",
        type: "text",
        showInTable: false,
        maxLength: 200,
        placeholder: "Staff Name / ID",
      },
      {
        key: "admitted_at",
        en: "Admitted At",
        si: "ඇතුළත් කළ වෙලාව",
        type: "readonly",
        showInTable: true,
      },
      {
        key: "discharged_at",
        en: "Discharged At",
        si: "පිටවූ වෙලාව",
        type: "readonly",
        showInTable: true,
      },
    ],
    inputFields: [
      "patient_id",
      "ward_id",
      "bed_id",
      "admission_status",
      "assigned_by",
      "discharged_by",
    ],
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },

  doctors: {
    key: "doctors",
    endpoint: "doctors",
    en: {
      singular: "Doctor",
      plural: "Doctors",
      description: "Manage doctors and their specialties.",
    },
    si: {
      singular: "වෛද්‍යවරයා",
      plural: "වෛද්‍යවරු",
      description: "වෛද්‍යවරුන් සහ ඔවුන්ගේ විශේෂතා කළමනාකරණය කරන්න.",
    },
    fields: [
      {
        key: "name",
        en: "Name",
        si: "නම",
        type: "text",
        required: true,
        showInTable: true,
        maxLength: 200,
      },
      {
        key: "department_id",
        en: "Department",
        si: "අංශය",
        type: "uuid-ref",
        required: true,
        showInTable: true,
        refResource: "departments",
        refLabel: "name",
      },
      {
        key: "specialty",
        en: "Specialty",
        si: "විශේෂත්වය",
        type: "text",
        showInTable: true,
        maxLength: 200,
      },
      {
        key: "quotation_template",
        en: "Default quotation",
        si: "පෙරනිමි මිල ගණන",
        type: "quotation",
        showInTable: false,
        formOnly: true,
        placeholder: "Consultation fee | 2500",
        placeholderSi: "උපදේශන ගාස්තුව | 2500",
      },
    ],
    inputFields: ["name", "department_id", "specialty", "quotation_template"],
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },

  schedules: {
    key: "schedules",
    endpoint: "schedules",
    en: {
      singular: "Schedule",
      plural: "Schedules",
      description: "Manage doctor schedules and time slots.",
    },
    si: {
      singular: "කාලසටහන",
      plural: "කාලසටහන්",
      description: "වෛද්‍ය කාලසටහන් සහ කාල පරාසයන් කළමනාකරණය කරන්න.",
    },
    fields: [
      {
        key: "doctor_id",
        en: "Doctor",
        si: "වෛද්‍යවරයා",
        type: "uuid-ref",
        required: true,
        showInTable: true,
        refResource: "doctors",
        refLabel: "name",
      },
      {
        key: "room_id",
        en: "Room",
        si: "කාමරය",
        type: "uuid-ref",
        required: true,
        showInTable: true,
        refResource: "rooms",
        refLabel: "name",
      },
      {
        key: "starts_at",
        en: "Starts At",
        si: "ආරම්භය",
        type: "datetime",
        required: true,
        showInTable: true,
      },
      {
        key: "ends_at",
        en: "Ends At",
        si: "අවසානය",
        type: "datetime",
        required: true,
        showInTable: true,
      },
      {
        key: "capacity",
        en: "Capacity",
        si: "ධාරිතාව",
        type: "number",
        required: true,
        showInTable: true,
      },
    ],
    inputFields: ["doctor_id", "room_id", "starts_at", "ends_at", "capacity"],
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },

  patients: {
    key: "patients",
    endpoint: "patients",
    en: {
      singular: "Patient",
      plural: "Patients",
      description:
        "Manage patient master profiles, MRNs, contacts, and clinical information.",
    },
    si: {
      singular: "රෝගියා",
      plural: "රෝගීන්",
      description:
        "රෝගී ප්‍රධාන පැතිකඩ, MRN, සම්බන්ධතා සහ සායනික තොරතුරු කළමනාකරණය කරන්න.",
    },
    fields: [
      {
        key: "external_ref",
        en: "Full Name",
        si: "සම්පූර්ණ නම",
        type: "text",
        required: true,
        showInTable: true,
        maxLength: 200,
        placeholder: "e.g. Chamath Dilshan",
      },
      {
        key: "mrn",
        en: "MRN",
        si: "MRN අංකය",
        type: "text",
        showInTable: true,
        maxLength: 50,
        placeholder: "Auto-generated (e.g. MRN-2026-000101)",
        placeholderSi: "ස්වයංක්‍රීයව සෑදේ (උදා. MRN-2026-000101)",
      },
      {
        key: "gender",
        en: "Gender",
        si: "ලිංගිකත්වය",
        type: "select",
        showInTable: true,
        options: [
          { value: "Male", en: "Male", si: "පිරිමි" },
          { value: "Female", en: "Female", si: "කාන්තා" },
          { value: "Other", en: "Other", si: "වෙනත්" },
        ],
      },
      {
        key: "date_of_birth",
        en: "Date of Birth",
        si: "උපන් දිනය",
        type: "text",
        showInTable: true,
        maxLength: 30,
        placeholder: "e.g. 2003-05-12",
      },
      {
        key: "nic",
        en: "NIC / Passport",
        si: "ජා.හැ. අංකය / විදේශගමන් බලපත්‍රය",
        type: "text",
        showInTable: true,
        maxLength: 30,
        placeholder: "e.g. 200312345678",
      },
      {
        key: "mobile",
        en: "Mobile Phone",
        si: "දුරකථන අංකය",
        type: "text",
        showInTable: true,
        maxLength: 30,
        placeholder: "e.g. 0771234567",
      },
      {
        key: "email",
        en: "Email",
        si: "විද්‍යුත් තැපෑල",
        type: "text",
        showInTable: false,
        maxLength: 254,
        placeholder: "e.g. patient@example.com",
      },
      {
        key: "blood_group",
        en: "Blood Group",
        si: "ලේ වර්ගය",
        type: "select",
        showInTable: true,
        options: [
          { value: "A+", en: "A+", si: "A+" },
          { value: "A-", en: "A-", si: "A-" },
          { value: "B+", en: "B+", si: "B+" },
          { value: "B-", en: "B-", si: "B-" },
          { value: "O+", en: "O+", si: "O+" },
          { value: "O-", en: "O-", si: "O-" },
          { value: "AB+", en: "AB+", si: "AB+" },
          { value: "AB-", en: "AB-", si: "AB-" },
        ],
      },
      {
        key: "allergies",
        en: "Allergies Warning",
        si: "ආසාත්මිකතා අවවාදය",
        type: "text",
        showInTable: true,
        maxLength: 500,
        placeholder: "e.g. ⚠️ Penicillin Allergy",
      },
      {
        key: "address_line_1",
        en: "Address",
        si: "ලිපිනය",
        type: "text",
        showInTable: false,
        maxLength: 200,
        placeholder: "e.g. No. 12, Main Street",
      },
      {
        key: "city",
        en: "City",
        si: "නගරය",
        type: "text",
        showInTable: false,
        maxLength: 100,
        placeholder: "e.g. Colombo",
      },
      {
        key: "status",
        en: "Status",
        si: "තත්ත්වය",
        type: "select",
        showInTable: true,
        options: [
          { value: "ACTIVE", en: "Active", si: "සක්‍රිය" },
          { value: "INACTIVE", en: "Inactive", si: "අක්‍රිය" },
          { value: "DECEASED", en: "Deceased", si: "අභාවප්‍රාප්ත" },
          { value: "ARCHIVED", en: "Archived", si: "ලේඛනගත" },
        ],
      },
      {
        key: "id",
        en: "Patient ID",
        si: "රෝගී හැඳුනුම්පත",
        type: "readonly",
        showInTable: false,
      },
    ],
    inputFields: [
      "external_ref",
      "mrn",
      "gender",
      "date_of_birth",
      "nic",
      "mobile",
      "email",
      "blood_group",
      "allergies",
      "address_line_1",
      "city",
      "status",
    ],
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },

  queues: {
    key: "queues",
    endpoint: "queues",
    en: {
      singular: "Queue",
      plural: "Queues",
      description: "Manage live queues by department.",
    },
    si: {
      singular: "පෝලිම",
      plural: "පෝලිම්",
      description: "අංශය අනුව සජීවී පෝලිම් කළමනාකරණය කරන්න.",
    },
    fields: [
      {
        key: "name",
        en: "Name",
        si: "නම",
        type: "text",
        required: true,
        showInTable: true,
        maxLength: 120,
        placeholder: "e.g. OPD Queue",
      },
      {
        key: "department_id",
        en: "Department",
        si: "අංශය",
        type: "uuid-ref",
        required: false,
        showInTable: true,
        refResource: "departments",
        refLabel: "name",
      },
      {
        key: "timezone",
        en: "Timezone",
        si: "වේලා කලාපය",
        type: "readonly",
        showInTable: true,
      },
      {
        key: "token_sequence",
        en: "Token Seq.",
        si: "ටෝකන් අනුපිළිවෙල",
        type: "readonly",
        showInTable: true,
      },
    ],
    inputFields: ["name", "department_id"],
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },

  visits: {
    key: "visits",
    endpoint: "visits",
    en: {
      singular: "Visit",
      plural: "Visits",
      description: "Track patient visits.",
    },
    si: {
      singular: "පැමිණීම",
      plural: "රෝහල් පැමිණීම්",
      description: "රෝගී පැමිණීම් නිරීක්ෂණය කරන්න.",
    },
    fields: [
      {
        key: "patient_id",
        en: "Patient",
        si: "රෝගියා",
        type: "uuid-ref",
        required: true,
        showInTable: true,
        refResource: "patients",
        refLabel: "external_ref",
      },
      {
        key: "id",
        en: "Visit ID",
        si: "පැමිණීම් හැඳුනුම්පත",
        type: "readonly",
        showInTable: true,
      },
    ],
    inputFields: ["patient_id"],
    canCreate: true,
    canEdit: false,
    canDelete: false,
  },

  appointments: {
    key: "appointments",
    endpoint: "appointments",
    en: {
      singular: "Appointment",
      plural: "Appointments",
      description: "Manage appointment bookings.",
    },
    si: {
      singular: "හමුවීම",
      plural: "හමුවීම්",
      description: "හමුවීම් වෙන්කිරීම් කළමනාකරණය කරන්න.",
    },
    fields: [
      {
        key: "patient_id",
        en: "Patient",
        si: "රෝගියා",
        type: "uuid-ref",
        required: true,
        showInTable: true,
        refResource: "patients",
        refLabel: "external_ref",
      },
      {
        key: "schedule_id",
        en: "Schedule",
        si: "කාලසටහන",
        type: "uuid-ref",
        required: true,
        showInTable: true,
        refResource: "schedules",
        refLabel: "starts_at",
      },
      {
        key: "status",
        en: "Status",
        si: "තත්ත්වය",
        type: "readonly",
        showInTable: true,
      },
      {
        key: "created_at",
        en: "Created",
        si: "සාදන ලද",
        type: "readonly",
        showInTable: true,
      },
    ],
    inputFields: ["patient_id", "schedule_id"],
    canCreate: true,
    canEdit: false,
    canDelete: false,
  },

  users: {
    key: "users",
    endpoint: "users",
    en: {
      singular: "User",
      plural: "Users",
      description: "View system user accounts.",
    },
    si: {
      singular: "පරිශීලකයා",
      plural: "පරිශීලකයන්",
      description: "පද්ධති පරිශීලක ගිණුම් බලන්න.",
    },
    fields: [
      {
        key: "display_name",
        en: "Name",
        si: "නම",
        type: "readonly",
        showInTable: true,
      },
      {
        key: "id",
        en: "User ID",
        si: "පරිශීලක හැඳුනුම්පත",
        type: "readonly",
        showInTable: true,
      },
    ],
    inputFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
  },

  memberships: {
    key: "memberships",
    endpoint: "memberships",
    en: {
      singular: "Membership",
      plural: "Memberships",
      description: "Manage user access roles.",
    },
    si: {
      singular: "සාමාජිකත්වය",
      plural: "සාමාජිකත්ව",
      description: "පරිශීලක ප්‍රවේශ භූමිකා කළමනාකරණය කරන්න.",
    },
    fields: [
      {
        key: "user_id",
        en: "User",
        si: "පරිශීලකයා",
        type: "uuid-ref",
        required: true,
        showInTable: true,
        refResource: "users",
        refLabel: "display_name",
        createOnly: true,
      },
      {
        key: "role",
        en: "Role",
        si: "භූමිකාව",
        type: "select",
        required: true,
        showInTable: true,
        options: [
          { value: "admin", en: "Administrator", si: "පරිපාලක" },
          { value: "staff", en: "Staff", si: "කාර්ය මණ්ඩලය" },
          { value: "reception", en: "Reception", si: "පිළිගැනීම" },
          { value: "doctor", en: "Doctor", si: "වෛද්‍ය" },
        ],
      },
      {
        key: "active",
        en: "Active",
        si: "සක්‍රිය",
        type: "boolean",
        showInTable: true,
        editOnly: true,
      },
    ],
    inputFields: ["user_id", "role", "active"],
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },

  "audit-events": {
    key: "audit-events",
    endpoint: "audit-events",
    en: {
      singular: "Audit Event",
      plural: "Audit Events",
      description: "View system audit trail.",
    },
    si: {
      singular: "විගණන සටහන",
      plural: "විගණන සටහන්",
      description: "පද්ධති විගණන මාර්ගය බලන්න.",
    },
    fields: [
      {
        key: "action",
        en: "Action",
        si: "ක්‍රියාව",
        type: "readonly",
        showInTable: true,
      },
      {
        key: "actor_id",
        en: "Actor",
        si: "ක්‍රියාකරු",
        type: "readonly",
        showInTable: true,
      },
      {
        key: "entity_id",
        en: "Entity",
        si: "අයිතමය",
        type: "readonly",
        showInTable: true,
      },
      {
        key: "created_at",
        en: "Time",
        si: "කාලය",
        type: "readonly",
        showInTable: true,
      },
      {
        key: "payload",
        en: "Details",
        si: "විස්තර",
        type: "readonly",
        showInTable: false,
      },
    ],
    inputFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
  },
};

Object.assign(resourceConfigs, {
  "clinical-records": {
    key: "clinical-records",
    endpoint: "clinical-records",
    en: {
      singular: "Clinical record",
      plural: "Clinical records",
      description: "Record consultations, diagnoses and vital signs.",
    },
    si: {
      singular: "සායනික වාර්තා",
      plural: "සායනික වාර්තා",
      description: "Record consultations, diagnoses and vital signs.",
    },
    fields: [
      {
        key: "patient_id",
        en: "Patient",
        si: "රෝගියා",
        type: "uuid-ref",
        required: true,
        showInTable: true,
        refResource: "patients",
        refLabel: "external_ref",
        createOnly: true,
      },
      {
        key: "diagnosis",
        en: "Diagnosis",
        si: "රෝග විනිශ්චය",
        type: "text",
        required: true,
        showInTable: true,
      },
      {
        key: "notes",
        en: "Notes",
        si: "සටහන්",
        type: "text",
        required: false,
        showInTable: true,
      },
      {
        key: "blood_pressure",
        en: "Blood pressure",
        si: "රුධිර පීඩනය",
        type: "text",
        required: false,
        showInTable: true,
      },
      {
        key: "temperature",
        en: "Temperature °C",
        si: "උෂ්ණත්වය °C",
        type: "number",
        required: false,
        showInTable: true,
      },
      {
        key: "status",
        en: "Status",
        si: "තත්ත්වය",
        type: "select",
        required: true,
        showInTable: true,
        options: [
          {
            value: "DRAFT",
            en: "Draft",
            si: "Draft",
          },
          {
            value: "SIGNED",
            en: "Signed",
            si: "Signed",
          },
        ],
      },
    ],
    inputFields: [
      "patient_id",
      "diagnosis",
      "notes",
      "blood_pressure",
      "temperature",
      "status",
    ],
    canCreate: true,
    canEdit: true,
    canDelete: false,
  },
  prescriptions: {
    key: "prescriptions",
    endpoint: "prescriptions",
    en: {
      singular: "Prescription",
      plural: "Prescriptions",
      description: "Prescribe medication and track dispensing.",
    },
    si: {
      singular: "ඖෂධ වට්ටෝරු",
      plural: "ඖෂධ වට්ටෝරු",
      description: "Prescribe medication and track dispensing.",
    },
    fields: [
      {
        key: "patient_id",
        en: "Patient",
        si: "රෝගියා",
        type: "uuid-ref",
        required: true,
        showInTable: true,
        refResource: "patients",
        refLabel: "external_ref",
        createOnly: true,
      },
      {
        key: "medicine",
        en: "Medicine",
        si: "ඖෂධය",
        type: "text",
        required: true,
        showInTable: true,
      },
      {
        key: "dosage",
        en: "Dosage",
        si: "මාත්‍රාව",
        type: "text",
        required: true,
        showInTable: true,
      },
      {
        key: "frequency",
        en: "Frequency",
        si: "වාර ගණන",
        type: "text",
        required: true,
        showInTable: true,
      },
      {
        key: "duration",
        en: "Duration",
        si: "කාලය",
        type: "text",
        required: true,
        showInTable: true,
      },
      {
        key: "instructions",
        en: "Instructions",
        si: "උපදෙස්",
        type: "text",
        required: false,
        showInTable: true,
      },
      {
        key: "status",
        en: "Status",
        si: "තත්ත්වය",
        type: "select",
        required: true,
        showInTable: true,
        options: [
          {
            value: "PRESCRIBED",
            en: "Prescribed",
            si: "Prescribed",
          },
          {
            value: "DISPENSED",
            en: "Dispensed",
            si: "Dispensed",
          },
          {
            value: "CANCELLED",
            en: "Cancelled",
            si: "Cancelled",
          },
        ],
      },
    ],
    inputFields: [
      "patient_id",
      "medicine",
      "dosage",
      "frequency",
      "duration",
      "instructions",
      "status",
    ],
    canCreate: true,
    canEdit: true,
    canDelete: false,
  },
  "lab-orders": {
    key: "lab-orders",
    endpoint: "lab-orders",
    en: {
      singular: "Lab order",
      plural: "Lab orders",
      description: "Order tests, collect samples and release results.",
    },
    si: {
      singular: "පරීක්ෂණ ඉල්ලීම්",
      plural: "පරීක්ෂණ ඉල්ලීම්",
      description: "Order tests, collect samples and release results.",
    },
    fields: [
      {
        key: "patient_id",
        en: "Patient",
        si: "රෝගියා",
        type: "uuid-ref",
        required: true,
        showInTable: true,
        refResource: "patients",
        refLabel: "external_ref",
        createOnly: true,
      },
      {
        key: "test_name",
        en: "Test name",
        si: "පරීක්ෂණ නම",
        type: "text",
        required: true,
        showInTable: true,
      },
      {
        key: "priority",
        en: "Priority",
        si: "ප්‍රමුඛතාව",
        type: "select",
        required: true,
        showInTable: true,
        options: [
          {
            value: "ROUTINE",
            en: "Routine",
            si: "Routine",
          },
          {
            value: "URGENT",
            en: "Urgent",
            si: "Urgent",
          },
        ],
      },
      {
        key: "result",
        en: "Result",
        si: "ප්‍රතිඵල",
        type: "text",
        required: false,
        showInTable: true,
      },
      {
        key: "status",
        en: "Status",
        si: "තත්ත්වය",
        type: "select",
        required: true,
        showInTable: true,
        options: [
          {
            value: "ORDERED",
            en: "Ordered",
            si: "Ordered",
          },
          {
            value: "COLLECTED",
            en: "Collected",
            si: "Collected",
          },
          {
            value: "COMPLETED",
            en: "Completed",
            si: "Completed",
          },
          {
            value: "RELEASED",
            en: "Released",
            si: "Released",
          },
          {
            value: "CANCELLED",
            en: "Cancelled",
            si: "Cancelled",
          },
        ],
      },
    ],
    inputFields: ["patient_id", "test_name", "priority", "result", "status"],
    canCreate: true,
    canEdit: true,
    canDelete: false,
  },
  invoices: {
    key: "invoices",
    endpoint: "invoices",
    en: {
      singular: "Invoice",
      plural: "Invoices",
      description: "Track charges, payments and outstanding balances in LKR.",
    },
    si: {
      singular: "බිල්පත්",
      plural: "බිල්පත්",
      description: "Track charges, payments and outstanding balances in LKR.",
    },
    fields: [
      {
        key: "patient_id",
        en: "Patient",
        si: "රෝගියා",
        type: "uuid-ref",
        required: true,
        showInTable: true,
        refResource: "patients",
        refLabel: "external_ref",
        createOnly: true,
      },
      {
        key: "description",
        en: "Description",
        si: "විස්තරය",
        type: "text",
        required: true,
        showInTable: true,
      },
      {
        key: "amount",
        en: "Amount (LKR)",
        si: "මුදල (රු.)",
        type: "number",
        required: true,
        showInTable: true,
      },
      {
        key: "paid_amount",
        en: "Paid amount (LKR)",
        si: "ගෙවූ මුදල (රු.)",
        type: "number",
        required: true,
        showInTable: true,
      },
      {
        key: "currency",
        en: "Currency",
        si: "මුදල් ඒකකය",
        type: "select",
        required: true,
        showInTable: true,
        options: [
          {
            value: "LKR",
            en: "Lkr",
            si: "Lkr",
          },
        ],
      },
      {
        key: "balance",
        en: "Balance",
        si: "හිඟ මුදල",
        type: "readonly",
        showInTable: true,
      },
      {
        key: "status",
        en: "Status",
        si: "තත්ත්වය",
        type: "readonly",
        showInTable: true,
      },
    ],
    inputFields: [
      "patient_id",
      "description",
      "amount",
      "paid_amount",
      "currency",
    ],
    canCreate: true,
    canEdit: true,
    canDelete: false,
  },
  inventory: {
    key: "inventory",
    endpoint: "inventory",
    en: {
      singular: "Stock item",
      plural: "Inventory",
      description:
        "Manage medicines, consumables, suppliers and reorder levels.",
    },
    si: {
      singular: "තොග කළමනාකරණය",
      plural: "තොග කළමනාකරණය",
      description:
        "Manage medicines, consumables, suppliers and reorder levels.",
    },
    fields: [
      {
        key: "name",
        en: "Name",
        si: "නම",
        type: "text",
        required: true,
        showInTable: true,
      },
      {
        key: "sku",
        en: "SKU",
        si: "තොග කේතය",
        type: "text",
        required: true,
        showInTable: true,
      },
      {
        key: "category",
        en: "Category",
        si: "වර්ගය",
        type: "select",
        required: true,
        showInTable: true,
        options: [
          {
            value: "MEDICINE",
            en: "Medicine",
            si: "Medicine",
          },
          {
            value: "CONSUMABLE",
            en: "Consumable",
            si: "Consumable",
          },
          {
            value: "EQUIPMENT",
            en: "Equipment",
            si: "Equipment",
          },
        ],
      },
      {
        key: "quantity",
        en: "Quantity",
        si: "ප්‍රමාණය",
        type: "number",
        required: true,
        showInTable: true,
      },
      {
        key: "reorder_level",
        en: "Reorder level",
        si: "නැවත ඇණවුම් මට්ටම",
        type: "number",
        required: true,
        showInTable: true,
      },
      {
        key: "unit_price",
        en: "Unit price (LKR)",
        si: "ඒකක මිල",
        type: "number",
        required: true,
        showInTable: true,
      },
      {
        key: "expiry_date",
        en: "Expiry date (YYYY-MM-DD)",
        si: "කල් ඉකුත්වන දිනය",
        type: "text",
        required: false,
        showInTable: true,
      },
      {
        key: "supplier",
        en: "Supplier",
        si: "සැපයුම්කරු",
        type: "text",
        required: false,
        showInTable: true,
      },
    ],
    inputFields: [
      "name",
      "sku",
      "category",
      "quantity",
      "reorder_level",
      "unit_price",
      "expiry_date",
      "supplier",
    ],
    canCreate: true,
    canEdit: true,
    canDelete: false,
  },
  "staff-directory": {
    key: "staff-directory",
    endpoint: "staff-directory",
    en: {
      singular: "Staff member",
      plural: "Staff directory",
      description: "Manage staff contacts, designations and shifts.",
    },
    si: {
      singular: "කාර්ය මණ්ඩලය",
      plural: "කාර්ය මණ්ඩලය",
      description: "Manage staff contacts, designations and shifts.",
    },
    fields: [
      {
        key: "name",
        en: "Name",
        si: "නම",
        type: "text",
        required: true,
        showInTable: true,
      },
      {
        key: "designation",
        en: "Designation",
        si: "තනතුර",
        type: "text",
        required: true,
        showInTable: true,
      },
      {
        key: "phone",
        en: "Phone",
        si: "දුරකථන අංකය",
        type: "text",
        required: false,
        showInTable: true,
      },
      {
        key: "email",
        en: "Email",
        si: "විද්‍යුත් තැපෑල",
        type: "text",
        required: false,
        showInTable: true,
      },
      {
        key: "shift",
        en: "Shift",
        si: "සේවා මුරය",
        type: "select",
        required: true,
        showInTable: true,
        options: [
          {
            value: "DAY",
            en: "Day",
            si: "Day",
          },
          {
            value: "NIGHT",
            en: "Night",
            si: "Night",
          },
          {
            value: "ROTATING",
            en: "Rotating",
            si: "Rotating",
          },
        ],
      },
      {
        key: "status",
        en: "Status",
        si: "තත්ත්වය",
        type: "select",
        required: true,
        showInTable: true,
        options: [
          {
            value: "ACTIVE",
            en: "Active",
            si: "Active",
          },
          {
            value: "ON_LEAVE",
            en: "On Leave",
            si: "On Leave",
          },
          {
            value: "INACTIVE",
            en: "Inactive",
            si: "Inactive",
          },
        ],
      },
    ],
    inputFields: ["name", "designation", "phone", "email", "shift", "status"],
    canCreate: true,
    canEdit: true,
    canDelete: false,
  },
});

for (const config of Object.values(resourceConfigs)) {
  for (const field of config.fields) {
    if (field.key === "capacity") {
      field.defaultValue = "20";
      field.min = 1;
      field.step = 1;
    }
    if (field.key === "bed_capacity") {
      field.defaultValue = "30";
      field.min = 1;
      field.step = 1;
    }
    if (["quantity", "reorder_level"].includes(field.key)) field.step = 1;
    if (field.key === "reorder_level") field.defaultValue = "10";
    if (field.key === "temperature") {
      field.min = 25;
      field.step = 0.1;
    }
  }
}
resourceConfigs["ward-admissions"].canDelete = false;

resourceConfigs["audit-events"].en.plural = "Audit events";

const admissionConfig = resourceConfigs["ward-admissions"];
const admissionDate = admissionConfig.fields.find(
  (field) => field.key === "admitted_at",
);
if (admissionDate) {
  admissionDate.type = "datetime";
  admissionDate.en = "Admission date";
}
admissionConfig.fields.push({
  key: "planned_discharge_at",
  en: "Planned discharge date",
  si: "නියමිත පිටත් දිනය",
  type: "datetime",
  showInTable: true,
});
admissionConfig.fields.push({
  key: "bed_assigned_at",
  en: "Bed allocated",
  si: "ඇඳ ලබාදුන් දිනය",
  type: "readonly",
  showInTable: true,
});
admissionConfig.inputFields.push("admitted_at", "planned_discharge_at");

resourceConfigs.queues.fields.push(
  {
    key: "service_type",
    en: "Service stage",
    si: "සේවා අදියර",
    type: "select",
    defaultValue: "GENERAL",
    showInTable: true,
    options: [
      { value: "GENERAL", en: "General", si: "සාමාන්‍ය" },
      { value: "REGISTRATION", en: "Registration", si: "ලියාපදිංචිය" },
      { value: "CONSULTATION", en: "Consultation", si: "වෛද්‍ය හමුව" },
      { value: "DISPENSARY", en: "Dispensary", si: "ඖෂධ නිකුත් කිරීම" },
    ],
  },
  {
    key: "room_id",
    en: "Room / counter",
    si: "කාමරය / කවුන්ටරය",
    type: "uuid-ref",
    refResource: "rooms",
    refLabel: "name",
    showInTable: true,
  },
);
resourceConfigs.queues.inputFields.push("service_type", "room_id");

resourceConfigs.wards.fields.push(
  {
    key: "initial_bed_count",
    en: "Create beds (0 uses ward capacity)",
    si: "සාදන ඇඳන් ගණන (0 නම් වාට්ටුවේ ධාරිතාව)",
    type: "number",
    min: 0,
    defaultValue: "0",
    createOnly: true,
  },
  {
    key: "initial_bed_type",
    en: "Bed type",
    si: "ඇඳ වර්ගය",
    type: "select",
    createOnly: true,
    options: resourceConfigs.beds.fields.find((f) => f.key === "bed_type")
      ?.options,
  },
  {
    key: "bed_number_prefix",
    en: "Bed number prefix",
    si: "ඇඳ අංකයට මුලින් යෙදෙන අකුරු",
    type: "text",
    maxLength: 30,
    defaultValue: "BED-",
    createOnly: true,
  },
  {
    key: "bed_start_number",
    en: "First bed number",
    si: "පළමු ඇඳ අංකය",
    type: "number",
    min: 1,
    defaultValue: "1",
    createOnly: true,
  },
);
resourceConfigs.wards.inputFields.push(
  "initial_bed_count",
  "initial_bed_type",
  "bed_number_prefix",
  "bed_start_number",
);

resourceConfigs.branches.fields.push(
  {
    key: "address",
    en: "Public address",
    si: "රෝහලේ ලිපිනය",
    type: "text",
    maxLength: 500,
    showInTable: true,
  },
  {
    key: "phone",
    en: "Public contact number",
    si: "දුරකථන අංකය",
    type: "text",
    maxLength: 40,
  },
  {
    key: "latitude",
    en: "Latitude",
    si: "අක්ෂාංශ",
    type: "number",
    min: -90,
    step: "any",
  },
  {
    key: "longitude",
    en: "Longitude",
    si: "දේශාංශ",
    type: "number",
    min: -180,
    step: "any",
  },
);
resourceConfigs.branches.inputFields.push(
  "address",
  "phone",
  "latitude",
  "longitude",
);
resourceConfigs.queues.fields.push({
  key: "average_service_minutes",
  en: "Average service time (minutes)",
  si: "සාමාන්‍ය සේවා කාලය (මිනිත්තු)",
  type: "number",
  min: 1,
  step: 1,
  defaultValue: "5",
  required: true,
});
resourceConfigs.queues.inputFields.push("average_service_minutes");

resourceConfigs.wards.fields.find((f) => f.key === "department_id")!.required =
  false;
resourceConfigs.wards.fields.push(
  ...resourceConfigs.departments.fields
    .filter(
      (f) =>
        resourceConfigs.departments.inputFields.includes(f.key) &&
        f.type !== "readonly",
    )
    .map((f) => ({
      ...f,
      key: `new_department_${f.key}`,
      en: `New department: ${f.en}`,
      si: `නව අංශය: ${f.si}`,
      required: false,
      showInTable: false,
      createOnly: true,
    })),
);
resourceConfigs.wards.inputFields.push(
  ...resourceConfigs.wards.fields
    .filter((f) => f.key.startsWith("new_department_"))
    .map((f) => f.key),
);
