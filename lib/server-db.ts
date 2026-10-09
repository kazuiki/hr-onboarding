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

/** Persist an uploaded web File under public/uploads/<employeeId>/. */
export async function saveUpload(file: File, employeeId: string): Promise<SavedUpload> {
  const safeEmployee = employeeId.replace(/[^a-zA-Z0-9-]/g, '_');
  const dir = path.join(process.cwd(), 'public', 'uploads', safeEmployee);
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
