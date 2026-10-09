"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Lock,
  LogOut,
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

import { EMPLOYMENT_FORMS, fileUrl, type TaskStatus } from '@/lib/onboarding';
import { useMe } from '@/lib/use-me';

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

const PRE_EMPLOYMENT_IDS = [
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
];

interface ApiEmployee {
  id: string;
  employee_number: string;
  position: string;
  department: string;
  manager_name: string;
  start_date: string;
  access_window_days: number;
  status: string;
  avatar_url: string | null;
  welcome_message: string | null;
  completion_pct: number;
  orientation_watched: number;
  created_at: string;
  email: string;
  full_name: string;
}

interface ApiTask {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: TaskStatus;
  required: number;
  display_order: number;
  has_download: number;
  template_file_name: string | null;
  template_file_path: string | null;
  file_name: string | null;
  feedback: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
}

interface ApiTaskFile {
  id: string;
  task_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  status: string;
  created_at: string;
}

interface SharedFileRow {
  slot: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  notes: string | null;
  updated_at: string;
}

interface ApiNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link_section: string | null;
  task_id: string | null;
  is_read: number;
  created_at: string;
}

interface ApiThread {
  id: string;
  subject_type: string;
  subject_title: string;
  task_id: string | null;
  status: string;
  updated_at: string;
}

interface ApiMessage {
  id: number;
  thread_id: string;
  sender_id: string;
  sender_role: 'employee' | 'hr';
  body: string;
  created_at: string;
}

interface Packet {
  employee: ApiEmployee;
  tasks: ApiTask[];
  files: ApiTaskFile[];
  sharedFiles: SharedFileRow[];
  notifications: ApiNotification[];
  unreadCount: number;
  threads: ApiThread[];
  messages: ApiMessage[];
}

