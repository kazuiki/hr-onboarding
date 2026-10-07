// Shared onboarding constants (no server imports — safe for client + API).

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
