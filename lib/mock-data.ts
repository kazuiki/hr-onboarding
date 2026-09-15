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
  email: 'maria.santos@philkoei.com.ph',
  role: 'employee',
  full_name: 'Maria Santos',
  employee_number: 'PKI-2026-0842',
  position: 'Senior Infrastructure Engineer',
  department: 'Civil & Environmental Engineering',
  manager_name: 'Engr. Roberto Cruz',
  start_date: '2026-10-01',
  access_window_days: 30,
  avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop',
  status: 'active',
  welcome_message: 'Mabuhay and welcome to Philkoei International, Inc.! We are thrilled to welcome you to our engineering team. Please complete each of the onboarding requirements below to ensure a smooth transition on your first day.',
  completion_percentage: 65,
  has_watched_orientation: false,
};

export const INITIAL_TASKS: MockTask[] = [
  {
    id: 'task-form-1',
    title: 'Personal Data Sheet (PDS / Form 201)',
    description: 'Complete employee personal, educational, emergency contact, and dependent information.',
    category: 'form',
    status: 'approved',
    required: true,
    display_order: 1,
    submitted_at: '2026-09-12 10:30 AM',
    reviewed_at: '2026-09-13 02:15 PM',
  },
  {
    id: 'task-form-2',
    title: 'BIR Form 1902 / 2316 Withholding Certificate',
    description: 'Submit tax identification and previous employer withholding clearance certificate.',
    category: 'form',
    status: 'submitted',
    required: true,
    display_order: 2,
    submitted_at: '2026-09-14 09:10 AM',
  },
  {
    id: 'task-form-3',
    title: 'Payroll Direct Deposit & Bank Authorization',
    description: 'Provide company payroll partner bank account details for salary disbursement.',
    category: 'form',
    status: 'not_started',
    required: true,
    display_order: 3,
  },
  {
    id: 'task-photo-1',
    title: 'Company ID 2x2 Photograph',
    description: 'Upload high-resolution corporate portrait against a plain white background following company photo guidelines.',
    category: 'photo',
    status: 'approved',
    required: true,
    display_order: 4,
    file_name: 'maria_santos_2x2_formal.jpg',
    submitted_at: '2026-09-12 11:00 AM',
    reviewed_at: '2026-09-13 03:00 PM',
  },
  {
    id: 'task-doc-1',
    title: 'Government Identity Documents (SSS, PhilHealth, Pag-IBIG)',
    description: 'Upload valid member data records or registration cards for statutory benefits.',
    category: 'document',
    status: 'approved',
    required: true,
    display_order: 5,
    file_name: 'gov_benefits_package_msantos.pdf',
    submitted_at: '2026-09-12 11:45 AM',
    reviewed_at: '2026-09-13 03:30 PM',
  },
  {
    id: 'task-doc-2',
    title: 'NBI Clearance (Valid / Current Year)',
    description: 'Original or digitized multi-purpose clearance certificate issued within the past 6 months.',
    category: 'document',
    status: 'needs_changes',
    required: true,
    display_order: 6,
    feedback: 'The uploaded NBI copy is blurry near the QR code verification stamp. Please re-upload a clear, flat scan.',
    file_name: 'nbi_scan_blur.jpg',
    submitted_at: '2026-09-13 04:00 PM',
  },
  {
    id: 'task-doc-3',
    title: 'PRC Professional License & Diploma / Transcript',
    description: 'PRC Professional Regulation Commission Civil Engineer license and official college transcript.',
    category: 'document',
    status: 'submitted',
    required: true,
    display_order: 7,
    file_name: 'prc_license_engineering_2026.pdf',
    submitted_at: '2026-09-14 02:20 PM',
  },
  {
    id: 'task-med-1',
    title: 'Pre-Employment Medical Examination (PEME)',
    description: 'Undergo diagnostic tests at accredited diagnostic clinic and submit completed health fit-to-work clearance.',
    category: 'medical',
    status: 'in_progress',
    required: true,
    display_order: 8,
  },
  {
    id: 'task-firstday-1',
    title: 'First-Day Readiness & Company Orientation',
    description: 'Review arrival schedule, dress code, office reporting desk, and watch the corporate intro.',
    category: 'first_day',
    status: 'approved',
    required: true,
    display_order: 9,
  },
  {
    id: 'task-privacy-1',
    title: 'Corporate Data Privacy & Confidentiality Consent',
    description: 'Read and legally acknowledge the Philkoei Employee Privacy Policy and IP protection guidelines.',
    category: 'privacy',
    status: 'approved',
    required: true,
    display_order: 10,
    submitted_at: '2026-09-12 09:00 AM',
  },
];

