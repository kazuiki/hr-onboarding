import { UserRole, TaskStatus, TaskCategory, HelpStatus } from '@/supabase/types/database.types';

export interface MockEmployeeProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  employee_number: string;
  position: string;
  department: string;
  manager_name: string;
  start_date: string;
  access_window_days: number;
  avatar_url: string;
  status: 'active' | 'completed' | 'archived';
  welcome_message: string;
  completion_percentage: number;
  has_watched_orientation: boolean;
}

export interface MockTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  required: boolean;
  display_order: number;
  feedback?: string;
  submitted_at?: string;
  reviewed_at?: string;
  file_name?: string;
  file_path?: string;
  file_size?: number;
  has_download?: boolean;
  download_url?: string;
}

export interface MockMedicalGuide {
  clinic_name: string;
  clinic_address: string;
  clinic_schedule: string;
  expense_notes: string;
  status: TaskStatus;
  referral_doc_url?: string;
  submitted_proof_name?: string;
}

export interface MockFirstDayGuide {
  office_name: string;
  office_address: string;
  arrival_time: string;
  dress_code: string;
  reporting_to: string;
  items_to_bring: string[];
  intro_video_url: string;
  map_instructions: string;
}

export interface MockHelpInquiry {
  id: string;
  subject: string;
  message: string;
  status: HelpStatus;
  created_at: string;
  hr_response?: string;
  responded_at?: string;
}

export interface MockAuditEvent {
  id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  target: string;
  timestamp: string;
  details: string;
}

export const INITIAL_EMPLOYEE: MockEmployeeProfile = {
  id: 'emp-001',
  email: 'john.arcas@philkoei.com.ph',
  role: 'employee',
  full_name: 'John Pritch L. Arcas',
  employee_number: 'PKI-2026-0842',
  position: 'Senior Infrastructure Engineer',
  department: 'Civil & Environmental Engineering',
  manager_name: 'Engr. Roberto Cruz',
  start_date: '2026-10-01',
  access_window_days: 30,
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
  status: 'active',
  welcome_message: 'Mabuhay and welcome to Philkoei International, Inc.! We are thrilled to welcome you to our engineering team. Please complete each of the onboarding requirements below to ensure a smooth transition on your first day.',
  completion_percentage: 0,
  has_watched_orientation: true,
};

