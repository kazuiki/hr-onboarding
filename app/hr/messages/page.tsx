"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Send } from 'lucide-react';
import {
  CURRENT_HR_ID,
  CURRENT_HR_NAME,
  logAudit,
  pushNotification,
  sendMessage,
} from '@/lib/db';
import { useDB } from '@/lib/use-db';

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');
}

function Avatar({ name, url }: { name: string; url?: string | null }) {
  if (url) {
    return (
      <span className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-[#eaf2f8]">
        <Image src={url} alt={name} width={28} height={28} className="w-full h-full object-cover" />
      </span>
    );
  }
  return (
    <span className="w-7 h-7 rounded-full bg-[#011f4b] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
      {initials(name)}
    </span>
  );
}

export default function HRMessagesPage() {
  const [db, updateDB] = useDB();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  const threads = useMemo(
    () => [...db.threads].sort((a, b) => (a.updated_at > b.updated_at ? -1 : 1)),
    [db.threads]
  );
  const active = threads.find((t) => t.id === activeId) ?? threads[0] ?? null;
  const messages = useMemo(
    () => db.messages.filter((m) => active && m.thread_id === active.id),
    [db.messages, active]
  );
  const employeeName = useMemo(() => {
    if (!active) return '';
    const emp = db.employees.find((e) => e.id === active.employee_id);
    return emp ? emp.full_name : active.employee_id;
  }, [db.employees, active]);
  const employeePosition = useMemo(() => {
    if (!active) return '';
    const emp = db.employees.find((e) => e.id === active.employee_id);
    return emp ? emp.position : '';
  }, [db.employees, active]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, activeId]);

  const handleReply = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !active) return;
    updateDB((prev) => {
      let next = sendMessage(prev, active.id, CURRENT_HR_ID, 'hr', text);
      next = pushNotification(next, {
        user_id: active.employee_id,
        type: 'chat',
        title: `HR replied: ${active.subject_title}.`,
        body: text.length > 200 ? `${text.slice(0, 200)}...` : text,
        link_section: 'help',
        task_id: active.task_id,
      });
      next = logAudit(next, CURRENT_HR_NAME, 'hr_manager', 'CHAT_REPLY', active.subject_title, text.slice(0, 120));
      return next;
    });
    setDraft('');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* Thread list */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#f1f5f9] text-xs font-bold text-[#011f4b]">
            Conversations ({threads.length})
          </div>
          <div className="divide-y divide-[#f1f5f9] max-h-[48rem] overflow-y-auto">
            {threads.length === 0 && (
              <p className="px-4 py-6 text-xs text-[#6497b1] text-center">No conversations yet.</p>
            )}
            {threads.map((t) => {
              const sender = db.employees.find((e) => e.id === t.employee_id);
              return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveId(t.id)}
                className={`w-full flex items-start gap-2.5 px-4 py-3 text-left transition-colors ${
                  active?.id === t.id ? 'bg-[#eaf2f8]/70' : 'hover:bg-[#f8fafc]'
                }`}
              >
                {sender?.avatar_url ? (
                  <span className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-[#eaf2f8]">
                    <Image
                      src={sender.avatar_url}
                      alt={sender.full_name}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  </span>
                ) : (
                  <span className="w-9 h-9 rounded-full bg-[#011f4b] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {(sender ? sender.full_name : t.employee_id)
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="text-xs font-bold text-[#011f4b] block truncate">
                    {sender ? sender.full_name : t.employee_id}
                  </span>
                  <span className="text-[11px] text-[#6497b1] block truncate">
                    {sender ? sender.position : t.subject_title}
                  </span>
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
                {(() => {
                  const person = db.employees.find((e) => active && e.id === active.employee_id);
                  return person?.avatar_url ? (
                    <span className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-[#eaf2f8]">
                      <Image
                        src={person.avatar_url}
                        alt={person.full_name}
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                      />
                    </span>
                  ) : (
                    <span className="w-9 h-9 rounded-full bg-[#011f4b] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {(person ? person.full_name : '')
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </span>
                  );
                })()}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#011f4b] truncate">{employeeName}</div>
                  <div className="text-[11px] text-[#6497b1] truncate">
                    {employeePosition ? `${employeePosition} · ` : ''}{active.status}
                    {active.file_name ? ` · ${active.file_name}` : ''}
                  </div>
                </div>
              </div>
              <div className="px-4 py-4 space-y-3 max-h-[48rem] min-h-[28rem] overflow-y-auto">
                {messages.map((m) =>
                  m.sender_role === 'hr' ? (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-[80%] bg-[#005b96] text-white text-xs leading-relaxed rounded-2xl rounded-br-md px-3.5 py-2.5 break-words">
                        {m.body}
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="flex justify-start items-end gap-1.5">
                      <Avatar
                        name={employeeName || 'Employee'}
                        url={db.employees.find((e) => active && e.id === active.employee_id)?.avatar_url}
                      />
                      <div className="max-w-[80%] bg-[#f1f5f9] text-[#03396c] text-xs leading-relaxed rounded-2xl rounded-bl-md px-3.5 py-2.5 border border-[#e2e8f0] break-words">
                        {m.body}
                      </div>
                    </div>
                  )
                )}
                <div ref={endRef} />
              </div>
              <form onSubmit={handleReply} className="flex items-center gap-2 px-3 py-3 border-t border-[#e2e8f0] bg-[#f8fafc]">
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
                  disabled={!draft.trim()}
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
