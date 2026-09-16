"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileText,
  HelpCircle,
  Hourglass,
  Info,
  Lock,
  LogOut,
  MapPin,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UploadCloud,
  X,
} from 'lucide-react';

import {
  INITIAL_EMPLOYEE,
  INITIAL_FIRST_DAY,
  INITIAL_HELP_INQUIRIES,
  INITIAL_MEDICAL,
  INITIAL_PRIVACY_TEXT,
  INITIAL_TASKS,
  MockHelpInquiry,
  MockTask,
} from '@/lib/mock-data';
import { TaskStatus } from '@/supabase/types/database.types';

type NavSection =
  | 'welcome'
  | 'forms'
  | 'photo'
  | 'pre_employment'
  | 'medical'
  | 'first_day'
  | 'privacy'
  | 'help';

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'welcome', label: 'Welcome', icon: Sparkles },
  { id: 'forms', label: 'Employment Forms', icon: FileText, badge: 'Restricted' },
  { id: 'photo', label: 'ID Photo', icon: Camera },
  { id: 'pre_employment', label: 'Pre-Employment Requirements', icon: ShieldCheck },
  { id: 'medical', label: 'Medical', icon: Stethoscope },
  { id: 'first_day', label: 'First Day Preparation', icon: Briefcase },
  { id: 'privacy', label: 'Data Privacy', icon: Lock },
  { id: 'help', label: 'Need Help', icon: HelpCircle },
];

function renderStatusBadge(status: TaskStatus) {
  switch (status) {
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Approved
        </span>
      );
    case 'submitted':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Submitted
        </span>
      );
    case 'needs_changes':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          Needs Changes
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#eaf2f8] text-[#005b96] border border-[#b3cde0]">
          <Clock className="w-3.5 h-3.5 text-[#005b96]" />
          In Progress
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          Not Started
        </span>
      );
  }
}

