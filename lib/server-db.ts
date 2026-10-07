import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Server-only MySQL pool. Never import this file from client components.
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'hr_app',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hr_onboarding',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4_unicode_ci',
  // Application dates are handled as strings; keep TIMESTAMP reads stable.
  dateStrings: true,
});

export type Row = Record<string, unknown>;

export async function query<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
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
  const conn = await pool.getConnection();
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