export const INITIAL_TASKS: MockTask[] = [
  // Employment Forms & Documents
  {
    id: 'req-app-form',
    title: 'Employment Application Form',
    description: 'Official Philkoei Application Form with personal and employment background.',
    category: 'form',
    status: 'not_started',
    required: true,
    display_order: 1,
    has_download: true,
    download_url: '#download-application-form',
  },
  {
    id: 'req-psa-birth',
    title: 'PSA Birth Certificate',
    description: 'Official Philippine Statistics Authority (PSA) issued Birth Certificate copy.',
    category: 'document',
    status: 'needs_changes',
    required: true,
    display_order: 2,
    file_name: 'PSA-birth-cert.jpg',
    submitted_at: 'Yesterday',
    feedback: 'The uploaded scan is blurred and the lower portion is cut off. Please re-upload a clear, complete copy.',
  },
  {
    id: 'req-marriage-cert',
    title: 'Marriage Certificate',
    description: 'PSA issued Marriage Certificate (required only for married employees).',
    category: 'document',
    status: 'not_started',
    required: false,
    display_order: 3,
  },
  {
    id: 'req-sss',
    title: 'SSS Form E1 / SSS ID',
    description: 'Social Security System (SSS) Form E-1, digitized ID, or verified static member profile.',
    category: 'document',
    status: 'not_started',
    required: true,
    display_order: 4,
  },
  {
    id: 'req-philhealth',
    title: 'PhilHealth MDR',
    description: 'Updated PhilHealth Member Data Record or official PhilHealth ID copy.',
    category: 'document',
    status: 'not_started',
    required: true,
    display_order: 5,
  },
  {
    id: 'req-photo',
    title: '2x2 / 1x1 Photo',
    description: 'Formal corporate portrait with white background for company ID printing & records.',
    category: 'photo',
    status: 'not_started',
    required: true,
    display_order: 6,
  },
  {
    id: 'req-bir-2316',
    title: 'BIR Form 2316',
    description: 'Certificate of Compensation Payment / Tax Withheld from immediate previous employer (current year).',
    category: 'document',
    status: 'not_started',
    required: true,
    display_order: 7,
  },
  {
    id: 'req-pagibig',
    title: 'PAG-IBIG MDR',
    description: 'HDMF Member Data Record showing Pag-IBIG MID number and transaction details.',
    category: 'document',
    status: 'not_started',
    required: true,
    display_order: 8,
  },
  {
    id: 'req-bir-1902',
    title: 'BIR Form 1902 / TIN ID',
    description: 'Application for Registration or official Taxpayer Identification Number card.',
    category: 'document',
    status: 'not_started',
    required: true,
    display_order: 9,
  },
  {
    id: 'req-diploma',
    title: 'Diploma',
    description: 'Official College / University Graduation Diploma (clear authenticated scan).',
    category: 'document',
    status: 'not_started',
    required: true,
    display_order: 10,
  },
  {
    id: 'req-tor',
    title: 'Transcript of Records',
    description: 'Complete Official Transcript of Records (TOR) with school seal / registrar validation.',
    category: 'document',
    status: 'not_started',
    required: true,
    display_order: 11,
  },
  {
    id: 'req-prc',
    title: 'PRC License',
    description: 'Professional Regulation Commission (PRC) License identification card (front & back).',
    category: 'document',
    status: 'not_started',
    required: false,
    display_order: 12,
  },
  {
    id: 'req-nbi',
    title: 'NBI Clearance',
    description: 'Valid multi-purpose NBI Clearance certificate issued within the last 6 months.',
    category: 'document',
    status: 'not_started',
    required: true,
    display_order: 13,
  },
  {
    id: 'req-coe',
    title: 'Certificate of Employment',
    description: 'Certificate of Employment (COE) and clearance from previous employer/s.',
    category: 'document',
    status: 'not_started',
    required: false,
    display_order: 14,
  },

  // Supporting Section Items
  {
    id: 'task-med-1',
    title: 'Medical Examination & Health Clearance',
    description: 'Complete Pre-Employment Medical Examination (PEME) at accredited diagnostic clinic.',
    category: 'medical',
    status: 'not_started',
    required: true,
    display_order: 15,
  },
  {
    id: 'task-firstday-1',
    title: 'First Day Readiness & Orientation',
    description: 'Review arrival schedule, dress code, office reporting desk, and welcome guide.',
    category: 'first_day',
    status: 'not_started',
    required: true,
    display_order: 16,
  },
  {
    id: 'task-privacy-1',
    title: 'Data Privacy Policy & Consent',
    description: 'Read and legally acknowledge the Philkoei Employee Privacy Policy and IP guidelines.',
    category: 'privacy',
    status: 'not_started',
    required: true,
    display_order: 17,
  },
];

export const INITIAL_MEDICAL: MockMedicalGuide = {
  clinic_name: 'Hi-Precision Diagnostic & Corporate Health Center',
  clinic_address: '4th Floor, V-Corporate Centre, 125 L.P. Leviste St, Salcedo Village, Makati City',
  clinic_schedule: 'Monday – Saturday: 7:00 AM to 3:00 PM (8-10 hour fasting recommended for blood chemistry)',
  expense_notes: 'All standard Package A tests (CBC, Urinalysis, Fecalysis, Chest X-ray, Physical Exam) are directly billed to Philkoei International, Inc. Present your printed Referral Slip upon arrival.',
  status: 'not_started',
  referral_doc_url: '/assets/docs/Philkoei_Medical_Referral_Slip_2026.pdf',
};

