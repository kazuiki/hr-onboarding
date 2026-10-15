import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Server-only MySQL pool. Never import this file from client components.
// All connection values come from env. No static defaults or fallbacks.
function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required database env: ${name}`);
  }
  return value;
}

function createPool() {
  const portRaw = process.env.DB_PORT;
  const port = Number(portRaw);
  if (!portRaw || !Number.isInteger(port) || port <= 0) {
    throw new Error('Missing or invalid required database env: DB_PORT');
  }
  return mysql.createPool({
    host: requiredEnv('DB_HOST'),
    port,
    user: requiredEnv('DB_USER'),
    password: requiredEnv('DB_PASSWORD'),
    database: requiredEnv('DB_NAME'),
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4_unicode_ci',
    // Application dates are handled as strings; keep TIMESTAMP reads stable.
    dateStrings: true,
  });
}

type Pool = ReturnType<typeof createPool>;
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) pool = createPool();
  return pool;
}

export type Row = Record<string, unknown>;

export async function query<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await getPool().query(sql, params);
  return rows as T[];
}

export async function queryOne<T = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/** Run statements atomically; rolls back on any failure. */
export async function transaction<T>(
  fn: (q: (sql: string, params?: unknown[]) => Promise<Row[]>) => Promise<T>
): Promise<T> {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const q = async (sql: string, params: unknown[] = []) => {
      const [rows] = await conn.query(sql, params);
      return rows as Row[];
    };
    const out = await fn(q);
    await conn.commit();
    return out;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export function newId(): string {
  return randomUUID();
}

/** Fixed onboarding window per hire in days (overridable per row via access_window_days). */
export const DEFAULT_ACCESS_WINDOW_DAYS = 30;

export interface AccessWindow {
  expired: boolean;
  remainingDays: number;
  windowDays: number;
}

/**
 * 30-day access window counted from account creation. An hire who still has
 * incomplete progress past the window is automatically voided (login
 * disabled + archived). Completed hires are exempt. Safe to call on every
 * request; voiding happens once via the status guard.
 */
export async function checkAndVoidExpiredAccess(employeeId: string): Promise<AccessWindow> {
  const row = await queryOne<
    Row & {
      created_at: string;
      access_window_days: number;
      completion_pct: number;
      status: string;
      full_name: string;
    }
  >(
    `SELECT e.created_at, e.access_window_days, e.completion_pct, e.status, u.full_name
     FROM employees e JOIN users u ON u.id = e.id WHERE e.id = ?`,
    [employeeId]
  );
  if (!row) return { expired: false, remainingDays: DEFAULT_ACCESS_WINDOW_DAYS, windowDays: DEFAULT_ACCESS_WINDOW_DAYS };
  const windowDays = Number(row.access_window_days) || DEFAULT_ACCESS_WINDOW_DAYS;
  const created = new Date(String(row.created_at).replace(' ', 'T')).getTime();
  const elapsedDays = Number.isFinite(created) ? Math.floor((Date.now() - created) / 86400000) : 0;
  const remainingDays = Math.max(0, windowDays - Math.max(0, elapsedDays));
  const done = Number(row.completion_pct) >= 100 || row.status === 'completed';
  if (!done && String(row.status) === 'active' && remainingDays <= 0) {
    await query(`UPDATE users SET is_active = 0 WHERE id = ?`, [employeeId]);
    await query(
      `UPDATE employees SET status = 'archived', archived_at = NOW() WHERE id = ? AND status = 'active'`,
      [employeeId]
    );
    await query(`DELETE FROM sessions WHERE user_id = ?`, [employeeId]);
    await auditEvent({
      actorId: employeeId,
      actorName: String(row.full_name),
      actorRole: 'employee',
      action: 'ACCOUNT_VOID_EXPIRED',
      targetType: 'employee',
      targetId: employeeId,
      details: { window_days: windowDays },
    });
    return { expired: true, remainingDays: 0, windowDays };
  }
  return { expired: false, remainingDays, windowDays };
}

export async function auditEvent(input: {
  actorId: string | null;
  actorName: string;
  actorRole: 'hr_manager' | 'hr_assistant' | 'employee';
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
}): Promise<void> {
  await query(
    `INSERT INTO audit_events (id, actor_id, actor_name, actor_role, action, target_type, target_id, details)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId(),
      input.actorId,
      input.actorName,
      input.actorRole,
      input.action,
      input.targetType,
      input.targetId ?? null,
      input.details ? JSON.stringify(input.details) : null,
    ]
  );
}

/** Recompute completion for one hire from required approved tasks. */
export async function recalcProgress(employeeId: string): Promise<number> {
  const rows = await query<{ total: number; done: number }>(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS done
     FROM onboarding_tasks WHERE employee_id = ? AND required = 1`,
    [employeeId]
  );
  const total = Number(rows[0]?.total ?? 0);
  const done = Number(rows[0]?.done ?? 0);
  const pct = total > 0 ? Math.round((done * 100) / total) : 100;
  await query(`UPDATE employees SET completion_pct = ? WHERE id = ?`, [pct, employeeId]);
  await query(
    `UPDATE onboarding_packets SET completion_pct = ?,
       completed_at = CASE WHEN ? = 100 THEN COALESCE(completed_at, NOW()) ELSE NULL END
     WHERE employee_id = ?`,
    [pct, pct, employeeId]
  );
  return pct;
}

export async function notifyUser(input: {
  userId: string;
  type: 'rejection' | 'approval' | 'reminder' | 'chat' | 'general';
  title: string;
  body?: string | null;
  linkSection?: string | null;
  taskId?: string | null;
}): Promise<void> {
  await query(
    `INSERT INTO notifications (user_id, type, title, body, link_section, task_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.userId, input.type, input.title, input.body ?? null, input.linkSection ?? null, input.taskId ?? null]
  );
}

