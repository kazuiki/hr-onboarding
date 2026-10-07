"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Network,
  UserCog,
  Eye,
  Check,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  CloudUpload,
  Upload,
  ChevronDown,
} from 'lucide-react';
import { useMe } from '@/lib/use-me';
import { UPLOAD_DOC_TYPES, type TaskCategory } from '@/lib/onboarding';

interface DocRow {
  id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  status: 'not_started' | 'in_progress' | 'submitted' | 'needs_changes' | 'approved';
  required: number;
  display_order: number;
  has_download: number;
  template_file_name: string | null;
  template_file_path: string | null;
  file_name: string | null;
  feedback: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  latest_file: string | null;
}

interface SharedRow {
  slot: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  notes: string | null;
  updated_at: string;
}

interface EmployeeDetail {
  id: string;
  employee_number: string;
  position: string;
  department: string;
  manager_name: string;
  start_date: string;
  status: string;
  completion_pct: number;
  full_name: string;
  email: string;
}

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'ppt', 'pptx'];

function typeLabel(category: TaskCategory): string {
  return category === 'photo' ? 'id-photo' : 'pre-employment requirements';
}

function DocBadge({ status }: { status: DocRow['status'] }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white">
        Approved
      </span>
    );
  }
  if (status === 'needs_changes') {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-500 text-white">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-700 border border-sky-200">
      Submitted
    </span>
  );
}

