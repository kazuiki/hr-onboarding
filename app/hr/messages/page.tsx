"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { useMe } from '@/lib/use-me';

interface ThreadRow {
  id: string;
  employee_id: string;
  subject_type: string;
  subject_title: string;
  task_id: string | null;
  status: string;
  updated_at: string;
  employee_name?: string;
}

interface MessageRow {
  id: number;
  thread_id: string;
  sender_id: string;
  sender_role: 'employee' | 'hr';
  body: string;
  created_at: string;
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function HRMessagesPage() {
  const { me, loading: meLoading } = useMe({ allow: ['hr_manager', 'hr_assistant'] });
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const loadThreads = async () => {
    try {
      const res = await fetch('/api/threads', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setThreads(data.threads ?? []);
      setMessages(data.messages ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (me) void loadThreads();
  }, [me]);

  const active = threads.find((t) => t.id === activeId) ?? threads[0] ?? null;
  const activeMessages = useMemo(
    () => messages.filter((m) => active && m.thread_id === active.id),
    [messages, active]
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeMessages, activeId]);

  const handleReply = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !active) return;
    setSending(true);
    try {
      const res = await fetch(`/api/threads/${active.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      });
      if (res.ok) {
        setDraft('');
        await loadThreads();
      }
    } finally {
      setSending(false);
    }
  };

  if (meLoading || !me) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#b3cde0] border-t-[#005b96] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* Thread list */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#f1f5f9] text-xs font-bold text-[#011f4b]">
            Conversations ({threads.length})
          </div>
          <div className="divide-y divide-[#f1f5f9] max-h-[48rem] overflow-y-auto">
            {loading && <p className="px-4 py-6 text-xs text-[#6497b1] text-center">Loading...</p>}
            {!loading && threads.length === 0 && (
              <p className="px-4 py-6 text-xs text-[#6497b1] text-center">No conversations yet.</p>
            )}
            {threads.map((t) => {
              const name = t.employee_name || 'Employee';
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveId(t.id)}
                  className={`w-full flex items-start gap-2.5 px-4 py-3 text-left transition-colors ${
                    active?.id === t.id ? 'bg-[#eaf2f8]/70' : 'hover:bg-[#f8fafc]'
                  }`}
                >
                  <span className="w-9 h-9 rounded-full bg-[#011f4b] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {initials(name)}
                  </span>
                  <span className="min-w-0">
                    <span className="text-xs font-bold text-[#011f4b] block truncate">{name}</span>
                    <span className="text-[11px] text-[#6497b1] block truncate">{t.subject_title}</span>
                    <span className="text-[11px] text-[#6497b1] block">
                      {t.subject_type === 'file' ? 'Per-file thread' : 'Help chat'} · {t.status}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active thread */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden flex flex-col">
          {!active ? (
            <p className="px-4 py-10 text-xs text-[#6497b1] text-center">
              Select a conversation to read and reply.
            </p>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-[#f1f5f9] flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-full bg-[#011f4b] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {initials(active.employee_name || 'Employee')}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#011f4b] truncate">
                    {active.employee_name || 'Employee'}
                  </div>
                  <div className="text-[11px] text-[#6497b1] truncate">{active.status}</div>
                </div>
              </div>
              <div className="px-4 py-4 space-y-3 max-h-[48rem] min-h-[28rem] overflow-y-auto">
                {activeMessages.map((m) =>
                  m.sender_role === 'hr' ? (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-[80%] bg-[#005b96] text-white text-xs leading-relaxed rounded-2xl rounded-br-md px-3.5 py-2.5 break-words">
                        {m.body}
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="flex justify-start items-end gap-1.5">
                      <span className="w-7 h-7 rounded-full bg-[#011f4b] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                        {initials(active.employee_name || 'E')}
                      </span>
                      <div className="max-w-[80%] bg-[#f1f5f9] text-[#03396c] text-xs leading-relaxed rounded-2xl rounded-bl-md px-3.5 py-2.5 border border-[#e2e8f0] break-words">
                        {m.body}
                      </div>
                    </div>
                  )
                )}
                <div ref={endRef} />
              </div>
              <form
                onSubmit={(e) => {
                  void handleReply(e);
                }}
                className="flex items-center gap-2 px-3 py-3 border-t border-[#e2e8f0] bg-[#f8fafc]"
              >
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Reply as HR..."
                  aria-label="Reply as HR"
                  className="flex-1 min-w-0 text-xs p-2.5 bg-white border border-[#b3cde0] rounded-xl focus:border-[#005b96] focus:outline-none text-[#011f4b]"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  aria-label="Send reply"
                  className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#005b96] hover:bg-[#03396c] text-white transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