// Static first-day content (no database; design-owned).
const FIRST_DAY_BRING: { title: string; desc: string }[] = [
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

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const { me, loading: meLoading } = useMe({ allow: ['employee'] });

  const [packet, setPacket] = useState<Packet | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  const employee = packet?.employee ?? null;
  const tasks = useMemo(() => packet?.tasks ?? [], [packet]);

  const loadPacket = async () => {
    try {
      const res = await fetch('/api/me/packet', { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as Packet;
      setPacket(data);
      setLoadError('');
    } catch {
      setLoadError('Could not load your onboarding packet. Check your connection and refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (me) void loadPacket();
  }, [me]);

  // Active section controlled by Left Sidebar
  const [activeSection, setActiveSection] = useState<NavSection>('welcome');

  // Poll so HR uploads, shared files, and reviews appear live without refresh.
  useEffect(() => {
    if (!me) return;
    const timer = setInterval(() => void loadPacket(), 10000);
    return () => clearInterval(timer);
  }, [me]);

  // Auto mark-read: opening a section clears its unread alerts, no bell click needed.
  useEffect(() => {
    if (!me || !packet) return;
    const ids = (packet.notifications ?? [])
      .filter((n) => !n.is_read && n.link_section === activeSection)
      .map((n) => n.id);
    if (ids.length === 0) return;
    (async () => {
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
      } catch {
        return;
      }
      setPacket((prev) =>
        prev
          ? {
              ...prev,
              notifications: prev.notifications.map((n) =>
                ids.includes(n.id) ? { ...n, is_read: 1 } : n
              ),
              unreadCount: Math.max(0, prev.unreadCount - ids.length),
            }
          : prev
      );
    })();
  }, [me, packet, activeSection]);

  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Mobile checklist collapsible
  const [mobileChecklistOpen, setMobileChecklistOpen] = useState(true);

  // Header notifications dropdown
  const [notifOpen, setNotifOpen] = useState(false);

  // First day orientation checklist progress (day-of tracker)
  const [orientationChecks, setOrientationChecks] = useState<boolean[]>(() =>
    Array(ORIENTATION_ITEMS.length).fill(false)
  );

  // Section acknowledgements are derived from the checklist tasks (the only
  // database these sections touch). Section content itself is fully static.
  const sectionDone = (category: string): boolean =>
    tasks.some((t) => t.category === category && (t.status === 'submitted' || t.status === 'approved'));
  const firstDayReady = sectionDone('first_day');
  const privacyAck = sectionDone('privacy');
  const medicalReviewed = sectionDone('medical');

  // Modals & Upload State
  const [uploadTask, setUploadTask] = useState<{ id: string; title: string; required: boolean } | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Files per requirement, derived from the server file list
  const reqFiles = useMemo(() => {
    const map: Record<string, { name: string; sizeLabel: string; path: string }[]> = {};
    for (const f of packet?.files ?? []) {
      (map[f.task_id] = map[f.task_id] || []).push({
        name: f.file_name,
        sizeLabel: formatFileSize(f.file_size),
        path: fileUrl(f.file_path),
      });
    }
    return map;
  }, [packet]);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // Help Chat State
  const [chatInput, setChatInput] = useState('');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const helpThreads = useMemo(
    () =>
      (packet?.threads ?? [])
        .filter((t) => t.subject_type === 'help')
        .sort((a, b) => (a.updated_at > b.updated_at ? -1 : 1)),
    [packet]
  );
  const activeThread = helpThreads.find((t) => t.id === activeThreadId) ?? helpThreads[0] ?? null;
  const chatMessages = useMemo(
    () => (packet?.messages ?? []).filter((m) => activeThread && m.thread_id === activeThread.id),
    [packet, activeThread]
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages, activeSection]);

  // ID photos come from the server file list for the photo requirement
  const uploadedPhotos = useMemo(
    () =>
      (packet?.files ?? [])
        .filter((f) => f.task_id === 'req-photo')
        .map((f) => ({ id: f.id, name: f.file_name, sizeLabel: formatFileSize(f.file_size), previewUrl: fileUrl(f.file_path) })),
    [packet]
  );
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  // Personal data assistant inputs (submitted to HR, never prefilled)
  const [pdsData, setPdsData] = useState({
    tin: '',
    sss: '',
    philhealth: '',
    pagibig: '',
    bankAccount: '',
    emergencyContact: '',
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
  const totalRequired = tasks.filter((t) => t.required === 1).length;
  const approvedCount = tasks.filter((t) => t.required === 1 && t.status === 'approved').length;
  const progressPct = Math.round((approvedCount / (totalRequired || 1)) * 100);

  // Days left in the fixed onboarding window counted from account creation.
  const remainingDays = useMemo(() => {
    if (!employee) return null;
    const windowDays = Number(employee.access_window_days) || 30;
    const created = new Date(String(employee.created_at).replace(' ', 'T')).getTime();
    if (!Number.isFinite(created)) return windowDays;
    // eslint-disable-next-line react-hooks/purity -- clock read for a countdown label
    const elapsed = Math.max(0, Math.floor((Date.now() - created) / 86400000));
    return Math.max(0, windowDays - elapsed);
  }, [employee]);

  // Filter tasks specific to Pre-Employment Requirements checklist
  const preEmploymentRequirements = useMemo(() => {
    return tasks.filter((t) => PRE_EMPLOYMENT_IDS.includes(t.id));
  }, [tasks]);

  // HR alerts: tasks HR flagged with feedback
  const hrAlerts = useMemo(() => {
    return tasks.filter((t) => t.status === 'needs_changes' && t.feedback);
  }, [tasks]);

  const myNotifications = useMemo(() => {
    return (packet?.notifications ?? []).slice(0, 8);
  }, [packet]);

  const serverUnread = packet?.unreadCount ?? 0;
  const unreadCount = useMemo(() => {
    return hrAlerts.length + serverUnread;
  }, [hrAlerts, serverUnread]);

  const sharedBySlot = useMemo(() => {
    const map: Record<string, SharedFileRow> = {};
    for (const row of packet?.sharedFiles ?? []) map[row.slot] = row;
    return map;
  }, [packet]);

  const markNotifRead = async (id: number) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setPacket((prev) =>
        prev
          ? {
              ...prev,
              notifications: prev.notifications.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)),
              unreadCount: Math.max(0, prev.unreadCount - 1),
            }
          : prev
      );
    } catch {
      // Bell state refreshes on next packet load.
    }
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

  const taskSection = (category: string): NavSection => {
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

  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const handleSignOut = async () => {
    setConfirmSignOut(false);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleFileUpload = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!uploadTask || uploadFiles.length === 0) return;
    setUploading(true);
    setUploadError('');
    setActionError('');
    try {
      const payload = new FormData();
      for (const f of uploadFiles) payload.append('files', f);
      const url = uploadTask.id.startsWith('form-')
        ? '/api/forms/submit'
        : `/api/tasks/${encodeURIComponent(uploadTask.id)}/submit`;
      if (uploadTask.id.startsWith('form-')) payload.append('formType', uploadTask.id);
      const res = await fetch(url, { method: 'POST', body: payload });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'Upload failed. Try again.');
        return;
      }
      setUploadSuccess(true);
      await loadPacket();
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadTask(null);
        setUploadFiles([]);
      }, 1200);
    } catch {
      setUploadError('Could not reach the server. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSendChat = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    setActionError('');
    try {
      const threadId = activeThread && activeThread.status !== 'closed' ? activeThread.id : null;
      if (threadId) {
        const res = await fetch(`/api/threads/${threadId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: text }),
        });
        if (!res.ok) throw new Error();
        setActiveThreadId(threadId);
      } else {
        const res = await fetch('/api/threads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: text.length > 48 ? `${text.slice(0, 48)}...` : text,
            body: text,
          }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setActiveThreadId(data.id);
      }
      setChatInput('');
      await loadPacket();
    } catch {
      setActionError('Message could not be sent. Try again.');
    }
  };

  const handlePhotoFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const accepted = ['image/png', 'image/jpeg', 'image/jpg'];
    const valid = Array.from(files).filter((file) => {
      if (!accepted.includes(file.type) && !/\.(png|jpe?g)$/i.test(file.name)) {
        alert(`"${file.name}" is not supported. Please upload PNG, JPG, or JPEG.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`"${file.name}" exceeds 5MB. Please choose a smaller file.`);
        return false;
      }
      return true;
    });
    if (valid.length === 0) return;
    setActionError('');
    try {
      const payload = new FormData();
      for (const f of valid) payload.append('files', f);
      const res = await fetch('/api/tasks/req-photo/submit', { method: 'POST', body: payload });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Photo upload failed.');
        return;
      }
      await loadPacket();
    } catch {
      setActionError('Could not reach the server. Try again.');
    }
  };

  const handleMedicalReviewed = async () => {
    setActionError('');
    try {
      const res = await fetch('/api/me/medical', { method: 'POST' });
      if (!res.ok) throw new Error();
      await loadPacket();
    } catch {
      setActionError('Could not save. Try again.');
    }
  };

  const handleFirstDayReady = async () => {
    setActionError('');
    try {
      const res = await fetch('/api/me/firstday', { method: 'POST' });
      if (!res.ok) throw new Error();
      await loadPacket();
    } catch {
      setActionError('Could not save. Try again.');
    }
  };

  const handlePrivacyAck = async () => {
    setActionError('');
    try {
      const res = await fetch('/api/privacy/ack', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Could not save acknowledgement.');
        return;
      }
      await loadPacket();
    } catch {
      setActionError('Could not reach the server. Try again.');
    }
  };

  const handlePdsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    try {
      const res = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formType: 'personal-data', formData: pdsData }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Could not submit the form.');
        return;
      }
      setIsFormModalOpen(false);
      await loadPacket();
    } catch {
      setActionError('Could not reach the server. Try again.');
    }
  };

  if (meLoading || !me || loading || !packet || !employee) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        {loadError ? (
          <div className="text-center space-y-3 px-6">
            <p className="text-sm text-rose-600">{loadError}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void loadPacket();
              }}
              className="px-5 py-2.5 text-xs font-bold bg-[#011f4b] text-white rounded-xl"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="w-8 h-8 border-2 border-[#b3cde0] border-t-[#005b96] rounded-full animate-spin" />
        )}
      </div>
    );
  }

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
                            void markNotifRead(n.id);
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
                      {hrAlerts.length === 0 && myNotifications.length === 0 && (
                        <p className="px-4 py-6 text-xs text-[#6497b1] text-center">
                          You are all caught up.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Info with countdown below name */}
              <div className="flex items-center gap-1.5 sm:gap-3 bg-[#f8fafc] px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-lg sm:rounded-xl border border-[#e2e8f0] min-w-0 max-w-[34vw] min-[420px]:max-w-[30vw] sm:max-w-none overflow-hidden">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-[#b3cde0] shrink-0 bg-[#005b96] flex items-center justify-center text-[10px] font-bold text-white">
                  {employee.avatar_url ? (
                    <Image
                      src={employee.avatar_url}
                      alt={employee.full_name}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initialsOf(employee.full_name)
                  )}
                </div>
                <div className="text-left min-w-0 leading-none">
                  <div className="text-[11px] sm:text-xs font-bold text-[#011f4b] leading-tight truncate whitespace-nowrap">
                    {employee.full_name}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 min-w-0">
                    <Hourglass className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 animate-pulse shrink-0" />
                    <span className="text-[9px] sm:text-[10px] font-semibold text-amber-600 whitespace-nowrap truncate leading-tight">
                      {remainingDays === null
                        ? 'Loading...'
                        : remainingDays > 0
                          ? `${remainingDays} days remaining`
                          : 'Access window closed'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sign Out (desktop only; mobile uses drawer sidebar logout) */}
              <button
                type="button"
                onClick={() => setConfirmSignOut(true)}
                className="hidden sm:inline-flex text-[#6497b1] hover:text-[#011f4b] p-2 rounded-xl hover:bg-[#eaf2f8] transition-colors shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
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

      {actionError && (
        <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{actionError}</span>
          </div>
        </div>
      )}

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
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  setConfirmSignOut(true);
                }}
                className="flex items-center gap-2 text-xs font-semibold text-[#6497b1] hover:text-rose-600 transition-colors px-3 py-2 rounded-xl hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
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
            {/* Mobile: Getting Started Checklist */}
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
                              {req.required === 1 ? (
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
                                <a
                                  key={`${req.id}-${f.name}`}
                                  href={f.path}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-[#005b96] font-semibold bg-[#eaf2f8] px-2.5 py-1 rounded-md max-w-full hover:underline"
                                >
                                  <FileCheck className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate max-w-[140px] min-[420px]:max-w-[200px]">{f.name}</span>
                                </a>
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
                          {req.has_download === 1 && (
                            req.template_file_path ? (
                              <a
                                href={fileUrl(req.template_file_path)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-3 min-[420px]:py-2 text-xs font-semibold whitespace-nowrap border border-[#b3cde0] text-[#005b96] hover:bg-[#eaf2f8] rounded-xl transition-colors min-h-11"
                              >
                                <Download className="w-3.5 h-3.5 shrink-0" />
                                Download Form
                              </a>
                            ) : (
                              <button
                                type="button"
                                disabled
                                title="No file uploaded by HR yet"
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-3 min-[420px]:py-2 text-xs font-semibold whitespace-nowrap border border-[#e2e8f0] bg-slate-100 text-slate-400 rounded-xl cursor-not-allowed min-h-11"
                              >
                                <Download className="w-3.5 h-3.5 shrink-0" />
                                Download Form
                              </button>
                            )
                          )}

                          <button
                            type="button"
                            onClick={() => setUploadTask({ id: req.id, title: req.title, required: req.required === 1 })}
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
                  {/* User Profile Header */}
                  <div className="flex flex-col items-center text-center gap-3 pb-5 mb-5 border-b border-[#e2e8f0]">
                    <div className="relative">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white shadow-md bg-[#005b96] ring-2 ring-[#b3cde0] flex items-center justify-center text-2xl font-extrabold text-white">
                        {employee.avatar_url ? (
                          <Image
                            src={employee.avatar_url}
                            alt={employee.full_name}
                            width={112}
                            height={112}
                            className="w-full h-full object-cover"
                            priority
                          />
                        ) : (
                          initialsOf(employee.full_name)
                        )}
                      </div>
                      <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center" title="Active">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-extrabold text-[#011f4b] leading-tight break-words">
                        {employee.full_name}
                      </h2>
                      <p className="text-xs sm:text-sm font-semibold text-[#005b96] mt-0.5">
                        {employee.position}
                      </p>
                    </div>
                  </div>

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
                      {employee.welcome_message || 'Before your starting date, we kindly ask that you complete the following tasks and review the documents by following the instructions below.'}
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
                  {EMPLOYMENT_FORMS.map((formItem) => {
                    const shared = sharedBySlot[formItem.id];
                    return (
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
                          {shared ? (
                            <a
                              href={fileUrl(shared.file_path)}
                              target="_blank"
                              rel="noreferrer"
                              title={`Download ${shared.file_name}`}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-3 min-[420px]:py-2.5 text-xs font-semibold whitespace-nowrap border border-[#b3cde0] text-[#005b96] hover:bg-[#eaf2f8] rounded-xl transition-colors min-h-11"
                            >
                              <Download className="w-3.5 h-3.5 shrink-0" />
                              Download Form
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              title="No file uploaded by HR yet"
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-3 min-[420px]:py-2.5 text-xs font-semibold whitespace-nowrap border border-[#e2e8f0] bg-slate-100 text-slate-400 rounded-xl cursor-not-allowed min-h-11"
                            >
                              <Download className="w-3.5 h-3.5 shrink-0" />
                              Download Form
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setUploadTask({
                                id: formItem.id,
                                title: formItem.title,
                                required: true,
                              })
                            }
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-3 min-[420px]:py-2.5 text-xs font-semibold whitespace-nowrap bg-[#011f4b] hover:bg-[#03396c] text-white rounded-xl transition-colors shadow-sm min-h-11"
                          >
                            <UploadCloud className="w-3.5 h-3.5 shrink-0" />
                            Upload Completed Form
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
                          void handlePhotoFiles(e.dataTransfer.files);
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
                            void handlePhotoFiles(e.target.files);
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
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Download ${photo.name}`}
                                className="p-2 rounded-lg text-[#005b96] hover:bg-emerald-100 transition-colors shrink-0"
                              >
                                <Download className="w-4 h-4" />
                              </a>
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
                  {sharedBySlot['medical-referral'] ? (
                    <a
                      href={fileUrl(sharedBySlot['medical-referral'].file_path)}
                      target="_blank"
                      rel="noreferrer"
                      title={`Download ${sharedBySlot['medical-referral'].file_name}`}
                      className="inline-flex items-center justify-center gap-1.5 bg-[#011f4b] hover:bg-[#03396c] text-white text-xs font-semibold px-4 py-3 sm:py-2.5 rounded-xl transition-colors shadow-sm min-h-11"
                    >
                      <Download className="w-3.5 h-3.5 shrink-0" />
                      Download Referral Form
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title="No file uploaded by HR yet"
                      className="inline-flex items-center justify-center gap-1.5 bg-slate-200 text-slate-400 text-xs font-semibold px-4 py-3 sm:py-2.5 rounded-xl cursor-not-allowed min-h-11"
                    >
                      <Download className="w-3.5 h-3.5 shrink-0" />
                      Download Referral Form
                    </button>
                  )}
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
                        <span className="font-bold text-[#011f4b]">Clinica Manila</span>
                        {' at SM Center Pasig, E. Rodriguez Jr. Ave corner Dona Julia Vargas Ave., Frontera Verde, Ortigas Center, Pasig, 1604 Metro Manila.'}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-[#005b96] shrink-0 mt-0.5" />
                      <p className="text-[#03396c]">(02) 8696 7055</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-[#005b96] shrink-0 mt-0.5" />
                      <p className="text-[#03396c]">Monday to Saturday: 8:00 AM – 6:00 PM</p>
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
                  onClick={() => void handleMedicalReviewed()}
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
                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 text-xs sm:text-sm leading-relaxed">
                    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3">
                      <p className="font-bold text-[#011f4b] mb-1.5">Acceptable</p>
                      <ul className="text-[#03396c] space-y-1 list-disc list-inside">
                        <li>Collared shirts / blouses</li>
                        <li>Dress pants / slacks</li>
                        <li>Closed-toe shoes</li>
                        <li>Modest dresses / skirts (knee-length)</li>
                      </ul>
                    </div>
                    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3">
                      <p className="font-bold text-[#011f4b] mb-1.5">Not Allowed</p>
                      <ul className="text-[#03396c] space-y-1 list-disc list-inside">
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
                        <span className="font-bold text-[#011f4b]">Office Location:</span> Units 3301-3302,
                        33rd Floor Corporate Finance Plaza Condominium, Ruby Road, Ortigas Center,
                        Barangay San Antonio, Pasig City.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-[#005b96] shrink-0 mt-0.5" />
                      <p className="text-[#03396c]">
                        <span className="font-bold text-[#011f4b]">Report To:</span> HR Department -
                        Reception Area.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Things To Bring */}
                <div className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-[#011f4b]">Things To Bring</h2>
                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                    {FIRST_DAY_BRING.map((item) => (
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
                          <span className="text-[11px] sm:text-xs text-[#6497b1] block leading-relaxed mt-0.5">
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
                  <div className="w-full bg-[#011f4b] rounded-2xl overflow-hidden shadow-sm">
                    <span className="flex flex-col items-center justify-center gap-2 px-6 py-20 sm:py-28 min-h-96 text-center">
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
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#6497b1] leading-relaxed text-center">
                    Watch this video to learn more about our company culture, history, and what makes us unique.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleFirstDayReady()}
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
                  <ul className="text-xs sm:text-sm text-[#03396c] space-y-1.5 list-disc list-inside leading-relaxed">
                    <li>Basic identification information (name, address, contact details)</li>
                    <li>Government-issued IDs and numbers (SSS, PhilHealth, PAG-IBIG, TIN)</li>
                    <li>Educational background and employment history</li>
                    <li>Medical records for pre-employment requirements</li>
                    <li>Payroll and banking information</li>
                    <li>Performance evaluations and work-related documents</li>
                  </ul>
                </div>

                {/* How We Use It */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-6 shadow-sm space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#eaf2f8] flex items-center justify-center text-[#005b96] shrink-0">
                      <Lock className="w-4.5 h-4.5" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-[#011f4b] leading-snug">
                      How We Use Your Information
                    </h2>
                  </div>
                  <ul className="text-xs sm:text-sm text-[#03396c] space-y-1.5 list-disc list-inside leading-relaxed">
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
                  <ul className="text-xs sm:text-sm text-[#03396c] space-y-1.5 leading-relaxed">
                    <li><strong className="text-[#011f4b]">Be Informed:</strong> Know how your data is being collected and used</li>
                    <li><strong className="text-[#011f4b]">Access:</strong> Request access to your personal information</li>
                    <li><strong className="text-[#011f4b]">Correct:</strong> Request correction of inaccurate or incomplete data</li>
                    <li><strong className="text-[#011f4b]">Erase or Block:</strong> Request deletion or blocking of your data under certain conditions</li>
                    <li><strong className="text-[#011f4b]">Object:</strong> Object to processing of your data for legitimate reasons</li>
                    <li><strong className="text-[#011f4b]">Damages:</strong> Be indemnified for damages due to inaccurate, incomplete, or unauthorized processing</li>
                  </ul>
                </div>

                {/* HR Internal Handling */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-6 shadow-sm space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-[#011f4b] leading-snug">
                    HR Internal Data Handling Policy
                  </h2>
                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 text-xs sm:text-sm leading-relaxed">
                    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3">
                      <p className="font-bold text-[#011f4b] mb-1.5">Security Measures</p>
                      <ul className="text-[#03396c] space-y-1 list-disc list-inside">
                        <li>Secure encrypted database storage</li>
                        <li>Restricted to authorized HR personnel only</li>
                        <li>Regular security audits and compliance reviews</li>
                        <li>Legal data retention compliance</li>
                      </ul>
                    </div>
                    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3">
                      <p className="font-bold text-[#011f4b] mb-1.5">Data Sharing</p>
                      <ul className="text-[#03396c] space-y-1 list-disc list-inside">
                        <li>Information is not shared without consent</li>
                        <li>Disclosure only when required by law or necessary for employment</li>
                        <li>Confidentiality agreements for service providers (e.g. payroll processors)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="bg-[#eaf2f8] rounded-2xl border border-[#b3cde0] p-4 sm:p-6 space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-[#011f4b]">Questions or Concerns?</h2>
                  <p className="text-xs sm:text-sm text-[#03396c] leading-relaxed">
                    If you have any questions about our data privacy practices or wish to exercise your
                    data privacy rights, please contact:
                  </p>
                  <p className="text-xs sm:text-sm text-[#03396c] leading-relaxed">
                    <span className="font-bold text-[#011f4b]">Data Protection Officer</span><br />
                    Email: dpo@company.com<br />
                    Phone: (02) 8123-4567
                  </p>
                </div>

                {/* Acknowledge */}
                <button
                  type="button"
                  onClick={() => void handlePrivacyAck()}
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
                      HR Support
                    </h2>
                    <p className="text-[11px] text-emerald-600 font-semibold">Online, replies soon</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="px-4 sm:px-5 py-4 space-y-3 h-[60vh] overflow-y-auto bg-white">
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
                          title="HR Support"
                          className="w-7 h-7 rounded-full bg-[#005b96] text-white text-[9px] font-bold flex items-center justify-center shrink-0"
                        >
                          HS
                        </span>
                        <div className="max-w-[80%] min-[420px]:max-w-[70%]">
                          <div className="bg-[#f1f5f9] text-[#03396c] text-xs sm:text-sm leading-relaxed rounded-2xl rounded-bl-md px-3.5 py-2.5 border border-[#e2e8f0] break-words">
                            {msg.body}
                          </div>
                          <p className="text-[10px] text-[#6497b1] mt-1 tabular-nums">
                            HR Support, {msg.created_at}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Composer */}
                <form
                  onSubmit={(e) => {
                    void handleSendChat(e);
                  }}
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

      {/* Sign Out Confirm Modal */}
      {confirmSignOut && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#e2e8f0]">
            <h3 className="text-base font-bold text-[#011f4b]">Sign out?</h3>
            <p className="text-xs text-[#6497b1] mt-1 leading-relaxed">
              You will need to sign in again to continue.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setConfirmSignOut(false)}
                className="px-4 py-2 text-xs font-semibold text-[#6497b1] hover:text-[#011f4b]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="bg-[#011f4b] hover:bg-[#03396c] text-white text-xs font-bold px-5 py-2 rounded-xl transition-colors"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

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
                  setUploadError('');
                }}
                className="text-[#6497b1] hover:text-[#011f4b]"
                aria-label="Close upload"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#6497b1] mb-4">
              Select clear, legible PDF, PNG, or JPG files (Max 10MB each). You can select multiple files. Uploaded documents are
              encrypted and accessible only by HR officers.
            </p>

            {uploadError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {uploadError}
              </div>
            )}

            {uploadSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <div className="text-sm font-bold text-emerald-800">Document Uploaded Successfully!</div>
                <div className="text-xs text-emerald-600">
                  HR has been notified and will review your submission shortly.
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  void handleFileUpload(e);
                }}
                className="space-y-4"
              >
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
                      setUploadError('');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-[#6497b1] hover:text-[#011f4b]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadFiles.length === 0 || uploading}
                    className="bg-[#005b96] hover:bg-[#03396c] text-white text-xs font-semibold px-5 py-2 rounded-xl disabled:opacity-50 transition-colors"
                  >
                    {uploading ? 'Uploading...' : `Submit Document${uploadFiles.length > 1 ? 's' : ''}`}
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
                aria-label="Close form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                void handlePdsSubmit(e);
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
    </div>
  );
}
