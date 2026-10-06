"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileText,
  HelpCircle,
  Hourglass,
  Info,
  Lock,  LogOut,
  MapPin,
  Menu,
  Phone,
  Play,
  Send,
  ShieldCheck,
  Shirt,
  Sparkles,
  Stethoscope,
  UploadCloud,
  X,
} from 'lucide-react';

import {
  INITIAL_EMPLOYEE,
  INITIAL_PRIVACY_TEXT,
  MockTask,
} from '@/lib/mock-data';
import {
  CURRENT_EMPLOYEE_ID,
  hrName,
  logAudit,
  sendMessage,
  uid,
} from '@/lib/db';
import { useDB } from '@/lib/use-db';
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

interface Milestone {
  id: string;
  step: number;
  title: string;
  target: NavSection;
}

const MILESTONES: Milestone[] = [
  { id: 'forms', step: 1, title: 'Complete Employee Forms', target: 'forms' },
  { id: 'photo', step: 2, title: 'Upload ID Photo', target: 'photo' },
  { id: 'pre_employment', step: 3, title: 'Submit Pre-Employment Requirements', target: 'pre_employment' },
  { id: 'medical', step: 4, title: 'Complete Medical', target: 'medical' },
  { id: 'first_day', step: 5, title: 'Review First Day Preparation', target: 'first_day' },
  { id: 'privacy', step: 6, title: 'Privacy Policy', target: 'privacy' },
];

interface EmploymentForm {
  id: string;
  title: string;
  desc: string;
}

const EMPLOYMENT_FORMS: EmploymentForm[] = [
  { id: 'form-data-privacy', title: 'Data Privacy Form', desc: 'Company data privacy agreement' },
  { id: 'form-manual-conforme', title: 'Employee Manual Conforme', desc: 'Acknowledgment of employee handbook' },
  { id: 'form-id-conforme', title: 'Company ID Conforme', desc: 'Company ID request and agreement' },
  { id: 'form-code-conduct', title: 'NK Code of Conduct', desc: 'Code of conduct acknowledgment' },
  { id: 'form-comprehension', title: 'Comprehension Test', desc: 'Employee handbook comprehension assessment' },
];

const ORIENTATION_ITEMS: string[] = [
  'HR Orientation',
  'Administrative Orientation',
  'Finance Orientation',
  'IT Orientation',
  'QMS Orientation',
  'OSH Orientation',
  'Reading of Employee Manual',
  'Opening Payroll Account',
  'Office Tour',
  'Orientation with Immediate Superior',
];

interface BringItem {
  title: string;
  desc: string;
}