/**
 * One collapsed "employee submitted" bell item for every active HR user.
 * Newer submissions refresh the single unread row per hire instead of
 * stacking one notif per upload.
 */
export async function notifyHrSubmission(
  employeeId: string,
  employeeName: string,
  documentLabel: string,
  detail: string
): Promise<void> {
  const hrs = await query<Row & { id: string }>(
    `SELECT id FROM users WHERE role IN ('hr_manager', 'hr_assistant') AND is_active = 1`
  );
  for (const hr of hrs) {
    await notifySingle({
      userId: String(hr.id),
      type: 'general',
      title: `New submission from ${employeeName}.`,
      body: `${documentLabel} — ${detail}.`,
      dedupeKey: `submit:${employeeId}`,
    });
  }
}

/**
 * One collapsed "employee removed a file" bell item for every active HR user.
 * Reuses the same `submit:<employeeId>` key as submissions so the HR bell
 * always shows the latest hire activity and viewing the hire clears it.
 */
export async function notifyHrRemoval(
  employeeId: string,
  employeeName: string,
  documentLabel: string,
  detail: string
): Promise<void> {
  const hrs = await query<Row & { id: string }>(
    `SELECT id FROM users WHERE role IN ('hr_manager', 'hr_assistant') AND is_active = 1`
  );
  for (const hr of hrs) {
    await notifySingle({
      userId: String(hr.id),
      type: 'general',
      title: `${employeeName} removed a file.`,
      body: `${documentLabel} — ${detail}.`,
      dedupeKey: `submit:${employeeId}`,
    });
  }
}
 /**
  * Collapse repeated pings into one unread bell item: older unread rows with
  * the same (recipient, key) are marked read first, so chat threads,
  * resubmits, and repeated decisions never flood the bell. History stays in
  * read rows. The key rides in task_id (VARCHAR, no FK) — e.g. `thread:<id>`.
  */
export async function notifySingle(input: {
  userId: string;
  type: 'rejection' | 'approval' | 'reminder' | 'chat' | 'general';
  title: string;
  body?: string | null;
  linkSection?: string | null;
  dedupeKey: string;
}): Promise<void> {
  await query(`UPDATE notifications SET is_read = 1 WHERE user_id = ? AND task_id = ? AND is_read = 0`, [
    input.userId,
    input.dedupeKey,
  ]);
  await notifyUser({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    linkSection: input.linkSection,
    taskId: input.dedupeKey,
  });
}

export interface SavedUpload {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}

function cleanFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() || 'file';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180) || 'file';
}

// Magic-byte prefixes per accepted extension. Extension checks alone accept
// renamed binaries; this verifies content matches the claimed type.
const FILE_SIGNATURES: { ext: string; magic: number[][] }[] = [
  { ext: 'jpg', magic: [[0xff, 0xd8, 0xff]] },
  { ext: 'jpeg', magic: [[0xff, 0xd8, 0xff]] },
  { ext: 'png', magic: [[0x89, 0x50, 0x4e, 0x47]] },
  { ext: 'pdf', magic: [[0x25, 0x50, 0x44, 0x46]] },
  { ext: 'doc', magic: [[0xd0, 0xcf, 0x11, 0xe0]] },
  { ext: 'docx', magic: [[0x50, 0x4b, 0x03, 0x04]] },
  { ext: 'ppt', magic: [[0xd0, 0xcf, 0x11, 0xe0]] },
  { ext: 'pptx', magic: [[0x50, 0x4b, 0x03, 0x04]] },
];

/** True when the leading bytes match the claimed filename extension. */
export function fileSignatureOk(fileName: string, bytes: Uint8Array | Buffer): boolean {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const known = FILE_SIGNATURES.find((s) => s.ext === ext);
  if (!known || bytes.length < 4) return false;
  return known.magic.some((prefix) => prefix.every((b, i) => bytes[i] === b));
}

/**
 * Disk root for uploads. Lives outside public/ (override with UPLOAD_DIR) so
 * stored files never serve without a login; every read goes through the
 * authenticated /api/files route. Database values keep the logical
 * `/uploads/<employeeId>/<file>` shape so existing rows stay valid.
 */
export function uploadRoot(): string {
  const override = process.env.UPLOAD_DIR;
  return override ? path.resolve(override) : path.join(process.cwd(), 'storage', 'uploads');
}

/**
 * Absolute disk path for a stored `/uploads/<employeeId>/<file>` value.
 * Returns null for anything outside the uploads root.
 */
export function diskPathForUpload(filePath: string): string | null {
  if (!filePath.startsWith('/uploads/')) return null;
  const rel = filePath.replace(/^\/+/, '').replace(/^uploads[\/\\]/, '');
  if (!rel || rel.includes('..')) return null;
  const abs = path.join(uploadRoot(), rel);
  if (!abs.startsWith(uploadRoot() + path.sep)) return null;
  return abs;
}

/** Persist an uploaded web File under storage/uploads/<employeeId>/. */
export async function saveUpload(file: File, employeeId: string): Promise<SavedUpload> {
  const safeEmployee = employeeId.replace(/[^a-zA-Z0-9-]/g, '_');
  const dir = path.join(uploadRoot(), safeEmployee);
  await mkdir(dir, { recursive: true });
  const stored = `${Date.now()}_${cleanFileName(file.name)}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, stored), bytes);
  return {
    fileName: file.name,
    filePath: `/uploads/${safeEmployee}/${stored}`,
    fileSize: bytes.length,
    mimeType: file.type || 'application/octet-stream',
  };
}