export const INITIAL_FIRST_DAY: MockFirstDayGuide = {
  office_name: 'Philkoei International Corporate Headquarters',
  office_address: '15th Floor, The Enterprise Center Tower 1, 6766 Ayala Avenue, Makati City, Metro Manila',
  arrival_time: '8:00 AM Sharp (PHT)',
  dress_code: 'Smart-Casual (e.g., Collared shirts, tailored blouses, slacks, chinos, formal closed-toe footwear. Distressed denim or casual sandals are strictly prohibited in the office).',
  reporting_to: 'Ms. Elena Gomez (HR People & Culture Department, 15th Flr Reception)',
  items_to_bring: [
    'Original Government Valid IDs (Passport / UMID / Driver’s License)',
    'Original Physical NBI Clearance Certificate',
    'Bank Account Details for Payroll Authorization',
    'Signed Physical Employment Contract Copy',
    'Personal Laptop / Accessories (Optional, IT will issue corporate workstation)',
  ],
  intro_video_url: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
  map_instructions: 'Enter via Paseo de Roxas or Ayala Avenue entrance. Present your visitor ID pass at the main turnstile and take the High-Zone elevator bank to Floor 15.',
};

export const INITIAL_PRIVACY_TEXT = `PHILKOEI INTERNATIONAL, INC. — EMPLOYEE DATA PRIVACY & CONFIDENTIALITY POLICY
Effective Date: September 1, 2026 | Document Ref: PKI-DP-2026-V3

1. PURPOSE & SCOPE
Philkoei International, Inc. ("Company") is committed to protecting the privacy and confidentiality of personal, sensitive, and privileged information provided by its applicants and employees in accordance with Republic Act No. 10173 (Data Privacy Act) and international data governance standards.

2. COLLECTION AND PROCESSING OF PERSONAL DATA
During the onboarding process and throughout employment, the Company collects personal identifying information (full name, government identifiers, contact details, biometric photograph, bank account details) and sensitive personal data (health and medical records, background check records) solely for lawful employment administration, statutory compliance, payroll processing, security identification, and organizational administration.

3. SECURITY & STORAGE POLICIES
All submitted physical and digital files are encrypted, restricted by Row Level Security (RLS) policies, and accessible only to authorized People & Culture officers. Medical records are treated as strictly confidential health information.

4. EMPLOYEE CONSENT & ACKNOWLEDGEMENT
By checking the acknowledgement box and submitting this form, you explicitly authorize Philkoei International, Inc. to process and store your submitted data for employment-related purposes and certify that all information provided is accurate and truthful.`;

export const INITIAL_HELP_INQUIRIES: MockHelpInquiry[] = [
  {
    id: 'help-1',
    subject: 'Question regarding accredited clinic branch in Alabang',
    message: 'Good day HR team! Is there an accredited branch of Hi-Precision in Alabang/Muntinlupa where I can conduct my medical exam?',
    status: 'resolved',
    created_at: '2026-09-13 10:15 AM',
    hr_response: 'Hi John! Yes, you may visit Hi-Precision Diagnostic Alabang branch located along Commerce Avenue. Just present the exact same Philkoei Referral Slip.',
    responded_at: '2026-09-13 11:30 AM',
  },
];

export const INITIAL_AUDIT_LOGS: MockAuditEvent[] = [
  {
    id: 'aud-1',
    actor_name: 'Elena Gomez',
    actor_role: 'HR Director',
    action: 'CREATE_EMPLOYEE',
    target: 'John Pritch L. Arcas (PKI-2026-0842)',
    timestamp: '2026-09-12 08:30:15 AM',
    details: 'Created onboarding packet and assigned Standard Engineering Onboarding Template.',
  },
];

export const ALL_EMPLOYEES_LIST: MockEmployeeProfile[] = [
  INITIAL_EMPLOYEE,
  {
    id: 'emp-002',
    email: 'maria.santos@philkoei.com.ph',
    role: 'employee',
    full_name: 'Maria Santos',
    employee_number: 'PKI-2026-0843',
    position: 'Junior Structural BIM Specialist',
    department: 'Structural Design & Drafting',
    manager_name: 'Engr. Roberto Cruz',
    start_date: '2026-10-15',
    access_window_days: 30,
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop',
    status: 'active',
    welcome_message: 'Welcome to Philkoei, Maria!',
    completion_percentage: 25,
    has_watched_orientation: false,
  },
];
