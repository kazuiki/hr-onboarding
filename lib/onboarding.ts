// Shared onboarding constants (no server imports — safe for client + API).

/** Subpath prefix when the app serves under one (NEXT_PUBLIC_BASE_PATH). Empty in local dev. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/**
 * Prefix client-side URLs (fetch calls, file links) with the deploy subpath.
 * next/link, router, and redirects apply basePath alone — do not wrap those.
 */
export function apiUrl(path: string): string {
  return `${BASE_PATH}${path}`;
}

export type TaskCategory =
  | 'welcome'
  | 'form'
  | 'photo'
  | 'document'
  | 'medical'
  | 'first_day'
  | 'privacy'
  | 'help'
  | 'completion';

export type TaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'needs_changes'
  | 'approved';

export interface RequirementSeed {
  slug: string;
  title: string;
  description: string;
  category: TaskCategory;
  required: boolean;
  displayOrder: number;
  hasDownload: boolean;
}

/** Packet contents stamped onto every new hire at invite time. */
export const DEFAULT_REQUIREMENTS: RequirementSeed[] = [
  { slug: 'req-app-form', title: 'Employment Application Form', description: 'Official application form with personal and employment background.', category: 'document', required: true, displayOrder: 1, hasDownload: true },
  { slug: 'req-psa-birth', title: 'PSA Birth Certificate', description: 'Philippine Statistics Authority issued birth certificate copy.', category: 'document', required: true, displayOrder: 2, hasDownload: false },
  { slug: 'req-sss', title: 'SSS Form E1 / SSS ID', description: 'Social Security System Form E-1 or member ID.', category: 'document', required: true, displayOrder: 3, hasDownload: false },
  { slug: 'req-philhealth', title: 'PhilHealth MDR', description: 'PhilHealth Member Data Record or ID copy.', category: 'document', required: true, displayOrder: 4, hasDownload: false },
  { slug: 'req-pagibig', title: 'PAG-IBIG MDR', description: 'HDMF Member Data Record with MID number.', category: 'document', required: true, displayOrder: 5, hasDownload: false },
  { slug: 'req-bir-2316', title: 'BIR Form 2316', description: 'Certificate of compensation payment / tax withheld from the previous employer.', category: 'document', required: true, displayOrder: 6, hasDownload: false },
  { slug: 'req-bir-1902', title: 'BIR Form 1902 / TIN ID', description: 'Application for registration or TIN card.', category: 'document', required: true, displayOrder: 7, hasDownload: false },
  { slug: 'req-diploma', title: 'Diploma', description: 'College or university graduation diploma scan.', category: 'document', required: true, displayOrder: 8, hasDownload: false },
  { slug: 'req-tor', title: 'Transcript of Records', description: 'Official transcript with school seal.', category: 'document', required: true, displayOrder: 9, hasDownload: false },
  { slug: 'req-nbi', title: 'NBI Clearance', description: 'Valid multi-purpose NBI clearance issued within the last 6 months.', category: 'document', required: true, displayOrder: 10, hasDownload: false },
  { slug: 'req-photo', title: '2x2 / 1x1 Photo', description: 'Formal corporate portrait on white background.', category: 'photo', required: true, displayOrder: 11, hasDownload: false },
  { slug: 'req-marriage-cert', title: 'Marriage Certificate', description: 'PSA marriage certificate (married employees only).', category: 'document', required: false, displayOrder: 12, hasDownload: false },
  { slug: 'req-prc', title: 'PRC License', description: 'Professional Regulation Commission license card, front and back.', category: 'document', required: false, displayOrder: 13, hasDownload: false },
  { slug: 'req-coe', title: 'Certificate of Employment', description: 'Certificate of employment from previous employer.', category: 'document', required: false, displayOrder: 14, hasDownload: false },
  { slug: 'task-med-1', title: 'Medical Examination and Health Clearance', description: 'Pre-employment medical examination at the accredited clinic.', category: 'medical', required: true, displayOrder: 15, hasDownload: false },
  { slug: 'task-firstday-1', title: 'First Day Readiness and Orientation', description: 'Arrival schedule, dress code and reporting details.', category: 'first_day', required: true, displayOrder: 16, hasDownload: false },
  { slug: 'task-privacy-1', title: 'Data Privacy Policy and Consent', description: 'Read and acknowledge the company privacy notice.', category: 'privacy', required: true, displayOrder: 17, hasDownload: false },
];

export interface UploadDocTarget {
  value: string;
  label: string;
  category: TaskCategory;
  target: { kind: 'task'; keyword: string } | { kind: 'slot'; slot: string; section: string };
}

