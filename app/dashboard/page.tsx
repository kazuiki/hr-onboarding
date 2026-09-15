"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  Calendar,
  Briefcase,
  ShieldCheck,
  FileText,
  Camera,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  Stethoscope,
  MapPin,
  HelpCircle,
  Lock,
  Download,
  Eye,
  LogOut,
  Sparkles,
  Send,
  X,
  FileCheck,
  Check,
} from 'lucide-react';
import {
  INITIAL_EMPLOYEE,
  INITIAL_TASKS,
  INITIAL_MEDICAL,
  INITIAL_FIRST_DAY,
  INITIAL_PRIVACY_TEXT,
  INITIAL_HELP_INQUIRIES,
  MockTask,
} from '@/lib/mock-data';

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const [employee] = useState(INITIAL_EMPLOYEE);
  const [tasks, setTasks] = useState<MockTask[]>(INITIAL_TASKS);
  const [medical] = useState(INITIAL_MEDICAL);
  const [helpInquiries, setHelpInquiries] = useState(INITIAL_HELP_INQUIRIES);
  const [orientationWatched, setOrientationWatched] = useState(false);

  // Gate: if orientation hasn't been completed, bounce back to the video page
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const watched = localStorage.getItem('pki_orientation_watched') === 'true';
    setOrientationWatched(watched);
    if (!watched) {
      router.replace('/orientation');
    }
  }, [router]);

  // UI State
  const [activeSection, setActiveSection] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<MockTask | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Help Form State
  const [helpSubject, setHelpSubject] = useState('');
  const [helpMessage, setHelpMessage] = useState('');
  const [helpSubmitted, setHelpSubmitted] = useState(false);

  // ID Photo state
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop'
  );

  // Form input states
  const [pdsData, setPdsData] = useState({
    tin: '321-456-789-000',
    sss: '34-5678912-3',
    philhealth: '12-345678901-2',
    pagibig: '1234-5678-9012',
    bankAccount: 'BDO Unibank - 004812399120',
    emergencyContact: 'Carlos Santos (Spouse) - +63 917 555 0192',
  });

  // Calculate Progress
  const totalRequired = tasks.filter((t) => t.required).length;
  const approvedCount = tasks.filter((t) => t.required && t.status === 'approved').length;
  const progressPct = Math.round((approvedCount / (totalRequired || 1)) * 100);

  // Status Badge Helper
  const renderStatusBadge = (status: MockTask['status']) => {
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
            Under Review
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
  };

  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !uploadFile) return;

    // Update local task state to 'submitted'
    setTasks((prev) =>
      prev.map((t) =>
        t.id === selectedTask.id
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
      setIsUploadModalOpen(false);
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
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] pb-16">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#011f4b] border-b border-[#03396c] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#005b96] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white">
                  Philkoei International
                </span>
                <span className="text-[#b3cde0] text-xs ml-2 hidden sm:inline">
                  Employee Onboarding
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-[#03396c] px-3.5 py-1.5 rounded-xl border border-[#005b96]/40">
                <div className="w-7 h-7 rounded-full overflow-hidden border border-[#b3cde0]">
                  <Image
                    src={employee.avatar_url}
                    alt={employee.full_name}
                    width={28}
                    height={28}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-white">{employee.full_name}</div>
                  <div className="text-[10px] text-[#b3cde0]">{employee.employee_number}</div>
                </div>
              </div>

              <Link
                href="/login"
                className="text-[#b3cde0] hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* 1. Welcome & Employee Information Hero Header */}
        <section className="bg-gradient-to-r from-[#011f4b] via-[#03396c] to-[#005b96] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#005b96]/30 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold text-[#b3cde0] border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-[#b3cde0]" />
                Onboarding Period: Active (Within 30-Day Pre-Start Window)
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                Welcome to Philkoei, {employee.full_name}!
              </h1>
              <p className="text-sm sm:text-base text-[#b3cde0] leading-relaxed">
                {employee.welcome_message}
              </p>

              {/* Employee Meta Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-[#011f4b]/60 border border-white/15 p-2.5 rounded-xl">
                  <span className="text-[11px] text-[#b3cde0] block font-medium">Position</span>
                  <span className="text-xs font-bold text-white truncate block">{employee.position}</span>
                </div>
                <div className="bg-[#011f4b]/60 border border-white/15 p-2.5 rounded-xl">
                  <span className="text-[11px] text-[#b3cde0] block font-medium">Department</span>
                  <span className="text-xs font-bold text-white truncate block">{employee.department}</span>
                </div>
                <div className="bg-[#011f4b]/60 border border-white/15 p-2.5 rounded-xl">
                  <span className="text-[11px] text-[#b3cde0] block font-medium">Supervisor</span>
                  <span className="text-xs font-bold text-white truncate block">{employee.manager_name}</span>
                </div>
                <div className="bg-[#011f4b]/60 border border-white/15 p-2.5 rounded-xl">
                  <span className="text-[11px] text-[#b3cde0] block font-medium">Start Date</span>
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#b3cde0]" />
                    {employee.start_date}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Card (Section 9) */}
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 flex flex-col items-center justify-center text-center min-w-[240px]">
              <div className="text-xs font-bold text-[#b3cde0] uppercase tracking-wider mb-2">
                Overall Onboarding
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold text-white">
                {progressPct}%
              </div>
              <div className="w-full bg-black/30 rounded-full h-2.5 mt-3 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="text-xs text-[#b3cde0] mt-2 font-medium">
                {approvedCount} of {totalRequired} Requirements Approved
              </div>
            </div>
          </div>
        </section>

        {/* Section Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', label: 'All Requirements' },
            { id: 'forms', label: '2. Employment Forms' },
            { id: 'photo', label: '3. ID Photo' },
            { id: 'docs', label: '4. Documents & Clearances' },
            { id: 'medical', label: '5. Medical Examination' },
            { id: 'firstday', label: '6. First-Day Prep' },
            { id: 'privacy', label: '7. Data Privacy' },
            { id: 'help', label: '8. Need Help?' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeSection === tab.id
                  ? 'bg-[#005b96] text-white shadow-sm'
                  : 'bg-white border border-[#e2e8f0] text-[#03396c] hover:bg-[#eaf2f8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 2. Employment Forms Section */}
        {(activeSection === 'all' || activeSection === 'forms') && (
          <section className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#eaf2f8] flex items-center justify-center text-[#005b96]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#011f4b]">2. Employment Forms</h2>
                  <p className="text-xs text-[#6497b1]">
                    Fill out mandatory employment data online or download printable PDF templates.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tasks
                .filter((t) => t.category === 'form')
                .map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] flex flex-col justify-between hover:border-[#b3cde0] transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-sm text-[#011f4b]">{task.title}</h3>
                        {renderStatusBadge(task.status)}
                      </div>
                      <p className="text-xs text-[#6497b1] leading-relaxed mb-4">
                        {task.description}
                      </p>
                      {task.feedback && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 mb-3 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{task.feedback}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-[#e2e8f0]">
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setIsFormModalOpen(true);
                        }}
                        className="flex-1 bg-[#005b96] hover:bg-[#03396c] text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        {task.status === 'approved' ? 'View Details' : 'Fill Form Online'}
                      </button>
                      <button
                        title="Download Template PDF"
                        className="p-2 border border-[#b3cde0] rounded-lg text-[#03396c] hover:bg-[#eaf2f8] transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* 3. ID Photo Section */}
        {(activeSection === 'all' || activeSection === 'photo') && (
          <section className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#eaf2f8] flex items-center justify-center text-[#005b96]">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#011f4b]">3. Company ID 2x2 Photograph</h2>
                <p className="text-xs text-[#6497b1]">
                  Official portrait used for your Philkoei RFID access badge and security registry.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Photo Preview & Upload Card */}
              <div className="lg:col-span-1 border border-[#b3cde0] rounded-2xl p-6 bg-[#f8fafc] flex flex-col items-center text-center">
                <div className="w-40 h-40 rounded-2xl overflow-hidden border-4 border-white shadow-md mb-4 bg-slate-200 relative group">
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

                <div className="mb-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Photo Approved for RFID Printing
                  </span>
                </div>

                <label className="w-full cursor-pointer bg-[#005b96] hover:bg-[#03396c] text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <UploadCloud className="w-4 h-4" />
                  Upload New 2x2 Photo
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
                <span className="text-[10px] text-[#6497b1] mt-2">JPG or PNG, Max 5MB (Square 1:1 or 2x2 ratio)</span>
              </div>

              {/* Photo Guidelines Card */}
              <div className="lg:col-span-2 border border-[#e2e8f0] rounded-2xl p-6 bg-white space-y-4">
                <h3 className="font-bold text-sm text-[#011f4b]">ID Photo Quality Guidelines</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-[#eaf2f8] rounded-xl border border-[#b3cde0]/40">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#005b96] mb-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Acceptable Criteria
                    </div>
                    <ul className="text-xs text-[#03396c] space-y-1 list-disc list-inside">
                      <li>Plain solid white or off-white background</li>
                      <li>Formal or smart-casual collared attire</li>
                      <li>Neutral expression or pleasant natural smile</li>
                      <li>Even lighting without shadows or glare on glasses</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-red-50/50 rounded-xl border border-red-200/60">
                    <div className="flex items-center gap-2 text-xs font-bold text-red-700 mb-1">
                      <X className="w-3.5 h-3.5 text-red-600" />
                      Unacceptable Photo Items
                    </div>
                    <ul className="text-xs text-red-900/80 space-y-1 list-disc list-inside">
                      <li>Selfies with angled poses or heavy filters</li>
                      <li>Hats, caps, or dark sunglasses</li>
                      <li>Distracting patterned backgrounds or outdoor shots</li>
                      <li>Cropped group photos or low-resolution scans</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 4. Employment Requirements Section */}
        {(activeSection === 'all' || activeSection === 'docs') && (
          <section className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#eaf2f8] flex items-center justify-center text-[#005b96]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#011f4b]">4. Employment Requirements & Clearances</h2>
                <p className="text-xs text-[#6497b1]">
                  Upload encrypted government identifications, certifications, and compliance clearances.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {tasks
                .filter((t) => t.category === 'document')
                .map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#b3cde0] transition-colors"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-[#011f4b]">{task.title}</h3>
                        {renderStatusBadge(task.status)}
                      </div>
                      <p className="text-xs text-[#6497b1]">{task.description}</p>
                      {task.file_name && (
                        <div className="inline-flex items-center gap-1.5 text-xs text-[#005b96] font-medium bg-[#eaf2f8] px-2.5 py-0.5 rounded-md">
                          <FileText className="w-3 h-3" />
                          {task.file_name}
                        </div>
                      )}
                      {task.feedback && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{task.feedback}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setIsUploadModalOpen(true);
                        }}
                        className="bg-[#005b96] hover:bg-[#03396c] text-white text-xs font-semibold py-2 px-3.5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        {task.status === 'needs_changes' ? 'Re-upload File' : 'Upload Document'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* 5. Medical Instructions & Referral Section */}
        {(activeSection === 'all' || activeSection === 'medical') && (
          <section className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#eaf2f8] flex items-center justify-center text-[#005b96]">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#011f4b]">5. Pre-Employment Medical Examination (PEME)</h2>
                  <p className="text-xs text-[#6497b1]">
                    Accredited diagnostic clinic instructions and company-covered billing details.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#eaf2f8] text-[#005b96] border border-[#b3cde0]">
                <Clock className="w-3.5 h-3.5 text-[#005b96]" />
                In Progress
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-[#b3cde0] bg-[#eaf2f8]/40 space-y-2">
                  <div className="text-xs font-bold text-[#011f4b]">Accredited Health Facility</div>
                  <div className="text-sm font-semibold text-[#005b96]">{medical.clinic_name}</div>
                  <div className="text-xs text-[#03396c] flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-[#005b96] mt-0.5" />
                    <span>{medical.clinic_address}</span>
                  </div>
                  <div className="text-xs text-[#6497b1] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0 text-[#005b96]" />
                    <span>{medical.clinic_schedule}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] text-xs text-[#03396c]">
                  <div className="font-bold text-[#011f4b] mb-1">Company Expense Coverage:</div>
                  <p className="text-[#6497b1] leading-relaxed">{medical.expense_notes}</p>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#011f4b] mb-2">Medical Steps to Complete:</h3>
                  <ol className="text-xs text-[#03396c] space-y-2 list-decimal list-inside">
                    <li>Download & print the Philkoei Medical Referral Slip below.</li>
                    <li>Fast for 8–10 hours before blood extraction.</li>
                    <li>Present the slip and valid government ID at Hi-Precision front desk.</li>
                    <li>Upload your clinic fit-to-work acknowledgement slip below.</li>
                  </ol>
                </div>

                <div className="pt-4 mt-4 border-t border-[#e2e8f0] flex flex-wrap gap-3">
                  <a
                    href="#download"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-[#b3cde0] text-[#005b96] hover:bg-[#eaf2f8] px-3 py-2 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Referral Slip (PDF)
                  </a>
                  <button
                    onClick={() => {
                      const medTask = tasks.find((t) => t.category === 'medical') || tasks[0];
                      setSelectedTask(medTask);
                      setIsUploadModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#005b96] hover:bg-[#03396c] text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Upload Fit-To-Work Slip
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 6. First-Day Preparation Section */}
        {(activeSection === 'all' || activeSection === 'firstday') && (
          <section className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#eaf2f8] flex items-center justify-center text-[#005b96]">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#011f4b]">6. First-Day Preparation & Orientation</h2>
                <p className="text-xs text-[#6497b1]">
                  Location details, dress code expectations, reporting time, and introductory overview.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Guidelines */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                    <span className="text-[11px] text-[#6497b1] font-medium block">Arrival Schedule</span>
                    <span className="text-sm font-bold text-[#011f4b]">{INITIAL_FIRST_DAY.arrival_time}</span>
                  </div>
                  <div className="p-3.5 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                    <span className="text-[11px] text-[#6497b1] font-medium block">Dress Code</span>
                    <span className="text-sm font-bold text-[#011f4b]">Smart-Casual</span>
                  </div>
                </div>

                <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] space-y-1.5">
                  <div className="text-xs font-bold text-[#011f4b]">Office Address & Reporting Desk:</div>
                  <div className="text-xs text-[#03396c]">{INITIAL_FIRST_DAY.office_address}</div>
                  <div className="text-xs text-[#6497b1]">{INITIAL_FIRST_DAY.map_instructions}</div>
                </div>

                <div className="p-4 bg-[#eaf2f8]/40 rounded-xl border border-[#b3cde0] space-y-2">
                  <div className="text-xs font-bold text-[#011f4b]">Required Physical Items to Bring:</div>
                  <ul className="text-xs text-[#03396c] space-y-1">
                    {INITIAL_FIRST_DAY.items_to_bring.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Corporate Intro Media Box */}
              <div className="p-4 bg-[#011f4b] rounded-2xl text-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-[#b3cde0] mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#b3cde0]" />
                      Company Introduction Video
                    </div>
                    {orientationWatched && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed &amp; Verified
                      </span>
                    )}
                  </div>
                  <div className="aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center text-center p-4">
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto text-white">
                        <Eye className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-[#b3cde0] max-w-xs">
                        Welcome to Philkoei: Overview of Engineering Projects & Workplace Culture
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-[#6497b1] mt-3">
                  Duration: 3 mins • Mandatory for all incoming personnel
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 7. Data Privacy Section */}
        {(activeSection === 'all' || activeSection === 'privacy') && (
          <section className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#eaf2f8] flex items-center justify-center text-[#005b96]">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#011f4b]">7. Data Privacy Act & Consent</h2>
                  <p className="text-xs text-[#6497b1]">
                    Statutory compliance with Republic Act No. 10173 (Data Privacy Act of 2012).
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Consent Signed
              </span>
            </div>

            <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] text-xs text-[#03396c] leading-relaxed space-y-2">
              <p>
                Philkoei International, Inc. adheres to strict information security standards. Your personal and sensitive data are processed solely for lawful HR administration and held with RLS database isolation.
              </p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[#6497b1] text-[11px]">
                  Acknowledged by Maria Santos on 2026-09-12 09:00 AM (Ref: PKI-DP-2026-V3)
                </span>
                <button
                  onClick={() => setIsPrivacyModalOpen(true)}
                  className="text-xs font-bold text-[#005b96] hover:underline"
                >
                  View Full Policy
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 8. Need Help? / HR Support Section */}
        {(activeSection === 'all' || activeSection === 'help') && (
          <section className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#eaf2f8] flex items-center justify-center text-[#005b96]">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#011f4b]">8. Need Help? Contact HR Support</h2>
                <p className="text-xs text-[#6497b1]">
                  Have questions regarding clinic vouchers, documents, or first day instructions? Reach out directly.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Question Submit Form */}
              <form onSubmit={handleSendHelp} className="space-y-3">
                {helpSubmitted && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Your question has been sent to the HR team. Expect a reply within 24 hours.</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-[#03396c] mb-1">Inquiry Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SSS Member Data Record verification query"
                    value={helpSubject}
                    onChange={(e) => setHelpSubject(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-[#b3cde0] rounded-xl focus:border-[#005b96] text-[#011f4b]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#03396c] mb-1">Your Message / Clarification</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide details so HR can assist you promptly..."
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

              {/* Inquiry History */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#011f4b]">Recent Support Inquiries</div>
                {helpInquiries.map((inq) => (
                  <div key={inq.id} className="p-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#011f4b]">{inq.subject}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {inq.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#6497b1]">{inq.message}</p>
                    {inq.hr_response && (
                      <div className="p-2.5 bg-[#eaf2f8] rounded-lg border border-[#b3cde0]/60 text-xs text-[#03396c] space-y-1">
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
          </section>
        )}
      </main>

      {/* Upload File Modal */}
      {isUploadModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e2e8f0]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#011f4b]">
                Upload Requirement: {selectedTask.title}
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-[#6497b1] hover:text-[#011f4b]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#6497b1] mb-4">
              Please select a clear PDF, PNG, or JPG file (Max 10MB). Uploaded documents are encrypted and accessible only by HR officers.
            </p>

            {uploadSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <div className="text-sm font-bold text-emerald-800">Document Uploaded Successfully!</div>
                <div className="text-xs text-emerald-600">HR has been notified and will review your submission shortly.</div>
              </div>
            ) : (
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="border-2 border-dashed border-[#b3cde0] hover:border-[#005b96] rounded-xl p-6 text-center bg-[#f8fafc] cursor-pointer">
                  <input
                    type="file"
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                      }
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
                    onClick={() => setIsUploadModalOpen(false)}
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

      {/* Online Form Completion Modal */}
      {isFormModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#e2e8f0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#e2e8f0]">
              <div>
                <h3 className="text-base font-bold text-[#011f4b]">
                  {selectedTask.title}
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
                setTasks((prev) =>
                  prev.map((t) =>
                    t.id === selectedTask.id ? { ...t, status: 'approved' } : t
                  )
                );
                setIsFormModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#03396c] mb-1">Tax Identification Number (TIN)</label>
                  <input
                    type="text"
                    value={pdsData.tin}
                    onChange={(e) => setPdsData({ ...pdsData, tin: e.target.value })}
                    className="w-full p-2.5 bg-[#f8fafc] border border-[#b3cde0] rounded-xl text-[#011f4b]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#03396c] mb-1">Social Security System (SSS) #</label>
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
                  <label className="block font-bold text-[#03396c] mb-1">Pag-IBIG / HDMF #</label>
                  <input
                    type="text"
                    value={pdsData.pagibig}
                    onChange={(e) => setPdsData({ ...pdsData, pagibig: e.target.value })}
                    className="w-full p-2.5 bg-[#f8fafc] border border-[#b3cde0] rounded-xl text-[#011f4b]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#03396c] mb-1">Payroll Bank Account Details</label>
                <input
                  type="text"
                  value={pdsData.bankAccount}
                  onChange={(e) => setPdsData({ ...pdsData, bankAccount: e.target.value })}
                  className="w-full p-2.5 bg-[#f8fafc] border border-[#b3cde0] rounded-xl text-[#011f4b]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#03396c] mb-1">Emergency Contact & Contact Number</label>
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
                  Save & Submit Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Privacy Policy Viewer Modal */}
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
