"use client";

import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  X,
  AlertCircle,
} from 'lucide-react';
import { INITIAL_TASKS, MockTask } from '@/lib/mock-data';

interface ReviewItem extends MockTask {
  employee_name: string;
}

const INITIAL_QUEUE: ReviewItem[] = INITIAL_TASKS.filter(
  (t) => t.status === 'submitted' || t.status === 'needs_changes'
).map((t) => ({
  ...t,
  employee_name: 'Maria Santos',
}));

export default function HRReviewsPage() {
  const [queue, setQueue] = useState<ReviewItem[]>(INITIAL_QUEUE);
  const [selected, setSelected] = useState<ReviewItem | null>(null);
  const [feedback, setFeedback] = useState('');
  const [mode, setMode] = useState<'approve' | 'reject' | 'view'>('view');

  const handleDecision = (status: 'approved' | 'needs_changes') => {
    if (!selected) return;
    setQueue((prev) =>
      prev
        .map((item) =>
          item.id === selected.id
            ? {
                ...item,
                status,
                feedback: status === 'needs_changes' ? feedback : undefined,
                reviewed_at: 'Just now',
              }
            : item
        )
        .filter((item) => item.status === 'submitted' || item.status === 'needs_changes')
    );
    setSelected(null);
    setFeedback('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#011f4b]">Review Queue</h2>
        <p className="text-sm text-[#6497b1] mt-1">
          Inspect uploaded files, approve compliant submissions, or request changes with feedback.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
        {queue.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <div className="text-sm font-bold text-[#011f4b]">All caught up</div>
            <p className="text-xs text-[#6497b1] mt-1">There are no submissions waiting for review.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#e2e8f0]">
            {queue.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-[#011f4b]">{item.title}</h3>
                    {item.status === 'submitted' ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Under Review
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        Needs Changes
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6497b1]">
                    {item.employee_name} · Submitted {item.submitted_at || 'recently'}
                  </p>
                  {item.file_name && (
                    <div className="inline-flex items-center gap-1.5 text-xs text-[#005b96] font-medium">
                      <FileText className="w-3 h-3" />
                      {item.file_name}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelected(item);
                      setMode('view');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-[#b3cde0] text-[#03396c] rounded-lg hover:bg-[#eaf2f8]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect
                  </button>
                  <button
                    onClick={() => {
                      setSelected(item);
                      setMode('approve');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setSelected(item);
                      setMode('reject');
                      setFeedback(item.feedback || '');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Request Changes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e2e8f0]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#011f4b]">{selected.title}</h3>
              <button onClick={() => setSelected(null)} className="text-[#6497b1] hover:text-[#011f4b]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] mb-4 space-y-1">
              <div className="text-xs text-[#6497b1]">Employee</div>
              <div className="text-sm font-semibold text-[#011f4b]">{selected.employee_name}</div>
              <div className="text-xs text-[#03396c]">{selected.description}</div>
              {selected.file_name && (
                <div className="text-xs text-[#005b96] font-medium pt-1">File: {selected.file_name}</div>
              )}
            </div>

            {mode === 'reject' && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-[#03396c] mb-1">
                  Feedback for employee
                </label>
                <textarea
                  required
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Describe what needs to be corrected..."
                  className="w-full text-xs p-2.5 border border-[#b3cde0] rounded-xl text-[#011f4b]"
                />
              </div>
            )}

            {mode === 'approve' && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                Approving this item will update the employee&apos;s onboarding progress and write an audit event.
              </div>
            )}

            {mode === 'view' && selected.feedback && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {selected.feedback}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 text-xs font-semibold text-[#6497b1]"
              >
                Close
              </button>
              {mode === 'approve' && (
                <button
                  onClick={() => handleDecision('approved')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-5 py-2 rounded-xl"
                >
                  Confirm Approval
                </button>
              )}
              {mode === 'reject' && (
                <button
                  disabled={!feedback.trim()}
                  onClick={() => handleDecision('needs_changes')}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-5 py-2 rounded-xl disabled:opacity-50"
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