export default function HREmployeeDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const { me, loading: meLoading } = useMe({ allow: ['hr_manager', 'hr_assistant'] });

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [shared, setShared] = useState<SharedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  const [selected, setSelected] = useState<DocRow | null>(null);
  const [mode, setMode] = useState<'approve' | 'reject' | 'view'>('view');
  const [feedback, setFeedback] = useState('');
  const [working, setWorking] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<string>('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/employees/${id}`, { cache: 'no-store' });
      if (res.status === 404) {
        setEmployee(null);
        setLoadError('');
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmployee(data.employee);
      setDocs(
        (data.tasks as DocRow[])
          .filter((t) => t.status === 'submitted' || t.status === 'approved' || t.status === 'needs_changes')
          .sort((a, b) => a.display_order - b.display_order)
      );
      setShared(data.sharedFiles ?? []);
      setLoadError('');
    } catch {
      setLoadError('Could not load this record. Check the database connection and refresh.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (me) void loadDetail();
  }, [me, loadDetail]);

  const sharedBySlot = useMemo(() => {
    const map: Record<string, SharedRow> = {};
    for (const row of shared) map[row.slot] = row;
    return map;
  }, [shared]);

  const handleDecision = async (decision: 'approved' | 'needs_changes') => {
    if (!selected) return;
    setWorking(true);
    setActionError('');
    try {
      const res = await fetch(`/api/employees/${id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: selected.id, decision, feedback }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Could not save the decision.');
        return;
      }
      setSelected(null);
      setFeedback('');
      await loadDetail();
    } catch {
      setActionError('Could not reach the server. Try again.');
    } finally {
      setWorking(false);
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadDocType('');
    setUploadNotes('');
    setUploadFile(null);
    setUploadError(null);
    setDragOver(false);
  };

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      setUploadError(`"${file.name}" is not supported. Allowed: PDF, DOC, DOCX, JPG, PNG, PPT.`);
      setUploadFile(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError(`"${file.name}" exceeds 10MB. Please choose a smaller file.`);
      setUploadFile(null);
      return;
    }
    setUploadError(null);
    setUploadFile(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDocType || !uploadFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const payload = new FormData();
      payload.append('docType', uploadDocType);
      payload.append('notes', uploadNotes.trim());
      payload.append('file', uploadFile);
      const res = await fetch(`/api/employees/${id}/share`, { method: 'POST', body: payload });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'Upload failed.');
        return;
      }
      closeUploadModal();
      await loadDetail();
    } catch {
      setUploadError('Could not reach the server. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveShared = async (slot: string) => {
    setActionError('');
    try {
      const res = await fetch(`/api/employees/${id}/share?slot=${encodeURIComponent(slot)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Could not remove the file.');
        return;
      }
      await loadDetail();
    } catch {
      setActionError('Could not reach the server. Try again.');
    }
  };

  if (meLoading || !me) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#b3cde0] border-t-[#005b96] rounded-full animate-spin" />
      </div>
    );
  }

  if (!loading && !employee && !loadError) {
    return (
      <div className="space-y-6">
        <Link
          href="/hr"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-white border border-[#e2e8f0] text-[#011f4b] rounded-full hover:border-[#b3cde0] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 text-center shadow-sm">
          <AlertCircle className="w-10 h-10 text-[#b3cde0] mx-auto mb-3" />
          <div className="text-sm font-bold text-[#011f4b]">Employee not found</div>
          <p className="text-xs text-[#6497b1] mt-1">
            This account may have been removed. Return to the dashboard to pick another employee.
          </p>
        </div>
      </div>
    );
  }

  const infoRows = employee
    ? [
        { icon: BadgeCheck, label: 'Name', value: employee.full_name },
        { icon: Building2, label: 'Department', value: employee.department },
        { icon: Network, label: 'Position', value: employee.position },
        { icon: UserCog, label: 'Manager / Supervisor', value: employee.manager_name },
      ]
    : [];

  return (
    <div className="space-y-6">
      <Link
        href="/hr"
        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-white border border-[#e2e8f0] text-[#011f4b] rounded-full hover:border-[#b3cde0] transition-colors shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {loadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">{loadError}</div>
      )}
      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">{actionError}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#b3cde0] border-t-[#005b96] rounded-full animate-spin" />
        </div>
      ) : (
        employee && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Employee Information Panel */}
            <aside className="lg:col-span-4 bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#011f4b] mb-5">Employee Information</h2>
              <div className="space-y-4">
                {infoRows.map((row) => (
                  <div key={row.label} className="flex items-start gap-3">
                    <row.icon className="w-5 h-5 text-[#005b96] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6497b1]">
                        {row.label}
                      </div>
                      <div className="text-sm font-semibold text-[#011f4b] break-words">{row.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-[#e2e8f0]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#011f4b]">Progress</span>
                  <span className="text-xs font-extrabold text-[#005b96] tabular-nums">
                    {employee.completion_pct}%
                  </span>
                </div>
                <div className="w-full bg-[#e2e8f0] rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#005b96] h-full rounded-full transition-all"
                    style={{ width: `${employee.completion_pct}%` }}
                  />
                </div>
              </div>
            </aside>

            {/* Submitted Documents Panel */}
            <section className="lg:col-span-8 bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h2 className="text-base font-bold text-[#011f4b]">Submitted Documents</h2>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-[#011f4b] hover:bg-[#03396c] text-white rounded-xl transition-colors shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  Upload Files
                </button>
              </div>

              {/* Company files HR shared with this employee */}
              <div className="mb-5 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <div className="text-xs font-bold text-[#011f4b] mb-3">Company Files Shared</div>
                <div className="space-y-2">
                  {UPLOAD_DOC_TYPES.filter((t) => t.target.kind === 'slot').map((t) => {
                    const slot = t.target.kind === 'slot' ? t.target.slot : '';
                    const file = sharedBySlot[slot];
                    return (
                      <div key={t.value} className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-[#03396c] truncate">{t.label}</span>
                        {file ? (
                          <span className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={file.file_path}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[#005b96] font-semibold bg-[#eaf2f8] px-2 py-1 rounded-lg max-w-[180px] hover:underline"
                            >
                              <FileText className="w-3 h-3 shrink-0" />
                              <span className="truncate">{file.file_name}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => void handleRemoveShared(slot)}
                              aria-label={`Remove ${t.label}`}
                              title={`Remove ${t.label}`}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#94a3b8] italic shrink-0">Not uploaded yet</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {docs.length === 0 ? (
                <div className="p-10 text-center">
                  <FileText className="w-10 h-10 text-[#b3cde0] mx-auto mb-3" />
                  <div className="text-sm font-bold text-[#011f4b]">No submissions yet</div>
                  <p className="text-xs text-[#6497b1] mt-1">
                    Documents uploaded by {employee.full_name} will appear here for review.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {docs.map((doc) => (
                    <article
                      key={doc.id}
                      className="rounded-2xl border border-[#e2e8f0] p-5 hover:border-[#b3cde0] transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <h3 className="text-sm font-bold text-[#011f4b]">{doc.title}</h3>
                        <DocBadge status={doc.status} />
                      </div>
                      <p className="text-xs text-[#6497b1]">Type: {typeLabel(doc.category)}</p>
                      <p className="text-xs text-[#6497b1] mt-0.5 tabular-nums">
                        Submitted: {doc.submitted_at || 'recently'}
                      </p>
                      {(doc.latest_file || doc.file_name) && (
                        <div className="inline-flex items-center gap-1.5 mt-2 text-xs text-[#005b96] font-medium">
                          <FileText className="w-3.5 h-3.5" />
                          {doc.latest_file || doc.file_name}
                        </div>
                      )}
                      {doc.template_file_name && (
                        <div className="mt-1.5 text-[11px] text-emerald-700 font-semibold">
                          Downloadable HR file: {doc.template_file_name}
                        </div>
                      )}
                      {doc.status === 'needs_changes' && doc.feedback && (
                        <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                          <div className="text-xs font-bold text-rose-800">Rejection Reason:</div>
                          <div className="text-xs text-rose-700 mt-0.5">{doc.feedback}</div>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(doc);
                            setMode('view');
                          }}
                          aria-label={`View ${doc.title}`}
                          title={`View ${doc.title}`}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {doc.status === 'submitted' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelected(doc);
                                setMode('approve');
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                            >
                              <Check className="w-4 h-4" strokeWidth={3} />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelected(doc);
                                setMode('reject');
                                setFeedback(doc.feedback || '');
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" strokeWidth={3} />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )
      )}

      {/* Upload Company Files Modal */}
      {showUploadModal && employee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#e2e8f0] max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              aria-label="Close upload files"
              className="absolute top-4 right-4 p-2 rounded-xl text-[#011f4b] hover:bg-[#f1f5f9] transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={2.5} />
            </button>

            <h3 className="text-lg font-bold text-[#011f4b] text-center mb-6">Upload Company Files</h3>

            <form
              onSubmit={(e) => {
                void handleUploadSubmit(e);
              }}
              className="space-y-4 text-sm"
            >
              <div>
                <label htmlFor="upload-doc-type" className="block text-xs font-bold text-[#011f4b] mb-1.5">
                  Document Type
                </label>
                <div className="relative">
                  <select
                    id="upload-doc-type"
                    required
                    value={uploadDocType}
                    onChange={(e) => setUploadDocType(e.target.value)}
                    className="w-full appearance-none px-4 py-3 pr-10 border border-[#e2e8f0] rounded-xl text-[#011f4b] bg-white focus:border-[#005b96] focus:outline-none invalid:text-[#94a3b8]"
                  >
                    <option value="" disabled>
                      -- Select Document Type --
                    </option>
                    {UPLOAD_DOC_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b] pointer-events-none" />
                </div>
              </div>

              <div>
                <label htmlFor="upload-notes" className="block text-xs font-bold text-[#011f4b] mb-1.5">
                  Notes (Optional)
                </label>
                <input
                  id="upload-notes"
                  type="text"
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Add any notes for the employee"
                  className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-[#011f4b] placeholder:text-[#94a3b8] focus:border-[#005b96] focus:outline-none"
                />
              </div>

              <div>
                <span className="block text-xs font-bold text-[#011f4b] mb-1.5">Upload File</span>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Upload file drop zone"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    pickFile(e.dataTransfer.files?.[0]);
                  }}
                  className={`border-2 border-dashed rounded-2xl px-6 py-8 text-center cursor-pointer transition-colors ${
                    dragOver ? 'border-[#005b96] bg-[#eaf2f8]' : 'border-[#b3cde0] bg-[#f8fafc] hover:border-[#005b96]'
                  }`}
                >
                  <CloudUpload className="w-10 h-10 text-[#6497b1] mx-auto mb-3" />
                  <p className="text-sm text-[#03396c]">Drag &amp; drop your files here</p>
                  <p className="text-sm mt-1">
                    <span className="text-[#005b96] font-semibold hover:underline">Browse Files</span>
                  </p>
                  <p className="text-[11px] text-[#6497b1] mt-3">
                    Supported: PDF, DOC, DOCX, JPG, PNG, PPT (Max: 10MB)
                  </p>
                  {uploadFile && (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#005b96] font-semibold bg-[#eaf2f8] px-3 py-1.5 rounded-lg">
                      <FileText className="w-3.5 h-3.5" />
                      {uploadFile.name}
                    </p>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.ppt,.pptx"
                  className="sr-only"
                  aria-label="Choose file to upload"
                  onChange={(e) => {
                    pickFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                {uploadError && <p className="mt-2 text-xs text-rose-600">{uploadError}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-5 py-3 text-sm font-semibold bg-white border border-[#b3cde0] text-[#011f4b] rounded-xl hover:bg-[#f8fafc] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadDocType || !uploadFile || uploading}
                  className="flex-1 px-5 py-3 text-sm font-semibold bg-[#011f4b] hover:bg-[#03396c] text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View / Approve / Reject Modal */}
      {selected && employee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e2e8f0]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-base font-bold text-[#011f4b] truncate">{selected.title}</h3>
                <DocBadge status={selected.status} />
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="text-[#6497b1] hover:text-[#011f4b] shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] mb-4 space-y-1">
              <div className="text-xs text-[#6497b1]">Employee</div>
              <div className="text-sm font-semibold text-[#011f4b]">{employee.full_name}</div>
              <div className="text-xs text-[#03396c]">{selected.description}</div>
              <div className="text-xs text-[#6497b1]">Type: {typeLabel(selected.category)}</div>
              <div className="text-xs text-[#6497b1] tabular-nums">
                Submitted: {selected.submitted_at || 'recently'}
              </div>
              {(selected.latest_file || selected.file_name) && (
                <div className="text-xs text-[#005b96] font-medium pt-1">
                  File: {selected.latest_file || selected.file_name}
                </div>
              )}
            </div>

            {mode === 'reject' && (
              <div className="mb-4">
                <label htmlFor="detail-reject-feedback" className="block text-xs font-bold text-[#03396c] mb-1">
                  Rejection reason for employee
                </label>
                <textarea
                  id="detail-reject-feedback"
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g. blurred — please re-upload a clear, complete copy..."
                  className="w-full text-xs p-2.5 border border-[#b3cde0] rounded-xl text-[#011f4b]"
                />
              </div>
            )}

            {mode === 'approve' && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                Approving this item writes an audit event and notifies {employee.full_name}.
              </div>
            )}

            {mode === 'view' && selected.feedback && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Rejection Reason:</strong> {selected.feedback}
                </span>
              </div>
            )}

            {actionError && <p className="mb-3 text-xs text-rose-600">{actionError}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-4 py-2 text-xs font-semibold text-[#6497b1]"
              >
                Close
              </button>
              {mode === 'approve' && (
                <button
                  type="button"
                  disabled={working}
                  onClick={() => void handleDecision('approved')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-5 py-2 rounded-xl disabled:opacity-50"
                >
                  Confirm Approval
                </button>
              )}
              {mode === 'reject' && (
                <button
                  type="button"
                  disabled={!feedback.trim() || working}
                  onClick={() => void handleDecision('needs_changes')}
                  className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-5 py-2 rounded-xl disabled:opacity-50"
                >
                  Send Feedback
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