/** The seven fixed HR Upload Company Files options and their targets. */
export const UPLOAD_DOC_TYPES: UploadDocTarget[] = [
  { value: 'employment-forms', label: 'Employment Forms', category: 'document', target: { kind: 'task', keyword: 'application form' } },
  { value: 'data-privacy', label: 'Data Privacy Notice & Consent', category: 'privacy', target: { kind: 'slot', slot: 'form-data-privacy', section: 'forms' } },
  { value: 'manual-conforme', label: 'Employee Manual Conforme', category: 'form', target: { kind: 'slot', slot: 'form-manual-conforme', section: 'forms' } },
  { value: 'id-conforme', label: 'Company ID Conforme', category: 'form', target: { kind: 'slot', slot: 'form-id-conforme', section: 'forms' } },
  { value: 'code-conduct', label: 'NK Code of Conduct', category: 'form', target: { kind: 'slot', slot: 'form-code-conduct', section: 'forms' } },
  { value: 'comprehension', label: 'Comprehension Test', category: 'form', target: { kind: 'slot', slot: 'form-comprehension', section: 'forms' } },
  { value: 'medical-referral', label: 'Medical Referral Form', category: 'medical', target: { kind: 'slot', slot: 'medical-referral', section: 'medical' } },
];

/** Employee-side form cards in the Employment Forms section. */
export const EMPLOYMENT_FORMS: { id: string; title: string; desc: string }[] = [
  { id: 'form-data-privacy', title: 'Data Privacy Form', desc: 'Company data privacy agreement' },
  { id: 'form-manual-conforme', title: 'Employee Manual Conforme', desc: 'Acknowledgment of employee handbook' },
  { id: 'form-id-conforme', title: 'Company ID Conforme', desc: 'Company ID request and agreement' },
  { id: 'form-code-conduct', title: 'NK Code of Conduct', desc: 'Code of conduct acknowledgment' },
  { id: 'form-comprehension', title: 'Comprehension Test', desc: 'Employee handbook comprehension assessment' },
];

/** First-day orientation checklist items with stable keys for database storage. */
export interface FirstDayChecklistItem {
  key: string;
  label: string;
}

export const FIRST_DAY_CHECKLIST_ITEMS: FirstDayChecklistItem[] = [
  { key: 'hr-orientation', label: 'HR Orientation' },
  { key: 'admin-orientation', label: 'Administrative Orientation' },
  { key: 'finance-orientation', label: 'Finance Orientation' },
  { key: 'it-orientation', label: 'IT Orientation' },
  { key: 'qms-orientation', label: 'QMS Orientation' },
  { key: 'osh-orientation', label: 'OSH Orientation' },
  { key: 'manual-reading', label: 'Reading of Employee Manual' },
  { key: 'payroll-account', label: 'Opening Payroll Account' },
  { key: 'office-tour', label: 'Office Tour' },
  { key: 'superior-orientation', label: 'Orientation with Immediate Superior' },
];

/** Per-hire editable copy of the dashboard's "Accredited Medical Clinic"
 *  card (3 rows: name + address line, phone line, hours line). HR edits
 *  this for one specific employee; hires without a saved row see defaults. */
export interface MedicalClinicContent {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicHours: string;
}

/** Shown to every new hire until HR saves employee-specific content. */
export const DEFAULT_MEDICAL_CLINIC: MedicalClinicContent = {
  clinicName: 'Clinica Manila',
  clinicAddress:
    'at SM Center Pasig, E. Rodriguez Jr. Ave corner Dona Julia Vargas Ave., Frontera Verde, Ortigas Center, Pasig, 1604 Metro Manila.',
  clinicPhone: '(02) 8696 7055',
  clinicHours: 'Monday to Saturday: 8:00 AM – 6:00 PM',
};

function medicalText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

/** Normalize a employee_medical_content row; null when the hire has no saved row. */
export function medicalClinicFromRow(
  row: Record<string, unknown> | null | undefined
): MedicalClinicContent | null {
  if (!row) return null;
  const d = DEFAULT_MEDICAL_CLINIC;
  return {
    clinicName: medicalText(row.clinic_name, d.clinicName),
    clinicAddress: medicalText(row.clinic_address, d.clinicAddress),
    clinicPhone: medicalText(row.clinic_phone, d.clinicPhone),
    clinicHours: medicalText(row.clinic_hours, d.clinicHours),
  };
}

/** Download URL for an uploaded file. Served via the authenticated /api/files route (never raw static). */
export function fileUrl(storedPath: string | null | undefined): string {
  if (!storedPath) return '#';
  const clean = storedPath.startsWith('/') ? storedPath : `/${storedPath}`;
  if (!clean.startsWith('/uploads/')) return clean;
  return apiUrl(`/api/files${clean}`);
}

const MONTHS = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];

export function formatStartDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d || m < 1 || m > 12) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function sectionForCategory(category: TaskCategory): string {
  switch (category) {
    case 'photo':
      return 'photo';
    case 'medical':
      return 'medical';
    case 'first_day':
      return 'first_day';
    case 'privacy':
      return 'privacy';
    case 'form':
      return 'forms';
    case 'help':
      return 'help';
    case 'welcome':
      return 'welcome';
    case 'document':
    default:
      return 'pre_employment';
  }
}