export default function EmployeeDashboardPage() {
  const router = useRouter();

  const [employee] = useState(INITIAL_EMPLOYEE);
  const [tasks, setTasks] = useState<MockTask[]>(INITIAL_TASKS);
  const [medical] = useState(INITIAL_MEDICAL);
  const [helpInquiries, setHelpInquiries] = useState<MockHelpInquiry[]>(INITIAL_HELP_INQUIRIES);

  // Active section controlled by Left Sidebar (defaulting to pre_employment as requested)
  const [activeSection, setActiveSection] = useState<NavSection>('pre_employment');

  // Modals & Upload State
  const [uploadTask, setUploadTask] = useState<MockTask | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Help State
  const [helpSubject, setHelpSubject] = useState('');
  const [helpMessage, setHelpMessage] = useState('');
  const [helpSubmitted, setHelpSubmitted] = useState(false);

  // Photo Preview State
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop'
  );

  // Form Inputs State
  const [pdsData, setPdsData] = useState({
    tin: '321-456-789-000',
    sss: '34-5678912-3',
    philhealth: '12-345678901-2',
    pagibig: '1234-5678-9012',
    bankAccount: 'BDO Unibank - 004812399120',
    emergencyContact: 'Carlos Santos (Spouse) - +63 917 555 0192',
  });

  // Check orientation gate
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const watched = localStorage.getItem('pki_orientation_watched') === 'true';
    if (!watched) {
      router.replace('/orientation');
    }
  }, [router]);

  // Overall Progress Calculation
  const totalRequired = tasks.filter((t) => t.required).length;
  const approvedCount = tasks.filter((t) => t.required && t.status === 'approved').length;
  const progressPct = Math.round((approvedCount / (totalRequired || 1)) * 100);

  // Filter tasks specific to Pre-Employment Requirements checklist
  const preEmploymentRequirements = useMemo(() => {
    return tasks.filter((t) =>
      [
        'req-app-form',
        'req-psa-birth',
        'req-marriage-cert',
        'req-sss',
        'req-philhealth',
        'req-photo',
        'req-bir-2316',
        'req-pagibig',
        'req-bir-1902',
        'req-diploma',
        'req-tor',
        'req-prc',
        'req-nbi',
        'req-coe',
      ].includes(t.id)
    );
  }, [tasks]);

  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTask || !uploadFile) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === uploadTask.id
          ? {
              ...t,
              status: 'submitted',
              file_name: uploadFile.name,
              submitted_at: 'Just now',
              feedback: undefined,
            }
          : t
      )
    );

    setUploadSuccess(true);
    setTimeout(() => {
      setUploadSuccess(false);
      setUploadTask(null);
      setUploadFile(null);
    }, 1200);
  };

  const handleSendHelp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!helpSubject || !helpMessage) return;

    setHelpInquiries((prev) => [
      ...prev,
      {
        id: `help-${Date.now()}`,
        subject: helpSubject,
        message: helpMessage,
        status: 'open',
        created_at: 'Just now',
      },
    ]);

    setHelpSubject('');
    setHelpMessage('');
    setHelpSubmitted(true);
    setTimeout(() => setHelpSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col font-sans">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-40 bg-[#011f4b] border-b border-[#03396c] text-white shadow-md">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Branding Left */}
            <div className="flex items-center gap-3">
              <Image
                src="/pkii_logo.png"
                alt="Philkoei International, Inc."
                width={180}
                height={44}
                className="h-11 w-auto object-contain"
                priority
              />
            </div>

            {/* Profile & Countdown Right */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Countdown Timer Badge */}
              <div className="flex items-center gap-2 bg-[#03396c] border border-[#005b96]/60 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#b3cde0] shadow-sm">
                <Hourglass className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-white font-bold">30 days remaining</span>
              </div>

              {/* User Profile Info */}
              <div className="flex items-center gap-3 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[#b3cde0] shrink-0 bg-[#005b96]">
                  <Image
                    src={employee.avatar_url}
                    alt={employee.full_name}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-bold text-white leading-tight">
                    {employee.full_name}
                  </div>
                  <div className="text-[10px] text-[#b3cde0]">
                    {employee.employee_number} · {employee.position}
                  </div>
                </div>
              </div>

              {/* Sign Out */}
              <Link
                href="/login"
                className="text-[#b3cde0] hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main 3-Column Layout Container */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 2. Left Sidebar Navigation */}
          <aside className="lg:col-span-3 bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-sm sticky top-24">
            <div className="text-xs font-bold uppercase tracking-wider text-[#6497b1] px-3 pb-3 mb-2 border-b border-[#f1f5f9]">
              Onboarding Portal Directory
            </div>

            <nav className="space-y-1.5">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#005b96] text-white shadow-sm'
                        : 'text-[#03396c] hover:bg-[#eaf2f8] hover:text-[#005b96]'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-[#6497b1]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* 3. Main Content Area */}
          <main className="lg:col-span-6 space-y-6">
            {/* SECTION: Pre-Employment Requirements */}
            {activeSection === 'pre_employment' && (
              <div className="space-y-5">
                {/* Header Banner */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#eaf2f8] text-[#005b96] mb-2">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Compliance Verification Workspace
                      </div>
                      <h1 className="text-xl font-extrabold text-[#011f4b]">
                        Pre-Employment Requirements
                      </h1>
                      <p className="text-xs text-[#6497b1] mt-1 leading-relaxed">
                        Please upload clear, legible copies of all mandatory onboarding files. Items
                        marked with an asterisk (<span className="text-rose-600 font-bold">*</span>)
                        are strictly mandatory before your start date.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const formTask = tasks.find((t) => t.id === 'req-app-form');
                        if (formTask) setUploadTask(formTask);
                      }}
                      className="inline-flex items-center gap-2 bg-[#005b96] hover:bg-[#03396c] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Form Templates
                    </button>
                  </div>
                </div>

                {/* Requirements Checklist List */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
                  <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#011f4b]">
                      Required Documents &amp; Certificates
                    </span>
                    <span className="text-xs text-[#6497b1] font-medium">
                      {preEmploymentRequirements.filter((t) => t.status === 'approved').length} of{' '}
                      {preEmploymentRequirements.length} Completed
                    </span>
                  </div>

                  <div className="divide-y divide-[#e2e8f0]">
                    {preEmploymentRequirements.map((req) => (
                      <div
                        key={req.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#fafcff] transition-colors"
                      >
                        {/* Requirement Info */}
                        <div className="space-y-1 max-w-md">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-[#011f4b]">
                              {req.title}
                              {req.required ? (
                                <span className="text-rose-600 font-extrabold ml-1" title="Mandatory">*</span>
                              ) : (
                                <span className="text-xs font-normal text-[#6497b1] ml-1.5 italic">
                                  (If Applicable)
                                </span>
                              )}
                            </h3>
                            {renderStatusBadge(req.status)}
                          </div>

                          <p className="text-xs text-[#6497b1] leading-relaxed">
                            {req.description}
                          </p>

                          {req.file_name && (
                            <div className="inline-flex items-center gap-1.5 text-xs text-[#005b96] font-semibold bg-[#eaf2f8] px-2.5 py-0.5 rounded-md mt-1">
                              <FileCheck className="w-3.5 h-3.5" />
                              {req.file_name}
                            </div>
                          )}

                          {req.feedback && (
                            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 mt-2 flex items-start gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>{req.feedback}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {req.has_download && (
                            <button
                              type="button"
                              onClick={() => {
                                alert(
                                  'Downloading official Employment Application Form template (PDF)...'
                                );
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-[#b3cde0] text-[#005b96] hover:bg-[#eaf2f8] rounded-xl transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download Form
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setUploadTask(req)}
                            className="inline-flex items-center gap-1.5 bg-[#005b96] hover:bg-[#03396c] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            {req.status === 'needs_changes'
                              ? 'Re-upload'
                              : req.status === 'submitted' || req.status === 'approved'
                              ? 'Update File'
                              : 'Upload'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Warning Footer Note */}
                  <div className="p-4 bg-[#f1f5f9]/70 border-t border-[#e2e8f0] flex items-start gap-2.5 text-xs text-[#475569] leading-relaxed">
                    <Info className="w-4 h-4 text-[#005b96] shrink-0 mt-0.5" />
                    <p>
                      <strong>Important:</strong> Ensure all scanned documents and photos are clear,
                      legible, and up to date. Incomplete or blurred submissions will be marked as
                      &quot;Needs Changes&quot; by HR and will require re-uploading.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION: Welcome */}
            {activeSection === 'welcome' && (
              <div className="space-y-5">
                <div className="bg-gradient-to-r from-[#011f4b] via-[#03396c] to-[#005b96] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#005b96]/30 relative overflow-hidden">
                  <div className="space-y-4 max-w-xl">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold text-[#b3cde0] border border-white/20">
                      <Sparkles className="w-3.5 h-3.5 text-[#b3cde0]" />
                      Active Onboarding Session
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      Welcome, {employee.full_name}!
                    </h1>
                    <p className="text-sm text-[#b3cde0] leading-relaxed">
                      {employee.welcome_message}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-[#e2e8f0] p-4 rounded-2xl">
                    <span className="text-xs text-[#6497b1] block">Assigned Department</span>
                    <span className="text-sm font-bold text-[#011f4b]">{employee.department}</span>
                  </div>
                  <div className="bg-white border border-[#e2e8f0] p-4 rounded-2xl">
                    <span className="text-xs text-[#6497b1] block">Reporting Manager</span>
                    <span className="text-sm font-bold text-[#011f4b]">{employee.manager_name}</span>
                  </div>
                  <div className="bg-white border border-[#e2e8f0] p-4 rounded-2xl">
                    <span className="text-xs text-[#6497b1] block">Employee Number</span>
                    <span className="text-sm font-bold text-[#011f4b]">
                      {employee.employee_number}
                    </span>
                  </div>
                  <div className="bg-white border border-[#e2e8f0] p-4 rounded-2xl">
                    <span className="text-xs text-[#6497b1] block">Expected Start Date</span>
                    <span className="text-sm font-bold text-[#011f4b]">{employee.start_date}</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
                  <h3 className="text-sm font-bold text-[#011f4b] mb-2">Getting Started</h3>
                  <p className="text-xs text-[#6497b1] leading-relaxed mb-4">
                    Please use the checklist on the right to complete all required stages: paperwork,
                    ID photo, document requirements, medical examination, first-day preparation, and
                    data privacy acknowledgement.
                  </p>
                  <button
                    onClick={() => setActiveSection('pre_employment')}
                    className="inline-flex items-center gap-2 bg-[#005b96] hover:bg-[#03396c] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
                  >
                    Go to Pre-Employment Checklist
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* SECTION: Employment Forms */}
            {activeSection === 'forms' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#eaf2f8] flex items-center justify-center text-[#005b96]">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#011f4b]">Employment Forms</h2>
                        <p className="text-xs text-[#6497b1]">
                          Mandatory tax, payroll, and personal data forms.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      Restricted Access
                    </span>
                  </div>

                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800 mb-4 flex items-start gap-2">
                    <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <span>
                      These forms require digital verification and are locked for direct physical edits.
                      You can complete them online using the form assistant below.
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        title: 'Personal Data Sheet (PDS / Form 201)',
                        desc: 'Emergency contact, dependents, and personal identification data.',
                      },
                      {
                        title: 'BIR Form 1902 / 2316 Withholding Certificate',
                        desc: 'Tax registration and previous employer withholding clearance.',
                      },
                      {
                        title: 'Payroll Direct Deposit Bank Authorization',
                        desc: 'Disbursement bank details for monthly compensation.',
                      },
                    ].map((formItem, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-bold text-xs text-[#011f4b]">{formItem.title}</div>
                          <div className="text-[11px] text-[#6497b1] mt-0.5">{formItem.desc}</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsFormModalOpen(true)}
                          className="inline-flex items-center gap-1.5 bg-[#005b96] hover:bg-[#03396c] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shrink-0"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          Fill Form Online
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION: ID Photo */}
            {activeSection === 'photo' && (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#eaf2f8] flex items-center justify-center text-[#005b96]">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#011f4b]">
                      Company ID 2x2 / 1x1 Photo
                    </h2>
                    <p className="text-xs text-[#6497b1]">
                      Official portrait used for company RFID access badge and security registry.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  <div className="md:col-span-1 border border-[#b3cde0] rounded-2xl p-5 bg-[#f8fafc] flex flex-col items-center text-center">
                    <div className="w-40 h-40 rounded-2xl overflow-hidden border-4 border-white shadow-md mb-4 bg-slate-200 relative">
                      {idPhotoPreview ? (
                        <Image
                          src={idPhotoPreview}
                          alt="Uploaded 2x2 Portrait"
                          width={160}
                          height={160}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[#6497b1]">
                          <Camera className="w-8 h-8 mb-1" />
                          <span className="text-[11px]">No photo uploaded</span>
                        </div>
                      )}
                    </div>

                    <label className="w-full cursor-pointer bg-[#005b96] hover:bg-[#03396c] text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                      <UploadCloud className="w-4 h-4" />
                      Upload Photo
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const url = URL.createObjectURL(e.target.files[0]);
                            setIdPhotoPreview(url);
                          }
                        }}
                      />
                    </label>
                    <span className="text-[10px] text-[#6497b1] mt-2">
                      JPG or PNG, Max 5MB (Plain white background)
                    </span>
                  </div>

                  <div className="md:col-span-2 border border-[#e2e8f0] rounded-2xl p-5 bg-white space-y-4">
                    <h3 className="font-bold text-sm text-[#011f4b]">ID Photo Guidelines</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-[#eaf2f8] rounded-xl border border-[#b3cde0]/40">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#005b96] mb-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Acceptable Criteria
                        </div>
                        <ul className="text-xs text-[#03396c] space-y-1 list-disc list-inside">
                          <li>Plain solid white background</li>
                          <li>Formal or collared attire</li>
                          <li>Neutral expression</li>
                          <li>Even lighting without shadows</li>
                        </ul>
                      </div>

                      <div className="p-3 bg-red-50/50 rounded-xl border border-red-200/60">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 mb-1">
                          <X className="w-3.5 h-3.5 text-red-600" />
                          Unacceptable Items
                        </div>
                        <ul className="text-xs text-red-900/80 space-y-1 list-disc list-inside">
                          <li>Selfies or heavy filters</li>
                          <li>Hats, caps, or sunglasses</li>
                          <li>Patterned backgrounds</li>
                          <li>Cropped group photos</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION: Medical */}
            {activeSection === 'medical' && (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#eaf2f8] flex items-center justify-center text-[#005b96]">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#011f4b]">
                      Pre-Employment Medical Examination (PEME)
                    </h2>
                    <p className="text-xs text-[#6497b1]">
                      Accredited diagnostic clinic instructions &amp; health clearance.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-[#b3cde0] bg-[#eaf2f8]/40 space-y-2">
                    <div className="text-xs font-bold text-[#011f4b]">Accredited Health Facility</div>
                    <div className="text-sm font-semibold text-[#005b96]">
                      {medical.clinic_name}
                    </div>
                    <div className="text-xs text-[#03396c] flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-[#005b96] mt-0.5" />
                      <span>{medical.clinic_address}</span>
                    </div>
                    <div className="text-xs text-[#6497b1] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-[#005b96]" />
                      <span>{medical.clinic_schedule}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] flex flex-col justify-between space-y-3">
                    <div>
                      <div className="text-xs font-bold text-[#011f4b] mb-1">
                        Company Direct Billing
                      </div>
                      <p className="text-xs text-[#6497b1] leading-relaxed">
                        {medical.expense_notes}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-[#e2e8f0]">
                      <button
                        type="button"
                        onClick={() => alert('Downloading official Medical Referral Slip (PDF)...')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-[#b3cde0] text-[#005b96] px-3 py-2 rounded-lg"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Referral Slip
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const medTask = tasks.find((t) => t.id === 'task-med-1');
                          if (medTask) setUploadTask(medTask);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#005b96] hover:bg-[#03396c] text-white px-3 py-2 rounded-lg"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        Upload Fit-to-Work
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION: First Day Preparation */}
            {activeSection === 'first_day' && (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#eaf2f8] flex items-center justify-center text-[#005b96]">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#011f4b]">First Day Preparation</h2>
                    <p className="text-xs text-[#6497b1]">
                      Schedule, dress code, office reporting desk, and physical requirements.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                    <span className="text-[11px] text-[#6497b1] font-medium block">
                      Arrival Schedule
                    </span>
                    <span className="text-sm font-bold text-[#011f4b]">
                      {INITIAL_FIRST_DAY.arrival_time}
                    </span>
                  </div>
                  <div className="p-3.5 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                    <span className="text-[11px] text-[#6497b1] font-medium block">Dress Code</span>
                    <span className="text-sm font-bold text-[#011f4b]">Smart-Casual</span>
                  </div>
                </div>

                <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] space-y-1">
                  <div className="text-xs font-bold text-[#011f4b]">Office Address &amp; Desk</div>
                  <div className="text-xs text-[#03396c]">{INITIAL_FIRST_DAY.office_address}</div>
                  <div className="text-xs text-[#6497b1] mt-1">
                    {INITIAL_FIRST_DAY.map_instructions}
                  </div>
                </div>

                <div className="p-4 bg-[#eaf2f8]/40 rounded-xl border border-[#b3cde0] space-y-2">
                  <div className="text-xs font-bold text-[#011f4b]">Physical Items to Bring:</div>
                  <ul className="text-xs text-[#03396c] space-y-1.5">
                    {INITIAL_FIRST_DAY.items_to_bring.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* SECTION: Data Privacy */}
            {activeSection === 'privacy' && (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#eaf2f8] flex items-center justify-center text-[#005b96]">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#011f4b]">Data Privacy Act &amp; Consent</h2>
                      <p className="text-xs text-[#6497b1]">
                        Statutory compliance with Republic Act No. 10173.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Consent Acknowledged
                  </span>
                </div>

                <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] text-xs text-[#03396c] leading-relaxed space-y-3">
                  <p>
                    Philkoei International, Inc. adheres to strict information security standards. Your
                    personal and sensitive data are processed solely for lawful HR administration and
                    held with database-level isolation.
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-[#e2e8f0]">
                    <span className="text-[#6497b1] text-[11px]">
                      Acknowledged by {employee.full_name} (Ref: PKI-DP-2026-V3)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPrivacyModalOpen(true)}
                      className="text-xs font-bold text-[#005b96] hover:underline"
                    >
                      View Full Policy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION: Need Help */}
            {activeSection === 'help' && (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#eaf2f8] flex items-center justify-center text-[#005b96]">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#011f4b]">Need Help? HR Support</h2>
                    <p className="text-xs text-[#6497b1]">
                      Ask questions regarding medical vouchers, documents, or first day instructions.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSendHelp} className="space-y-3">
                  {helpSubmitted && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Your inquiry has been sent to the HR team. Expect a response soon.</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#03396c] mb-1">
                      Inquiry Subject
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SSS Member Data Record verification question"
                      value={helpSubject}
                      onChange={(e) => setHelpSubject(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-[#b3cde0] rounded-xl focus:border-[#005b96] text-[#011f4b]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#03396c] mb-1">
                      Your Message / Clarification
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Provide specific details so the HR team can assist you..."
                      value={helpMessage}
                      onChange={(e) => setHelpMessage(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-[#b3cde0] rounded-xl focus:border-[#005b96] text-[#011f4b]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-[#005b96] hover:bg-[#03396c] text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Question to HR
                  </button>
                </form>

                {/* Previous Inquiries */}
                <div className="space-y-3 pt-4 border-t border-[#e2e8f0]">
                  <div className="text-xs font-bold text-[#011f4b]">Recent Support Inquiries</div>
                  {helpInquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className="p-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#011f4b]">{inq.subject}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {inq.status}
                        </span>
                      </div>
                      <p className="text-[#6497b1]">{inq.message}</p>
                      {inq.hr_response && (
                        <div className="p-2.5 bg-[#eaf2f8] rounded-lg border border-[#b3cde0]/60 text-[#03396c] space-y-1">
                          <div className="font-bold text-[#005b96] flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            HR Response ({inq.responded_at})
                          </div>
                          <p>{inq.hr_response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* 4. Right Sidebar: Getting Started Checklist */}
          <aside className="lg:col-span-3 bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm sticky top-24 space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#011f4b]">
                  Getting Started Checklist
                </h2>
                <span className="text-xs font-extrabold text-[#005b96]">{progressPct}%</span>
              </div>
              <p className="text-[11px] text-[#6497b1] mt-0.5">
                Quick overview of your onboarding progress.
              </p>

              {/* Overall Progress Bar */}
              <div className="w-full bg-[#e2e8f0] rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="bg-[#005b96] h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Sequential Onboarding Milestones */}
            <div className="space-y-2.5 pt-2 border-t border-[#f1f5f9]">
              {[
                {
                  id: 'forms',
                  step: 1,
                  title: 'Complete Employee Forms',
                  target: 'forms' as NavSection,
                },
                {
                  id: 'photo',
                  step: 2,
                  title: 'Upload ID Photo',
                  target: 'photo' as NavSection,
                },
                {
                  id: 'pre_employment',
                  step: 3,
                  title: 'Submit Pre-Employment Requirements',
                  target: 'pre_employment' as NavSection,
                },
                {
                  id: 'medical',
                  step: 4,
                  title: 'Complete Medical',
                  target: 'medical' as NavSection,
                },
                {
                  id: 'first_day',
                  step: 5,
                  title: 'Review First Day Preparation',
                  target: 'first_day' as NavSection,
                },
                {
                  id: 'privacy',
                  step: 6,
                  title: 'Privacy Policy',
                  target: 'privacy' as NavSection,
                },
              ].map((milestone) => {
                const isSelected = activeSection === milestone.target;

                return (
                  <div
                    key={milestone.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-[#eaf2f8]/70 border-[#b3cde0]'
                        : 'bg-[#f8fafc] border-[#e2e8f0] hover:border-[#b3cde0]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-[#005b96] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {milestone.step}
                        </span>
                        <span className="text-xs font-semibold text-[#011f4b] truncate">
                          {milestone.title}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveSection(milestone.target)}
                        className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-[#005b96] text-white'
                            : 'bg-white border border-[#b3cde0] text-[#005b96] hover:bg-[#eaf2f8]'
                        }`}
                      >
                        {isSelected ? 'Viewing' : 'Start'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e2e8f0]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#011f4b]">
                  Upload Requirement: {uploadTask.title}
                </h3>
                <span className="text-xs text-[#6497b1]">
                  {uploadTask.required ? 'Mandatory Requirement' : 'Optional / If Applicable'}
                </span>
              </div>
              <button
                onClick={() => setUploadTask(null)}
                className="text-[#6497b1] hover:text-[#011f4b]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#6497b1] mb-4">
              Select a clear, legible PDF, PNG, or JPG file (Max 10MB). Uploaded documents are
              encrypted and accessible only by HR officers.
            </p>

            {uploadSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <div className="text-sm font-bold text-emerald-800">Document Uploaded Successfully!</div>
                <div className="text-xs text-emerald-600">
                  HR has been notified and will review your submission shortly.
                </div>
              </div>
            ) : (
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="border-2 border-dashed border-[#b3cde0] hover:border-[#005b96] rounded-xl p-6 text-center bg-[#f8fafc] cursor-pointer">
                  <input
                    type="file"
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) setUploadFile(e.target.files[0]);
                    }}
                    className="w-full text-xs text-[#6497b1] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#005b96] file:text-white hover:file:bg-[#03396c]"
                  />
                  <div className="text-[11px] text-[#6497b1] mt-2">
                    Supported formats: PDF, JPG, PNG (Max 10MB)
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setUploadTask(null)}
                    className="px-4 py-2 text-xs font-semibold text-[#6497b1] hover:text-[#011f4b]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!uploadFile}
                    className="bg-[#005b96] hover:bg-[#03396c] text-white text-xs font-semibold px-5 py-2 rounded-xl disabled:opacity-50 transition-colors"
                  >
                    Submit Document
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Online Form Assistant Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#e2e8f0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#e2e8f0]">
              <div>
                <h3 className="text-base font-bold text-[#011f4b]">
                  Personal Data &amp; Tax Information Assistant
                </h3>
                <span className="text-xs text-[#6497b1]">Digital Submission Form</span>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-[#6497b1] hover:text-[#011f4b]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Form details successfully saved and submitted to HR.');
                setIsFormModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#03396c] mb-1">
                    Tax Identification Number (TIN)
                  </label>
                  <input
                    type="text"
                    value={pdsData.tin}
                    onChange={(e) => setPdsData({ ...pdsData, tin: e.target.value })}
                    className="w-full p-2.5 bg-[#f8fafc] border border-[#b3cde0] rounded-xl text-[#011f4b]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#03396c] mb-1">
                    Social Security System (SSS) #
                  </label>
                  <input
                    type="text"
                    value={pdsData.sss}
                    onChange={(e) => setPdsData({ ...pdsData, sss: e.target.value })}
                    className="w-full p-2.5 bg-[#f8fafc] border border-[#b3cde0] rounded-xl text-[#011f4b]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#03396c] mb-1">PhilHealth ID #</label>
                  <input
                    type="text"
                    value={pdsData.philhealth}
                    onChange={(e) => setPdsData({ ...pdsData, philhealth: e.target.value })}
                    className="w-full p-2.5 bg-[#f8fafc] border border-[#b3cde0] rounded-xl text-[#011f4b]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#03396c] mb-1">
                    Pag-IBIG / HDMF MID #
                  </label>
                  <input
                    type="text"
                    value={pdsData.pagibig}
                    onChange={(e) => setPdsData({ ...pdsData, pagibig: e.target.value })}
                    className="w-full p-2.5 bg-[#f8fafc] border border-[#b3cde0] rounded-xl text-[#011f4b]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#03396c] mb-1">
                  Payroll Bank Account Details
                </label>
                <input
                  type="text"
                  value={pdsData.bankAccount}
                  onChange={(e) => setPdsData({ ...pdsData, bankAccount: e.target.value })}
                  className="w-full p-2.5 bg-[#f8fafc] border border-[#b3cde0] rounded-xl text-[#011f4b]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#03396c] mb-1">
                  Emergency Contact &amp; Number
                </label>
                <input
                  type="text"
                  value={pdsData.emergencyContact}
                  onChange={(e) => setPdsData({ ...pdsData, emergencyContact: e.target.value })}
                  className="w-full p-2.5 bg-[#f8fafc] border border-[#b3cde0] rounded-xl text-[#011f4b]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 font-semibold text-[#6497b1] hover:text-[#011f4b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#005b96] hover:bg-[#03396c] text-white font-semibold px-5 py-2 rounded-xl transition-colors"
                >
                  Save &amp; Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#e2e8f0] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
              <h3 className="text-base font-bold text-[#011f4b]">
                Philkoei Employee Data Privacy Notice
              </h3>
              <button
                onClick={() => setIsPrivacyModalOpen(false)}
                className="text-[#6497b1] hover:text-[#011f4b]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 overflow-y-auto pr-2 text-xs text-[#03396c] leading-relaxed whitespace-pre-line font-mono bg-[#f8fafc] p-4 rounded-xl border border-[#e2e8f0]">
              {INITIAL_PRIVACY_TEXT}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#e2e8f0]">
              <button
                onClick={() => setIsPrivacyModalOpen(false)}
                className="bg-[#005b96] hover:bg-[#03396c] text-white text-xs font-semibold px-5 py-2 rounded-xl"
              >
                Close Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
