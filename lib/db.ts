import {
  ALL_EMPLOYEES_LIST,
  INITIAL_AUDIT_LOGS,
  INITIAL_HELP_INQUIRIES,
  INITIAL_TASKS,
  MockAuditEvent,
  MockEmployeeProfile,
  MockTask,
} from '@/lib/mock-data';

// Shared employee <-> HR datastore (mock stage, localStorage-backed).
// Mirrors db/parts/*.sql tables: onboarding_tasks, employees,
// message_threads, messages, notifications, audit_events.
// Swap loadDB/saveDB internals for MySQL queries at integration time;
// page code keeps calling these helpers.

export const CURRENT_EMPLOYEE_ID = 'emp-001';
export const CURRENT_HR_ID = 'hr-001';
export const CURRENT_HR_NAME = 'Elena Gomez';

// Display names for HR accounts (mirrors users.full_name in db/parts/01).
export const HR_NAMES: Record<string, string> = {
  [CURRENT_HR_ID]: CURRENT_HR_NAME,
};

export function hrName(hr_id: string | null): string {
  if (hr_id && HR_NAMES[hr_id]) return HR_NAMES[hr_id];
  return 'HR Support';
}

export interface DbThread {
  id: string;
  employee_id: string;
  hr_id: string | null;
  subject_type: 'help' | 'file';
  subject_title: string;
  task_id: string | null;
  file_name: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  updated_at: string;
}

export interface DbMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_role: 'employee' | 'hr';
  body: string;
  created_at: string;
}

export interface DbNotification {
  id: string;
  user_id: string;
  type: 'rejection' | 'approval' | 'reminder' | 'chat' | 'general';
  title: string;
  body: string | null;
  link_section: string | null;
  task_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface DB {
  tasks: MockTask[];
  employees: MockEmployeeProfile[];
  threads: DbThread[];
  messages: DbMessage[];
  notifications: DbNotification[];
  audit: MockAuditEvent[];
}

const STORAGE_KEY = 'pki_db_v1';
const LEGACY_TASKS_KEY = 'pki_tasks_v1';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function nowStamp(): string {
  return 'Just now';
}

function seed(): DB {
  const threads: DbThread[] = INITIAL_HELP_INQUIRIES.map((inq) => ({
    id: `thr-${inq.id}`,
    employee_id: CURRENT_EMPLOYEE_ID,
    hr_id: inq.hr_response ? CURRENT_HR_ID : null,
    subject_type: 'help',
    subject_title: inq.subject,
    task_id: null,
    file_name: null,
    status: inq.hr_response ? 'resolved' : 'open',
    updated_at: inq.responded_at ?? inq.created_at,
  }));
  const messages: DbMessage[] = INITIAL_HELP_INQUIRIES.flatMap((inq) => {
    const out: DbMessage[] = [
      { id: `msg-${inq.id}-me`, thread_id: `thr-${inq.id}`, sender_id: CURRENT_EMPLOYEE_ID, sender_role: 'employee', body: `${inq.subject}: ${inq.message}`, created_at: inq.created_at },
    ];
    if (inq.hr_response) {
      out.push({ id: `msg-${inq.id}-hr`, thread_id: `thr-${inq.id}`, sender_id: CURRENT_HR_ID, sender_role: 'hr', body: inq.hr_response, created_at: inq.responded_at ?? 'Just now' });
    }
    return out;
  });
  return {
    tasks: INITIAL_TASKS.map((t) => ({ ...t })),
    employees: ALL_EMPLOYEES_LIST.map((e) => ({ ...e })),
    threads,
    messages,
    notifications: [
      {
        id: 'notif-psa-001',
        user_id: CURRENT_EMPLOYEE_ID,
        type: 'rejection',
        title: 'PSA Birth Certificate needs changes.',
        body: 'The uploaded scan is blurred and the lower portion is cut off. Please re-upload a clear, complete copy.',
        link_section: 'pre_employment',
        task_id: 'req-psa-birth',
        is_read: false,
        created_at: 'Yesterday',
      },
    ],
    audit: INITIAL_AUDIT_LOGS.map((a) => ({ ...a })),
  };
}

export function seedDB(): DB {
  return seed();
}

export function loadDB(): DB {
  if (!isBrowser()) return seed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed && Array.isArray(parsed.tasks) && parsed.tasks.length > 0) return parsed;
    }
    // Adopt previous single-table store so earlier sessions carry over.
    const legacy = window.localStorage.getItem(LEGACY_TASKS_KEY);
    const base = seed();
    if (legacy) {
      try {
        const lt = JSON.parse(legacy) as MockTask[];
        if (Array.isArray(lt) && lt.length > 0) base.tasks = lt;
      } catch {
        // keep seed
      }
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
    return base;
  } catch {
    return seed();
  }
}

export function saveDB(db: DB): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // storage blocked; session memory still works
  }
}

// Append-only audit write (matches /hr/audit-log contract).
export function logAudit(
  db: DB,
  actor_name: string,
  actor_role: MockAuditEvent['actor_role'],
  action: string,
  target: string,
  details: string
): DB {
  return {
    ...db,
    audit: [
      {
        id: uid('aud'),
        actor_name,
        actor_role,
        action,
        target,
        timestamp: nowStamp(),
        details,
      },
      ...db.audit,
    ],
  };
}

// Bell notification write for one user.
export function pushNotification(
  db: DB,
  n: Omit<DbNotification, 'id' | 'created_at' | 'is_read'>
): DB {
  return {
    ...db,
    notifications: [
      { ...n, id: uid('notif'), created_at: nowStamp(), is_read: false },
      ...db.notifications,
    ],
  };
}

// Get-or-create per-file thread (HR comments on the exact uploaded file).
export function fileThread(
  db: DB,
  employee_id: string,
  task_id: string,
  subject_title: string,
  file_name: string | null
): { db: DB; thread: DbThread } {
  const existing = db.threads.find(
    (t) => t.subject_type === 'file' && t.task_id === task_id && (file_name === null || t.file_name === file_name)
  );
  if (existing) return { db, thread: existing };
  const thread: DbThread = {
    id: uid('thr'),
    employee_id,
    hr_id: null,
    subject_type: 'file',
    subject_title,
    task_id,
    file_name,
    status: 'open',
    updated_at: nowStamp(),
  };
  return { db: { ...db, threads: [thread, ...db.threads] }, thread };
}

export function sendMessage(
  db: DB,
  thread_id: string,
  sender_id: string,
  sender_role: 'employee' | 'hr',
  body: string
): DB {
  const message: DbMessage = {
    id: uid('msg'),
    thread_id,
    sender_id,
    sender_role,
    body,
    created_at: nowStamp(),
  };
  return {
    ...db,
    messages: [...db.messages, message],
    threads: db.threads.map((t) =>
      t.id === thread_id ? { ...t, updated_at: nowStamp(), status: t.status === 'resolved' ? 'in_progress' : t.status } : t
    ),
  };
}

export type { MockAuditEvent };