export const INITIAL_MEDICAL: MockMedicalGuide = {
  clinic_name: 'Hi-Precision Diagnostic & Corporate Health Center',
  clinic_address: '4th Floor, V-Corporate Centre, 125 L.P. Leviste St, Salcedo Village, Makati City',
  clinic_schedule: 'Monday – Saturday: 7:00 AM to 3:00 PM (8-10 hour fasting recommended for blood chemistry)',
  expense_notes: 'All standard Package A tests (CBC, Urinalysis, Fecalysis, Chest X-ray, Physical Exam) are directly billed to Philkoei International, Inc. Present your printed Referral Slip upon arrival.',
  status: 'in_progress',
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
    hr_response: 'Hi Maria! Yes, you may visit Hi-Precision Diagnostic Alabang branch located along Commerce Avenue. Just present the exact same Philkoei Referral Slip.',
    responded_at: '2026-09-13 11:30 AM',
  },
];

export const INITIAL_AUDIT_LOGS: MockAuditEvent[] = [
  {
    id: 'aud-1',
    actor_name: 'Elena Gomez',
    actor_role: 'HR Director',
    action: 'CREATE_EMPLOYEE',
    target: 'Maria Santos (PKI-2026-0842)',
    timestamp: '2026-09-12 08:30:15 AM',
    details: 'Created onboarding packet and assigned Standard Engineering Onboarding Template.',
  },
  {
    id: 'aud-2',
    actor_name: 'Maria Santos',
    actor_role: 'Employee',
    action: 'PRIVACY_CONSENT',
    target: 'Policy Ref: PKI-DP-2026-V3',
    timestamp: '2026-09-12 09:00:44 AM',
    details: 'Recorded digital consent and signature timestamp from IP 112.204.18.92.',
  },
  {
    id: 'aud-3',
    actor_name: 'Elena Gomez',
    actor_role: 'HR Director',
    action: 'REVIEW_APPROVE',
    target: 'Company ID 2x2 Photograph',
    timestamp: '2026-09-13 03:00:22 PM',
    details: 'Verified 2x2 formal photo compliance with white background.',
  },
  {
    id: 'aud-4',
    actor_name: 'Elena Gomez',
    actor_role: 'HR Director',
    action: 'REVIEW_REJECT',
    target: 'NBI Clearance (Valid / Current Year)',
    timestamp: '2026-09-13 04:00:10 PM',
    details: 'Requested re-upload due to illegible QR code stamp.',
  },
  {
    id: 'aud-5',
    actor_name: 'Maria Santos',
    actor_role: 'Employee',
    action: 'SUBMIT_FORM',
    target: 'BIR Form 1902 / 2316 Withholding',
    timestamp: '2026-09-14 09:10:00 AM',
    details: 'Completed digital submission of tax withholding form.',
  },
];

export const ALL_EMPLOYEES_LIST: MockEmployeeProfile[] = [
  INITIAL_EMPLOYEE,
  {
    id: 'emp-002',
    email: 'gabriel.tan@philkoei.com.ph',
    role: 'employee',
    full_name: 'Gabriel Tan',
    employee_number: 'PKI-2026-0843',
    position: 'Junior Structural BIM Specialist',
    department: 'Structural Design & Drafting',
    manager_name: 'Engr. Roberto Cruz',
    start_date: '2026-10-15',
    access_window_days: 30,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop',
    status: 'active',
    welcome_message: 'Welcome to Philkoei, Gabriel!',
    completion_percentage: 25,
    has_watched_orientation: false,
  },
  {
    id: 'emp-003',
    email: 'kristine.reyes@philkoei.com.ph',
    role: 'employee',
    full_name: 'Kristine Reyes',
    employee_number: 'PKI-2026-0844',
    position: 'Environmental Compliance Officer',
    department: 'Civil & Environmental Engineering',
    manager_name: 'Dr. Andrea Lim',
    start_date: '2026-09-20',
    access_window_days: 30,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
    status: 'active',
    welcome_message: 'Welcome to the Environmental team, Kristine!',
    completion_percentage: 90,
    has_watched_orientation: true,
  },
  {
    id: 'emp-004',
    email: 'alex.mendoza@philkoei.com.ph',
    role: 'employee',
    full_name: 'Alex Mendoza',
    employee_number: 'PKI-2026-0845',
    position: 'Senior Project Cost Analyst',
    department: 'Finance & Project Controls',
    manager_name: 'Elena Gomez',
    start_date: '2026-11-01',
    access_window_days: 30,
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop',
    status: 'active',
    welcome_message: 'Welcome Alex!',
    completion_percentage: 10,
    has_watched_orientation: false,
  },
];