const BRING_ITEMS: BringItem[] = [
  { title: 'Valid ID', desc: 'Government-issued ID for registration.' },
  { title: 'Pen and Notebook', desc: 'For taking notes during orientation.' },
  { title: 'Completed Documents', desc: 'Any additional forms provided by HR.' },
  { title: 'Jacket', desc: 'For cold rooms or air-conditioned areas.' },
  { title: 'Professional Attitude', desc: 'Bring your best, smile and positive energy!' },
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
  // Shared employee <-> HR datastore (tasks, threads, messages, notifications, audit).
  const [db, updateDB] = useDB();
  const tasks = db.tasks;

  // Active section controlled by Left Sidebar (defaulting to pre_employment as requested)
  const [activeSection, setActiveSection] = useState<NavSection>('pre_employment');

  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Mobile checklist collapsible (default open so progress visible)
  const [mobileChecklistOpen, setMobileChecklistOpen] = useState(true);

  // Header notifications dropdown
  const [notifOpen, setNotifOpen] = useState(false);

  // First day orientation checklist progress
  const [orientationChecks, setOrientationChecks] = useState<boolean[]>(
    () => Array(ORIENTATION_ITEMS.length).fill(false)
  );

  // First day readiness acknowledgement
  const [firstDayReady, setFirstDayReady] = useState(false);

  // Data privacy acknowledgement
  const [privacyAck, setPrivacyAck] = useState(false);

  // Medical section reviewed acknowledgement
  const [medicalReviewed, setMedicalReviewed] = useState(false);

  // Modals & Upload State
  const [uploadTask, setUploadTask] = useState<MockTask | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Multiple uploaded files per requirement (spec: multiple files allowed per requirement)
  const [reqFiles, setReqFiles] = useState<Record<string, { name: string; sizeLabel: string }[]>>(() => {
    const seeded: Record<string, { name: string; sizeLabel: string }[]> = {};
    tasks.forEach((t) => {
      if (t.file_name) seeded[t.id] = [{ name: t.file_name, sizeLabel: 'Uploaded' }];
    });
    return seeded;
  });

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Help Chat State: help threads live in shared db (HR inbox reads the same rows).
  const [chatInput, setChatInput] = useState('');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const helpThreads = useMemo(
    () =>
      db.threads
        .filter((t) => t.subject_type === 'help' && t.employee_id === CURRENT_EMPLOYEE_ID)
        .sort((a, b) => (a.updated_at > b.updated_at ? -1 : 1)),
    [db.threads]
  );
  const activeThread = helpThreads.find((t) => t.id === activeThreadId) ?? helpThreads[0] ?? null;
  const chatMessages = useMemo(
    () => db.messages.filter((m) => activeThread && m.thread_id === activeThread.id),
    [db.messages, activeThread]
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages, activeSection]);

  // Photo Upload State
  interface UploadedPhoto {
    id: string;
    name: string;
    sizeLabel: string;
    previewUrl: string;
  }

  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([
    {
      id: 'seed-me',
      name: 'Me.png',
      sizeLabel: '200.12 KB',
      previewUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    },
  ]);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

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

  // HR alerts: tasks HR flagged with feedback (e.g. blurred PSA rejected).
  const hrAlerts = useMemo(() => {
    return tasks.filter((t) => t.status === 'needs_changes' && t.feedback);
  }, [tasks]);

  // Stored bell feed (chat replies, file comments, approvals) for this employee.
  const myNotifications = useMemo(() => {
    return db.notifications.filter((n) => n.user_id === CURRENT_EMPLOYEE_ID).slice(0, 8);
  }, [db.notifications]);
  const unreadCount = useMemo(() => {
    return hrAlerts.length + myNotifications.filter((n) => !n.is_read).length;
  }, [hrAlerts, myNotifications]);

  const markNotifRead = (id: string) => {
    updateDB((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    }));
  };

  const sectionForLink = (link: string | null): NavSection => {
    switch (link) {
      case 'photo':
        return 'photo';
      case 'medical':
        return 'medical';
      case 'first_day':
        return 'first_day';
      case 'privacy':
        return 'privacy';
      case 'forms':
        return 'forms';
      case 'help':
        return 'help';
      case 'pre_employment':
      default:
        return 'pre_employment';
    }
  };

  const taskSection = (category: MockTask['category']): NavSection => {
    switch (category) {
      case 'photo':
        return 'photo';
      case 'medical':
        return 'medical';
      case 'first_day':
        return 'first_day';
      case 'privacy':
        return 'privacy';
      case 'welcome':
        return 'welcome';
      case 'form':
      case 'document':
      default:
        return 'pre_employment';
    }
  };

  const handleFileUpload = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!uploadTask || uploadFiles.length === 0) return;

    const newFiles = uploadFiles.map((f) => ({ name: f.name, sizeLabel: formatFileSize(f.size) }));
    setReqFiles((prev) => ({
      ...prev,
      [uploadTask.id]: [...(prev[uploadTask.id] ?? []), ...newFiles],
    }));

    const taskId = uploadTask.id;
    const firstName = uploadFiles[0].name;
    const taskTitle = uploadTask.title;
    updateDB((prev) =>
      logAudit(
        {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'submitted',
                  file_name: firstName,
                  submitted_at: 'Just now',
                  feedback: undefined,
                }
              : t
          ),
        },
        employee.full_name,
        'employee',
        'UPLOAD',
        taskTitle,
        `${uploadFiles.length} file(s) submitted for review.`
      )
    );

    setUploadSuccess(true);
    setTimeout(() => {
      setUploadSuccess(false);
      setUploadTask(null);
      setUploadFiles([]);
    }, 1200);
  };

  const handleSendChat = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    // Reuse the open help thread, else start one. HR inbox reads the same rows.
    const threadId = activeThread && activeThread.status !== 'closed' ? activeThread.id : null;
    updateDB((prev) => {
      let next = prev;
      let tid = threadId;
      if (!tid) {
        const thread = {
          id: uid('thr'),
          employee_id: CURRENT_EMPLOYEE_ID,
          hr_id: null as string | null,
          subject_type: 'help' as const,
          subject_title: text.length > 48 ? `${text.slice(0, 48)}...` : text,
          task_id: null as string | null,
          file_name: null as string | null,
          status: 'open' as const,
          updated_at: 'Just now',
        };
        tid = thread.id;
        next = { ...next, threads: [thread, ...next.threads] };
      }
      next = sendMessage(next, tid, CURRENT_EMPLOYEE_ID, 'employee', text);
      return logAudit(next, employee.full_name, 'employee', 'CHAT_SEND', tid, text.slice(0, 120));
    });
    setActiveThreadId(threadId);
    setChatInput('');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handlePhotoFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const accepted = ['image/png', 'image/jpeg', 'image/jpg'];
    Array.from(files).forEach((file) => {
        if (!accepted.includes(file.type) && !/\.(png|jpe?g)$/i.test(file.name)) {
          alert(`"${file.name}" is not supported. Please upload PNG, JPG, or JPEG.`);
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          alert(`"${file.name}" exceeds 5MB. Please choose a smaller file.`);
          return;
        }
        const previewUrl = URL.createObjectURL(file);
        setUploadedPhotos((prev) => [
          ...prev,
          {
            id: `photo-${Date.now()}-${file.name}`,
            name: file.name,
            sizeLabel: formatFileSize(file.size),
            previewUrl,
          },
        ]);
      });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col font-sans">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e2e8f0] text-[#011f4b] shadow-sm">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Branding Left */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden inline-flex items-center justify-center min-w-11 min-h-11 rounded-xl text-[#03396c] hover:bg-[#eaf2f8] transition-colors shrink-0"
                aria-label="Open onboarding navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
              {/* Desktop logo */}
              <Image
                src="/PKII-LOGO.png"
                alt="Philkoei International, Inc."
                width={180}
                height={44}
                className="hidden sm:block h-10 w-auto object-contain shrink-0"
                priority
              />
              {/* Mobile logo */}
              <Image
                src="/PKII-LOGO1.png"
                alt="Philkoei International, Inc."
                width={120}
                height={44}
                className="sm:hidden h-6 max-w-[60px] w-auto object-contain shrink-0"
                priority
              />
            </div>

            {/* Profile & Countdown Right */}
            <div className="flex items-center gap-1.5 sm:gap-4 min-w-0 shrink">
              {/* Notification Bell */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setNotifOpen((v) => !v)}
                  aria-expanded={notifOpen}
                  aria-label="Open notifications"
                  className="relative inline-flex items-center justify-center min-w-11 min-h-11 rounded-xl text-[#03396c] hover:bg-[#eaf2f8] transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 min-w-4 h-4 px-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white tabular-nums">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 max-w-[80vw] bg-white border border-[#e2e8f0] rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#f1f5f9]">
                      <span className="text-xs font-bold text-[#011f4b]">Notifications</span>
                      <button
                        type="button"
                        onClick={() => setNotifOpen(false)}
                        aria-label="Close notifications"
                        className="p-1 rounded-lg text-[#6497b1] hover:text-[#011f4b] transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-[#f1f5f9]">
                      {hrAlerts.map((alert) => (
                        <button
                          key={alert.id}
                          type="button"
                          onClick={() => {
                            setActiveSection(taskSection(alert.category));
                            setNotifOpen(false);
                          }}
                          className="w-full flex items-start gap-2.5 px-4 py-3 text-left bg-rose-50/50 hover:bg-rose-50 transition-colors"
                        >
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#011f4b] leading-snug">
                              {alert.title} needs changes.
                            </p>
                            <p className="text-[11px] text-rose-700 mt-0.5 leading-snug">
                              HR comment: {alert.feedback}
                            </p>
                            <p className="text-[11px] text-[#6497b1] mt-0.5">
                              Tap to review and re-upload.
                            </p>
                          </div>
                        </button>
                      ))}
                      {myNotifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            markNotifRead(n.id);
                            setActiveSection(sectionForLink(n.link_section));
                            setNotifOpen(false);
                          }}
                          className={`w-full flex items-start gap-2.5 px-4 py-3 text-left transition-colors ${
                            n.is_read ? '' : 'bg-[#eaf2f8]/50'
                          } hover:bg-[#eaf2f8]`}
                        >
                          {n.type === 'rejection' ? (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          ) : n.type === 'approval' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : n.type === 'chat' ? (
                            <Send className="w-4 h-4 text-[#005b96] shrink-0 mt-0.5" />
                          ) : (
                            <Info className="w-4 h-4 text-[#005b96] shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#011f4b] leading-snug">
                              {n.title}
                            </p>
                            {n.body && (
                              <p className="text-[11px] text-[#6497b1] mt-0.5 leading-snug">
                                {n.body}
                              </p>
                            )}
                            <p className="text-[11px] text-[#6497b1] mt-0.5 tabular-nums">
                              {n.created_at}
                            </p>
                          </div>
                        </button>
                      ))}
                      <div className="flex items-start gap-2.5 px-4 py-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#011f4b] leading-snug">
                            Your PSA Birth Certificate was approved.
                          </p>
                          <p className="text-[11px] text-[#6497b1] mt-0.5">2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 px-4 py-3">
                        <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#011f4b] leading-snug">
                            Reminder: complete your medical exam before your start date.
                          </p>
                          <p className="text-[11px] text-[#6497b1] mt-0.5">1 day ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 px-4 py-3">
                        <Sparkles className="w-4 h-4 text-[#005b96] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#011f4b] leading-snug">
                            Welcome aboard! Orientation is now unlocked.
                          </p>
                          <p className="text-[11px] text-[#6497b1] mt-0.5">3 days ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Info with countdown below name - visible on mobile too */}
              <div className="flex items-center gap-1.5 sm:gap-3 bg-[#f8fafc] px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-lg sm:rounded-xl border border-[#e2e8f0] min-w-0 max-w-[34vw] min-[420px]:max-w-[30vw] sm:max-w-none overflow-hidden">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-[#b3cde0] shrink-0 bg-[#005b96]">
                  <Image
                    src={employee.avatar_url}
                    alt={employee.full_name}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left min-w-0 leading-none">
                  <div className="text-[11px] sm:text-xs font-bold text-[#011f4b] leading-tight truncate whitespace-nowrap">
                    {employee.full_name}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 min-w-0">
                    <Hourglass className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 animate-pulse shrink-0" />
                    <span className="text-[9px] sm:text-[10px] font-semibold text-amber-600 whitespace-nowrap truncate leading-tight">30 days remaining</span>
                  </div>
                </div>
              </div>

              {/* Sign Out (desktop only; mobile uses drawer sidebar logout) */}
              <Link
                href="/login"
                className="hidden sm:inline-flex text-[#6497b1] hover:text-[#011f4b] p-2 rounded-xl hover:bg-[#eaf2f8] transition-colors shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile: slim progress bar indicator beneath header */}
        <div className="lg:hidden h-1 bg-[#e2e8f0] w-full overflow-hidden">
          <div
            className="h-full bg-[#005b96] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer Panel */}
          <aside className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-2">
                <Image
                  src="/PKII-LOGO1.png"
                  alt="Philkoei International, Inc."
                  width={100}
                  height={36}
                  className="h-7 w-auto object-contain"
                />
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-xl text-[#6497b1] hover:bg-[#f1f5f9] hover:text-[#011f4b] transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress inside drawer */}
            <div className="px-5 py-3 border-b border-[#f1f5f9]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#011f4b]">Onboarding Progress</span>
                <span className="text-xs font-extrabold text-[#005b96]">{progressPct}%</span>
              </div>
              <div className="w-full bg-[#e2e8f0] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#005b96] h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#6497b1] px-3 pb-2">
                Portal Directory
              </div>
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[#005b96] text-white shadow-sm'
                        : 'text-[#03396c] hover:bg-[#eaf2f8] hover:text-[#005b96]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-[#6497b1]'}`} />
                      <span className="truncate whitespace-nowrap block min-w-0">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`shrink-0 ml-2 whitespace-nowrap text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        isActive ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Sign Out at bottom of drawer */}
            <div className="p-4 border-t border-[#e2e8f0]">
              <Link
                href="/login"
                className="flex items-center gap-2 text-xs font-semibold text-[#6497b1] hover:text-rose-600 transition-colors px-3 py-2 rounded-xl hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 2. Left Sidebar Navigation (Desktop only) */}
          <aside className="hidden lg:block lg:col-span-3 bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-sm sticky top-24">
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
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#005b96] text-white shadow-sm'
                        : 'text-[#03396c] hover:bg-[#eaf2f8] hover:text-[#005b96]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-[#6497b1]'
                        }`}
                      />
                      <span className="truncate whitespace-nowrap block min-w-0">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`shrink-0 ml-2 whitespace-nowrap text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
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
          <main className="lg:col-span-6 space-y-4 sm:space-y-6">
            {/* Mobile: Getting Started Checklist (mirrors desktop right sidebar) */}
            <section
              aria-label="Getting Started Checklist"
              className="lg:hidden bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setMobileChecklistOpen((v) => !v)}
                aria-expanded={mobileChecklistOpen}
                className="w-full flex items-center justify-between gap-3 p-4 min-h-11 text-left"
              >
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-[#011f4b] leading-snug">
                    Getting Started Checklist
                  </h2>
                  <p className="text-[11px] text-[#6497b1] mt-0.5">
                    {approvedCount} of {totalRequired} required approved
                  </p>
                </div>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-extrabold text-[#005b96] tabular-nums">
                    {progressPct}%
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#6497b1] transition-transform duration-200 ${
                      mobileChecklistOpen ? 'rotate-180' : 'rotate-0'
                    }`}
                  />
                </span>
              </button>

              <div className="px-4 pb-1">
                <div
                  className="w-full bg-[#e2e8f0] rounded-full h-2 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={progressPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Onboarding progress"
                >
                  <div
                    className="bg-[#005b96] h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {mobileChecklistOpen && (
                <div className="p-3 space-y-2">
                  {MILESTONES.map((milestone) => {
                    const isSelected = activeSection === milestone.target;
                    return (
                      <div
                        key={milestone.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-[#eaf2f8]/70 border-[#b3cde0]'
                            : 'bg-[#f8fafc] border-[#e2e8f0]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="w-5 h-5 rounded-full bg-[#005b96] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {milestone.step}
                            </span>
                            <span className="text-xs font-semibold text-[#011f4b] leading-snug break-words min-w-0">
                              {milestone.title}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveSection(milestone.target)}
                            aria-current={isSelected ? 'true' : undefined}
                            className={`min-h-11 min-w-16 inline-flex items-center justify-center text-xs font-bold px-3 py-2 rounded-lg transition-colors shrink-0 ${
                              isSelected
                                ? 'bg-[#005b96] text-white'
                                : 'bg-white border border-[#b3cde0] text-[#005b96]'
                            }`}
                          >
                            {isSelected ? 'Viewing' : 'Start'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* SECTION: Pre-Employment Requirements */}
            {activeSection === 'pre_employment' && (
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#011f4b] leading-tight">
                    Pre-Employment Requirements
                  </h1>
                  <p className="text-xs sm:text-sm text-[#6497b1] mt-1 leading-relaxed">
                    Please upload clear, legible copies of the following documents. You can upload multiple files for each requirement if needed.
                  </p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {preEmploymentRequirements.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                            <h3 className="text-sm font-bold text-[#011f4b] leading-snug break-words">
                              {req.title}
                              {req.required ? (
                                <span className="text-rose-600 font-extrabold ml-1" title="Mandatory">*</span>
                              ) : (
                                <span className="text-xs font-normal text-[#6497b1] ml-1.5 italic">
                                  If Applicable
                                </span>
                              )}
                            </h3>
                            {renderStatusBadge(req.status)}
                          </div>

                          <p className="text-xs text-[#6497b1] leading-relaxed">
                            {req.description}
                          </p>

                          {(reqFiles[req.id] ?? []).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {(reqFiles[req.id] ?? []).map((f) => (
                                <span
                                  key={`${req.id}-${f.name}`}
                                  className="inline-flex items-center gap-1.5 text-xs text-[#005b96] font-semibold bg-[#eaf2f8] pl-2.5 pr-1.5 py-1 rounded-md max-w-full"
                                >
                                  <FileCheck className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate max-w-[140px] min-[420px]:max-w-[200px]">{f.name}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReqFiles((prev) => ({
                                        ...prev,
                                        [req.id]: (prev[req.id] ?? []).filter((x) => x.name !== f.name),
                                      }))
                                    }
                                    aria-label={`Remove ${f.name}`}
                                    className="p-0.5 rounded text-[#6497b1] hover:text-rose-600 transition-colors shrink-0"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </span>
                              ))}
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
                        <div className="flex flex-col min-[420px]:flex-row gap-2 shrink-0">
                          {req.has_download && (
                            <button
                              type="button"
                              onClick={() => {
                                alert(
                                  'Downloading official Employment Application Form template (PDF)...'
                                );
                              }}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-3 min-[420px]:py-2 text-xs font-semibold whitespace-nowrap border border-[#b3cde0] text-[#005b96] hover:bg-[#eaf2f8] rounded-xl transition-colors min-h-11"
                            >
                              <Download className="w-3.5 h-3.5 shrink-0" />
                              Download Form
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setUploadTask(req)}
                            className="inline-flex items-center justify-center gap-1.5 bg-[#005b96] hover:bg-[#03396c] text-white text-xs font-semibold whitespace-nowrap px-5 py-3 min-[420px]:py-2 rounded-xl transition-colors shadow-sm min-h-11"
                          >
                            <UploadCloud className="w-3.5 h-3.5 shrink-0" />
                            {req.status === 'needs_changes' ? 'Re-upload' : 'Upload'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Important Note */}
                <div className="p-4 bg-[#eaf2f8] border border-[#b3cde0] rounded-2xl text-xs sm:text-sm text-[#03396c] leading-relaxed">
                  <strong className="font-bold text-[#011f4b]">Important:</strong> Please ensure all documents are clear, legible, and up to date. Rejected documents will need to be re-uploaded with corrections.
                </div>
              </div>
            )}

            {/* SECTION: Welcome */}
            {activeSection === 'welcome' && (
              <div className="space-y-5">
                {/* Main Title */}
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#011f4b] leading-tight">
                  Welcome to Your Onboarding Journey!
                </h1>

                {/* Employee Information Card */}
                <div className="bg-[#f1f5f9] rounded-2xl border border-[#e2e8f0] p-4 sm:p-6">
                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="min-w-0">
                      <span className="text-xs text-[#6497b1] block leading-tight">Name</span>
                      <span className="text-sm font-bold text-[#011f4b] block truncate whitespace-nowrap">{employee.full_name}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs text-[#6497b1] block leading-tight">Employee No.</span>
                      <span className="text-sm font-bold text-[#011f4b] block truncate whitespace-nowrap">{employee.employee_number}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs text-[#6497b1] block leading-tight">Department</span>
                      <span className="text-sm font-bold text-[#011f4b] block truncate whitespace-nowrap">{employee.department}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs text-[#6497b1] block leading-tight">Position</span>
                      <span className="text-sm font-bold text-[#011f4b] block truncate whitespace-nowrap">{employee.position}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs text-[#6497b1] block leading-tight">Manager / Supervisor</span>
                      <span className="text-sm font-bold text-[#011f4b] block truncate whitespace-nowrap">{employee.manager_name}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs text-[#6497b1] block leading-tight">Starting Date</span>
                      <span className="text-sm font-bold text-[#011f4b] block truncate whitespace-nowrap">{employee.start_date}</span>
                    </div>
                  </div>
                </div>

                {/* Welcome Banner */}
                <div className="bg-[#011f4b] text-white rounded-2xl p-5 sm:p-8 shadow-sm">
                  <div className="space-y-3 max-w-2xl">
                    <p className="text-lg sm:text-xl font-bold leading-snug">Hi!</p>
                    <p className="text-sm sm:text-base font-semibold leading-relaxed">
                      Welcome to the Philkoei International, Inc. (PKII) team.
                    </p>
                    <p className="text-xs sm:text-sm text-[#b3cde0] leading-relaxed">
                      We are excited to have you on board and want to ensure you have everything you need for a smooth start.
                    </p>
                    <p className="text-xs sm:text-sm text-[#b3cde0] leading-relaxed">
                      Before your starting date, we kindly ask that you complete the following tasks and review the documents by following the instructions below.
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed pt-1">
                      Your access to the link will be until one month from now. So keep working on it!
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveSection('pre_employment')}
                      className="mt-2 inline-flex items-center justify-center gap-2 bg-white text-[#011f4b] text-xs font-bold px-4 py-3 sm:py-2.5 rounded-xl transition-colors hover:bg-[#eaf2f8] min-h-11"
                    >
                      Start Pre-Employment Checklist
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </div>
                </div>

                {/* What to Expect */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-6 shadow-sm">
                  <h2 className="text-base sm:text-lg font-bold text-[#011f4b]">What to Expect</h2>
                  <ul className="mt-3 space-y-2.5 text-xs sm:text-sm text-[#03396c] leading-relaxed list-disc list-inside">
                    <li>Complete all required employment forms and documentation</li>
                    <li>Upload necessary documents and your ID photo</li>
                    <li>Complete your medical examination</li>
                    <li>Review important company policies and first day information</li>
                    <li>Track your progress using the checklist on the right</li>
                  </ul>
                </div>

                {/* Important Notes */}
                <div className="bg-[#eaf2f8] rounded-2xl border border-[#b3cde0] p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-bold text-[#011f4b]">Important Notes</h2>
                  <ul className="mt-3 space-y-2.5 text-xs sm:text-sm text-[#03396c] leading-relaxed list-disc list-inside">
                    <li>Please complete all sections as soon as possible</li>
                    <li>Some sections will be locked until your starting date</li>
                    <li>You will receive notifications when HR reviews your submissions</li>
                    <li>If you need help at any time, visit the Need Help section</li>
                  </ul>
                </div>
              </div>
            )}

            {/* SECTION: Employment Forms */}
            {activeSection === 'forms' && (
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#011f4b] leading-tight">
                    Employment Forms
                  </h1>
                  <p className="text-xs sm:text-sm text-[#6497b1] mt-1 leading-relaxed">
                    Download, complete, and upload the following forms. All forms must be filled out and submitted.
                  </p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {EMPLOYMENT_FORMS.map((formItem) => (
                    <div
                      key={formItem.id}
                      className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-5 shadow-sm flex flex-col gap-4"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#eaf2f8] flex items-center justify-center text-[#005b96] shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-sm sm:text-base font-bold text-[#011f4b] leading-snug break-words">
                            {formItem.title}
                          </h2>
                          <p className="text-xs text-[#6497b1] mt-0.5 leading-relaxed">
                            {formItem.desc}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col min-[420px]:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            alert(`Downloading ${formItem.title} template (PDF)...`);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-3 min-[420px]:py-2.5 text-xs font-semibold whitespace-nowrap border border-[#b3cde0] text-[#005b96] hover:bg-[#eaf2f8] rounded-xl transition-colors min-h-11"
                        >
                          <Download className="w-3.5 h-3.5 shrink-0" />
                          Download Form
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setUploadTask({
                              id: formItem.id,
                              title: formItem.title,
                              description: formItem.desc,
                              category: 'form',
                              status: 'not_started',
                              required: true,
                              display_order: 0,
                            })
                          }
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-3 min-[420px]:py-2.5 text-xs font-semibold whitespace-nowrap bg-[#011f4b] hover:bg-[#03396c] text-white rounded-xl transition-colors shadow-sm min-h-11"
                        >
                          <UploadCloud className="w-3.5 h-3.5 shrink-0" />
                          Upload Completed Form
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] sm:text-xs text-[#6497b1] leading-relaxed bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3">
                  Note: All forms must be editable PDFs. Please ensure they are completely filled out before uploading.
                </p>
              </div>
            )}

            {/* SECTION: ID Photo */}
            {activeSection === 'photo' && (
              <div className="space-y-4 sm:space-y-5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#011f4b] leading-tight">
                  ID Photo Upload
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-start">
                  {/* Sample Photo (Reference) */}
                  <div className="space-y-2">
                    <h2 className="text-xs sm:text-sm font-bold text-[#6497b1]">
                      Sample Photo (Reference)
                    </h2>
                    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-3 shadow-sm overflow-hidden">
                      <div className="rounded-xl overflow-hidden bg-slate-200">
                        <Image
                          src="/Sample Photo for Corporate ID.png"
                          alt="Sample professional ID photo reference"
                          width={800}
                          height={800}
                          className="w-full aspect-[3/4] object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Upload + Uploaded Files */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h2 className="text-xs sm:text-sm font-bold text-[#011f4b]">
                        Upload Photo
                      </h2>
                      <label
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingPhoto(true);
                        }}
                        onDragLeave={() => setIsDraggingPhoto(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingPhoto(false);
                          handlePhotoFiles(e.dataTransfer.files);
                        }}
                        className={`cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-8 sm:py-10 transition-colors min-h-11 ${
                          isDraggingPhoto
                            ? 'border-[#005b96] bg-[#eaf2f8]'
                            : 'border-[#b3cde0] bg-white hover:border-[#005b96] hover:bg-[#fafcff]'
                        }`}
                      >
                        <UploadCloud className="w-8 h-8 text-[#005b96]" />
                        <span className="text-xs sm:text-sm font-semibold text-[#011f4b]">
                          Click to upload or drag and drop
                        </span>
                        <span className="text-[11px] text-[#6497b1]">
                          PNG, JPG or JPEG / Max 5MB
                        </span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            handlePhotoFiles(e.target.files);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xs sm:text-sm font-bold text-[#011f4b]">
                        Uploaded Files ({uploadedPhotos.length})
                      </h2>
                      {uploadedPhotos.length === 0 ? (
                        <p className="text-xs text-[#6497b1] bg-white border border-dashed border-[#b3cde0] rounded-xl px-4 py-4 text-center">
                          No files uploaded yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {uploadedPhotos.map((photo) => (
                            <div
                              key={photo.id}
                              className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5"
                            >
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-[#011f4b] truncate whitespace-nowrap">
                                  {photo.name}
                                </div>
                                <div className="text-[11px] text-[#6497b1] tabular-nums">
                                  {photo.sizeLabel}
                                </div>
                              </div>
                              <a
                                href={photo.previewUrl}
                                download={photo.name}
                                aria-label={`Download ${photo.name}`}
                                className="p-2 rounded-lg text-[#005b96] hover:bg-emerald-100 transition-colors shrink-0"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              <button
                                type="button"
                                onClick={() =>
                                  setUploadedPhotos((prev) =>
                                    prev.filter((p) => p.id !== photo.id)
                                  )
                                }
                                aria-label={`Delete ${photo.name}`}
                                className="p-2 rounded-lg text-rose-600 hover:bg-rose-100 transition-colors shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION: Medical */}
            {activeSection === 'medical' && (
              <div className="space-y-4 sm:space-y-5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#011f4b] leading-tight">
                  Medical Requirements
                </h1>

                {/* Referral Form */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-6 shadow-sm space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-[#011f4b] leading-snug">
                    Medical Referral Form
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6497b1] leading-relaxed">
                    Download and print the medical referral form below. Bring this form with you to the clinic.
                  </p>
                  <button
                    type="button"
                    onClick={() => alert('Downloading official Medical Referral Form (PDF)...')}
                    className="inline-flex items-center justify-center gap-1.5 bg-[#011f4b] hover:bg-[#03396c] text-white text-xs font-semibold px-4 py-3 sm:py-2.5 rounded-xl transition-colors shadow-sm min-h-11"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    Download Referral Form
                  </button>
                </div>

                {/* Accredited Clinic */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-6 shadow-sm space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-[#011f4b] leading-snug">
                    Accredited Medical Clinic
                  </h2>
                  <div className="space-y-2.5 text-xs sm:text-sm leading-relaxed">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#005b96] shrink-0 mt-0.5" />
                      <p className="text-[#03396c]">
                        <span className="font-bold text-[#011f4b]">Clinica Manila</span> at SM Center Pasig, E. Rodriguez Jr. Ave corner Dona Julia Vargas Ave., Frontera Verde, Ortigas Center, Pasig, 1604 Metro Manila.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-[#005b96] shrink-0 mt-0.5" />
                      <p className="text-[#03396c]">(02) 8696 7055</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-[#005b96] shrink-0 mt-0.5" />
                      <p className="text-[#03396c]">Monday to Saturday: 8:00 AM to 6:00 PM.</p>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-6 shadow-sm space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-[#011f4b] leading-snug">
                    Instructions
                  </h2>
                  <ol className="text-xs sm:text-sm text-[#03396c] space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Download and print the Medical Referral Form</li>
                    <li>Schedule an appointment with the accredited clinic</li>
                    <li>Bring a valid ID and the referral form to your appointment</li>
                    <li>Complete all required medical examinations</li>
                    <li>The clinic will send results directly to HR</li>
                  </ol>
                </div>

                {/* Important Notes */}
                <div className="p-4 bg-[#eaf2f8] border border-[#b3cde0] rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#011f4b]">
                    <AlertCircle className="w-4 h-4 text-[#005b96] shrink-0" />
                    Important Notes:
                  </div>
                  <ul className="text-xs sm:text-sm text-[#03396c] space-y-1.5 list-disc list-inside leading-relaxed">
                    <li>Medical examination is company-paid</li>
                    <li>Please schedule your exam at least 1 week before your start date</li>
                    <li>Results will be sent directly to HR within 3-5 business days</li>
                    <li>Fasting may be required for some tests - confirm when scheduling</li>
                  </ul>
                </div>

                {/* Reviewed */}
                <button
                  type="button"
                  onClick={() => {
                    setMedicalReviewed(true);
                    updateDB((prev) =>
                      logAudit(
                        {
                          ...prev,
                          tasks: prev.tasks.map((t) =>
                            t.id === 'task-med-1' && t.status !== 'approved'
                              ? { ...t, status: 'submitted', submitted_at: 'Just now' }
                              : t
                          ),
                        },
                        employee.full_name,
                        'employee',
                        'MEDICAL_REVIEWED',
                        'Medical Requirements',
                        'Employee marked the medical section as reviewed.'
                      )
                    );
                  }}
                  disabled={medicalReviewed}
                  className={`w-full inline-flex items-center justify-center gap-2 text-white text-xs sm:text-sm font-bold px-4 py-3.5 rounded-xl transition-colors shadow-sm min-h-11 ${
                    medicalReviewed ? 'bg-emerald-600 cursor-default' : 'bg-[#011f4b] hover:bg-[#03396c]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {medicalReviewed ? 'Medical Section Reviewed' : 'Mark Medical Section as Reviewed'}
                </button>
              </div>
            )}

            {/* SECTION: First Day Preparation */}
            {activeSection === 'first_day' && (
              <div className="space-y-4 sm:space-y-5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#011f4b] leading-tight">
                  First Day Preparation
                </h1>

                {/* Agenda Banner */}
                <div className="bg-[#011f4b] text-white rounded-2xl p-5 sm:p-6 shadow-sm">
                  <h2 className="text-base sm:text-lg font-bold leading-snug">
                    Your First Day Agenda
                  </h2>
                  <p className="text-xs sm:text-sm text-[#b3cde0] mt-1 leading-relaxed">
                    Here is what to expect on your first day. Review this information to ensure you are well-prepared.
                  </p>
                </div>

                {/* Dress Code */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-6 shadow-sm space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#eaf2f8] flex items-center justify-center text-[#005b96] shrink-0">
                      <Shirt className="w-4.5 h-4.5" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-[#011f4b]">Dress Code</h2>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-[#03396c]">Business Casual</p>
                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/70">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Acceptable
                      </div>
                      <ul className="text-xs text-[#03396c] space-y-1.5 list-disc list-inside leading-relaxed">
                        <li>Collared shirts / blouses</li>
                        <li>Dress pants / slacks</li>
                        <li>Closed-toe shoes</li>
                        <li>Modest dresses / skirts (knee-length)</li>
                      </ul>
                    </div>
                    <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200/70">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 mb-2">
                        <X className="w-3.5 h-3.5 text-rose-600" />
                        Not Allowed
                      </div>
                      <ul className="text-xs text-[#03396c] space-y-1.5 list-disc list-inside leading-relaxed">
                        <li>T-shirts / tank tops</li>
                        <li>Shorts / mini skirts</li>
                        <li>Flip-flops / sandals</li>
                        <li>Overly casual wear</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-6 shadow-sm space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#eaf2f8] flex items-center justify-center text-[#005b96] shrink-0">
                      <Calendar className="w-4.5 h-4.5" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-[#011f4b]">Schedule</h2>
                  </div>
                  <div className="space-y-2.5 text-xs sm:text-sm leading-relaxed">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-[#005b96] shrink-0 mt-0.5" />
                      <p className="text-[#03396c]">
                        <span className="font-bold text-[#011f4b]">Expected Arrival Time:</span> 9:00 AM.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#005b96] shrink-0 mt-0.5" />
                      <p className="text-[#03396c]">
                        <span className="font-bold text-[#011f4b]">Office Location:</span> Units 3301-3302, 33rd Floor Corporate Finance Plaza Condominium, Ruby Road, Ortigas Center, Barangay San Antonio, Pasig City.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-[#005b96] shrink-0 mt-0.5" />
                      <p className="text-[#03396c]">
                        <span className="font-bold text-[#011f4b]">Report To:</span> HR Department - Reception Area.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Things To Bring */}
                <div className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-[#011f4b]">Things To Bring</h2>
                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                    {BRING_ITEMS.map((item) => (
                      <div
                        key={item.title}
                        className="bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-sm flex items-start gap-2.5"
                      >
                        <span className="w-8 h-8 rounded-lg bg-[#eaf2f8] flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 text-emerald-600" />
                        </span>
                        <span className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-[#011f4b] block leading-snug">
                            {item.title}
                          </span>
                          <span className="text-[11px] sm:text-xs text-[#6497b1] block mt-0.5 leading-relaxed">
                            {item.desc}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* First Day Orientation Checklist */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-6 shadow-sm space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-base sm:text-lg font-bold text-[#011f4b] leading-snug">
                        First Day Orientation Checklist
                      </h2>
                      <span className="text-xs font-extrabold text-[#005b96] tabular-nums shrink-0">
                        {orientationChecks.filter(Boolean).length}/{ORIENTATION_ITEMS.length} Complete
                      </span>
                    </div>
                    <div
                      className="w-full bg-[#e2e8f0] rounded-full h-2 mt-3 overflow-hidden"
                      role="progressbar"
                      aria-valuenow={orientationChecks.filter(Boolean).length}
                      aria-valuemin={0}
                      aria-valuemax={ORIENTATION_ITEMS.length}
                      aria-label="Orientation progress"
                    >
                      <div
                        className="bg-[#005b96] h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.round(
                            (orientationChecks.filter(Boolean).length / ORIENTATION_ITEMS.length) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {ORIENTATION_ITEMS.map((item, idx) => {
                      const checked = orientationChecks[idx] ?? false;
                      return (
                        <button
                          key={item}
                          type="button"
                          role="checkbox"
                          aria-checked={checked}
                          onClick={() =>
                            setOrientationChecks((prev) =>
                              prev.map((v, i) => (i === idx ? !v : v))
                            )
                          }
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors min-h-11 ${
                            checked
                              ? 'bg-emerald-50/60 border-emerald-200'
                              : 'bg-[#f8fafc] border-[#e2e8f0] hover:border-[#b3cde0]'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              checked
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'bg-white border-[#b3cde0]'
                            }`}
                          >
                            {checked && <Check className="w-3.5 h-3.5 text-white" />}
                          </span>
                          <span
                            className={`text-xs sm:text-sm font-semibold leading-snug ${
                              checked ? 'text-[#6497b1] line-through' : 'text-[#011f4b]'
                            }`}
                          >
                            {item}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[11px] sm:text-xs text-[#03396c] leading-relaxed bg-[#eaf2f8] border border-[#b3cde0] rounded-xl px-4 py-3">
                    Note: These orientation sessions will be conducted on your first day. Use this checklist to track your progress throughout the day.
                  </p>
                </div>

                {/* Company Introduction */}
                <div className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-[#011f4b]">Company Introduction</h2>
                  <button
                    type="button"
                    onClick={() => alert('Company introduction video coming soon.')}
                    aria-label="Play company introduction video"
                    className="w-full bg-[#011f4b] rounded-2xl overflow-hidden shadow-sm hover:bg-[#03396c] transition-colors"
                  >
                    <span className="flex flex-col items-center justify-center gap-2 px-6 py-12 sm:py-16 min-h-64 sm:min-h-100 text-center">
                      <span className="w-14 h-14 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-6 h-6 text-white ml-0.5" />
                      </span>
                      <span className="text-sm sm:text-base font-bold text-white">
                        Company Introduction Video
                      </span>
                      <span className="text-xs text-[#b3cde0]">
                        Learn about our mission, vision, and values.
                      </span>
                    </span>
                  </button>
                  <p className="text-[11px] sm:text-xs text-[#6497b1] leading-relaxed text-center">
                    Watch this video to learn more about our company culture, history, and what makes us unique.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFirstDayReady(true);
                      updateDB((prev) =>
                        logAudit(prev, employee.full_name, 'employee', 'FIRSTDAY_READY', 'First Day Preparation', 'Employee acknowledged readiness for the first day.')
                      );
                    }}
                    disabled={firstDayReady}
                    className={`w-full inline-flex items-center justify-center gap-2 text-white text-xs sm:text-sm font-bold px-4 py-3.5 rounded-xl transition-colors shadow-sm min-h-11 ${
                      firstDayReady
                        ? 'bg-emerald-600 cursor-default'
                        : 'bg-[#011f4b] hover:bg-[#03396c]'
                    }`}
                  >
                    {firstDayReady ? (
                      <Check className="w-4 h-4 shrink-0" />
                    ) : (
                      <Briefcase className="w-4 h-4 shrink-0" />
                    )}
                    {firstDayReady
                      ? 'You Are Ready for Your First Day'
                      : 'I Am Prepared for My First Day'}
                  </button>
                </div>
              </div>
            )}

            {/* SECTION: Data Privacy */}
            {activeSection === 'privacy' && (
              <div className="space-y-4 sm:space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#011f4b] leading-tight">
                    Data Privacy Compliance
                  </h1>
                  {privacyAck ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Consent Acknowledged
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Pending Acknowledgement
                    </span>
                  )}
                </div>

                {/* RA 10173 Compliance */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-6 shadow-sm space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#eaf2f8] flex items-center justify-center text-[#005b96] shrink-0">
                      <ShieldCheck className="w-4.5 h-4.5" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-[#011f4b] leading-snug">
                      Compliance with RA 10173 (Data Privacy Act of 2012)
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-[#03396c] leading-relaxed bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3">
                    Our company is committed to protecting your personal information in accordance with the Republic Act 10173, also known as the Data Privacy Act of 2012.
                  </p>
                </div>

                {/* What We Collect */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-6 shadow-sm space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#eaf2f8] flex items-center justify-center text-[#005b96] shrink-0">
                      <FileText className="w-4.5 h-4.5" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-[#011f4b] leading-snug">
                      What Personal Information We Collect
                    </h2>
                  </div>
                  <ul className="text-xs sm:text-sm text-[#03396c] space-y-2 list-disc list-inside leading-relaxed">
                    <li>Basic identification information (name, address, contact details)</li>
                    <li>Government-issued IDs and numbers (SSS, PhilHealth, PAG-IBIG, TIN)</li>
                    <li>Educational background and employment history</li>
                    <li>Medical records for pre-employment requirements</li>
                    <li>Payroll and banking information</li>
                    <li>Performance evaluations and work-related documents</li>
                  </ul>
                </div>

                {/* How We Use */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-6 shadow-sm space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#eaf2f8] flex items-center justify-center text-[#005b96] shrink-0">
                      <Lock className="w-4.5 h-4.5" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-[#011f4b] leading-snug">
                      How We Use Your Information
                    </h2>
                  </div>
                  <ul className="text-xs sm:text-sm text-[#03396c] space-y-2 list-disc list-inside leading-relaxed">
                    <li>Employee verification and onboarding processes</li>
                    <li>Payroll processing and benefits administration</li>
                    <li>Compliance with legal and regulatory requirements</li>
                    <li>Performance management and career development</li>
                    <li>Internal communications and company operations</li>
                    <li>Health and safety management</li>
                  </ul>
                </div>

                {/* Rights */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-6 shadow-sm space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#eaf2f8] flex items-center justify-center text-[#005b96] shrink-0">
                      <Eye className="w-4.5 h-4.5" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-[#011f4b] leading-snug">
                      Your Data Privacy Rights
                    </h2>
                  </div>
                  <ul className="text-xs sm:text-sm text-[#03396c] space-y-2.5 leading-relaxed">
                    <li><strong className="font-bold text-[#011f4b]">Be Informed:</strong> Know how your data is being collected and used</li>
                    <li><strong className="font-bold text-[#011f4b]">Access:</strong> Request access to your personal information</li>
                    <li><strong className="font-bold text-[#011f4b]">Correct:</strong> Request correction of inaccurate or incomplete data</li>
                    <li><strong className="font-bold text-[#011f4b]">Erase or Block:</strong> Request deletion or blocking of your data under certain conditions</li>
                    <li><strong className="font-bold text-[#011f4b]">Object:</strong> Object to processing of your data for legitimate reasons</li>
                    <li><strong className="font-bold text-[#011f4b]">Damages:</strong> Be indemnified for damages due to inaccurate, incomplete, or unauthorized processing</li>
                  </ul>
                </div>

                {/* HR Internal Policy */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-6 shadow-sm space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-[#011f4b] leading-snug">
                    HR Internal Data Handling Policy
                  </h2>
                  <div className="bg-[#f1f5f9] rounded-xl border border-[#e2e8f0] p-4 space-y-4">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-[#011f4b] mb-1.5">Security Measures</h3>
                      <ul className="text-xs sm:text-sm text-[#03396c] space-y-1.5 list-disc list-inside leading-relaxed">
                        <li>Secure encrypted database storage</li>
                        <li>Restriction to authorized HR personnel only</li>
                        <li>Regular security audits and compliance reviews</li>
                        <li>Legal data retention compliance</li>
                      </ul>
                    </div>
                    <div className="pt-3 border-t border-[#e2e8f0]">
                      <h3 className="text-xs sm:text-sm font-bold text-[#011f4b] mb-1.5">Data Sharing</h3>
                      <ul className="text-xs sm:text-sm text-[#03396c] space-y-1.5 list-disc list-inside leading-relaxed">
                        <li>Information is not shared without your consent</li>
                        <li>Disclosure only when required by law or necessary for employment</li>
                        <li>Binding confidentiality agreements for service providers (for example, payroll processors)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="bg-[#eaf2f8] rounded-2xl border border-[#b3cde0] p-4 sm:p-6 space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-[#011f4b]">Questions or Concerns?</h2>
                  <p className="text-xs sm:text-sm text-[#03396c] leading-relaxed">
                    If you have any questions about our data privacy practices or wish to exercise your data privacy rights, please contact:
                  </p>
                  <div className="text-xs sm:text-sm text-[#03396c] leading-relaxed">
                    <p className="font-bold text-[#011f4b]">Data Protection Officer</p>
                    <p>Email: dpo@company.com</p>
                    <p>Phone: (02) 8123-4567</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrivacyModalOpen(true)}
                    className="text-xs font-bold text-[#005b96] hover:underline pt-1"
                  >
                    View Full Policy Text
                  </button>
                </div>

                {/* Acknowledge */}
                <button
                  type="button"
                  onClick={() => {
                    setPrivacyAck(true);
                    updateDB((prev) =>
                      logAudit(prev, employee.full_name, 'employee', 'PRIVACY_ACK', 'Data Privacy Policy', 'Employee acknowledged policy version PKI-DP-2026-V3.')
                    );
                  }}
                  disabled={privacyAck}
                  className={`w-full inline-flex items-center justify-center gap-2 text-white text-xs sm:text-sm font-bold px-4 py-3.5 rounded-xl transition-colors shadow-sm min-h-11 ${
                    privacyAck ? 'bg-emerald-600 cursor-default' : 'bg-[#011f4b] hover:bg-[#03396c]'
                  }`}
                >
                  {privacyAck ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 shrink-0" />
                  )}
                  {privacyAck
                    ? `Policy Acknowledged by ${employee.full_name}`
                    : 'I Have Read and Understood the Data Privacy Policy'}
                </button>
              </div>
            )}

            {/* SECTION: Need Help (HR Chat) */}
            {activeSection === 'help' && (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden flex flex-col">
                {/* Chat Header */}
                <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-[#e2e8f0] bg-[#f8fafc]">
                  <div className="relative shrink-0">
                    <span className="w-10 h-10 rounded-full bg-[#005b96] text-white flex items-center justify-center">
                      <HelpCircle className="w-5 h-5" />
                    </span>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-[#011f4b] truncate whitespace-nowrap">
                      {activeThread ? hrName(activeThread.hr_id) : 'HR Support'}
                    </h2>
                    <p className="text-[11px] text-emerald-600 font-semibold">Online, replies soon</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="px-4 sm:px-5 py-4 space-y-3 max-h-[60vh] min-h-80 overflow-y-auto bg-white">
                  {helpThreads.length > 1 && (
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {helpThreads.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setActiveThreadId(t.id)}
                          className={`shrink-0 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                            activeThread?.id === t.id
                              ? 'bg-[#005b96] text-white border-[#005b96]'
                              : 'bg-white text-[#03396c] border-[#b3cde0]'
                          }`}
                        >
                          {t.subject_title}
                        </button>
                      ))}
                    </div>
                  )}
                  {chatMessages.map((msg) =>
                    msg.sender_role === 'employee' ? (
                      <div key={msg.id} className="flex justify-end">
                        <div className="max-w-[80%] min-[420px]:max-w-[70%]">
                          <div className="bg-[#005b96] text-white text-xs sm:text-sm leading-relaxed rounded-2xl rounded-br-md px-3.5 py-2.5 break-words">
                            {msg.body}
                          </div>
                          <p className="text-[10px] text-[#6497b1] text-right mt-1 tabular-nums">
                            {msg.created_at}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div key={msg.id} className="flex justify-start items-end gap-1.5">
                        <span
                          title={activeThread ? hrName(activeThread.hr_id) : 'HR Support'}
                          className="w-7 h-7 rounded-full bg-[#005b96] text-white text-[9px] font-bold flex items-center justify-center shrink-0"
                        >
                          {(activeThread ? hrName(activeThread.hr_id) : 'HR Support')
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </span>
                        <div className="max-w-[80%] min-[420px]:max-w-[70%]">
                          <div className="bg-[#f1f5f9] text-[#03396c] text-xs sm:text-sm leading-relaxed rounded-2xl rounded-bl-md px-3.5 py-2.5 border border-[#e2e8f0] break-words">
                            {msg.body}
                          </div>
                          <p className="text-[10px] text-[#6497b1] mt-1 tabular-nums">
                            {activeThread ? hrName(activeThread.hr_id) : 'HR Support'}, {msg.created_at}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Composer */}
                <form
                  onSubmit={handleSendChat}
                  className="flex items-center gap-2 px-3 sm:px-4 py-3 border-t border-[#e2e8f0] bg-[#f8fafc]"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your message to HR..."
                    aria-label="Type your message to HR"
                    className="flex-1 min-w-0 text-xs sm:text-sm p-2.5 sm:p-3 bg-white border border-[#b3cde0] rounded-xl focus:border-[#005b96] focus:outline-none text-[#011f4b] placeholder:text-[#6497b1]"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    aria-label="Send message"
                    className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#005b96] hover:bg-[#03396c] text-white transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </main>

          {/* 4. Right Sidebar: Getting Started Checklist */}
          <aside className="hidden lg:block lg:col-span-3 bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm sticky top-24 space-y-5">
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
              {MILESTONES.map((milestone) => {
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
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-5 h-5 rounded-full bg-[#005b96] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {milestone.step}
                        </span>
                        <span className="text-xs font-semibold text-[#011f4b] leading-snug break-words min-w-0">
                          {milestone.title}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveSection(milestone.target)}
                        className={`text-xs font-bold px-3 py-2 rounded-lg transition-colors shrink-0 min-h-11 inline-flex items-center ${
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
                onClick={() => {
                  setUploadTask(null);
                  setUploadFiles([]);
                }}
                className="text-[#6497b1] hover:text-[#011f4b]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#6497b1] mb-4">
              Select clear, legible PDF, PNG, or JPG files (Max 10MB each). You can select multiple files. Uploaded documents are
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
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setUploadFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])]);
                        e.target.value = '';
                      }
                    }}
                    className="w-full text-xs text-[#6497b1] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#005b96] file:text-white hover:file:bg-[#03396c]"
                  />
                  <div className="text-[11px] text-[#6497b1] mt-2">
                    Supported formats: PDF, JPG, PNG (Max 10MB each, multiple files allowed)
                  </div>
                </div>

                {uploadFiles.length > 0 && (
                  <div className="space-y-1.5">
                    {uploadFiles.map((f) => (
                      <div
                        key={`${f.name}-${f.size}-${f.lastModified}`}
                        className="flex items-center gap-2 text-xs bg-[#eaf2f8] border border-[#b3cde0]/60 rounded-lg px-2.5 py-1.5"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-[#005b96] shrink-0" />
                        <span className="flex-1 truncate text-[#011f4b] font-semibold">{f.name}</span>
                        <span className="text-[#6497b1] tabular-nums shrink-0">{formatFileSize(f.size)}</span>
                        <button
                          type="button"
                          onClick={() => setUploadFiles((prev) => prev.filter((x) => x !== f))}
                          aria-label={`Remove ${f.name}`}
                          className="p-0.5 rounded text-[#6497b1] hover:text-rose-600 transition-colors shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadTask(null);
                      setUploadFiles([]);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-[#6497b1] hover:text-[#011f4b]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadFiles.length === 0}
                    className="bg-[#005b96] hover:bg-[#03396c] text-white text-xs font-semibold px-5 py-2 rounded-xl disabled:opacity-50 transition-colors"
                  >
                    Submit Document{uploadFiles.length > 1 ? 's' : ''}
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
