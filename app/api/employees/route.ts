import { query, transaction, newId, auditEvent, notifyUser, type Row } from '@/lib/server-db';
import { getSessionUser, isHr, jsonError } from '@/lib/auth';
import { DEFAULT_REQUIREMENTS } from '@/lib/onboarding';

async function setting(key: string): Promise<string | null> {
  const row = await query<Row & { value_text: string | null }>(
    `SELECT value_text FROM company_settings WHERE setting_key = ?`,
    [key]
  );
  return row.length > 0 && row[0].value_text != null ? String(row[0].value_text) : null;
}

/** HR: directory list + headline counts. */
export async function GET() {
  const user = await getSessionUser();
  if (!user || !isHr(user.role)) return jsonError('HR sign-in required.', 403);

  const employees = await query<Row>(
    `SELECT e.id, e.employee_number, e.position, e.department, e.manager_name,
            e.start_date, e.status, e.completion_pct, e.created_at,
            u.email, u.full_name
     FROM employees e JOIN users u ON u.id = e.id
     ORDER BY e.start_date DESC, u.full_name ASC`
  );
  const counts = await query<Row & { k: string; n: number }>(
    `SELECT status AS k, COUNT(*) AS n FROM employees GROUP BY status`
  );
  const pending = await query<Row & { n: number }>(
    `SELECT COUNT(*) AS n FROM onboarding_tasks WHERE status = 'submitted'`
  );
  const byStatus: Record<string, number> = {};
  for (const c of counts) byStatus[String(c.k)] = Number(c.n);

  return Response.json({
    employees,
    stats: {
      total: (byStatus.active ?? 0) + (byStatus.completed ?? 0),
      completed: byStatus.completed ?? 0,
      inProgress: byStatus.active ?? 0,
      pendingReview: Number(pending[0]?.n ?? 0),
    },
  });
}

interface CreateBody {
  full_name?: unknown;
  email?: unknown;
  temp_password?: unknown;
  id_number?: unknown;
  position?: unknown;
  department?: unknown;
  manager_name?: unknown;
  start_date?: unknown;
}

/** HR: invite a hire — creates login, profile, packet and all tasks. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || !isHr(user.role)) return jsonError('HR sign-in required.', 403);

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return jsonError('Invalid request body.');
  }
  const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const tempPassword = typeof body.temp_password === 'string' ? body.temp_password : '';
  const position = typeof body.position === 'string' ? body.position.trim() : '';
  const department = typeof body.department === 'string' ? body.department.trim() : '';
  const managerName = typeof body.manager_name === 'string' ? body.manager_name.trim() : '';
  const startDate = typeof body.start_date === 'string' ? body.start_date.trim() : '';
  let idNumber = typeof body.id_number === 'string' ? body.id_number.trim() : '';

  if (!fullName || !email || !position || !department || !managerName || !startDate) {
    return jsonError('Name, email, position, department, manager and start date are required.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError('Email address is invalid.');
  if (tempPassword.length < 8) return jsonError('Temporary password must be at least 8 characters.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return jsonError('Start date is invalid.');
  if (!idNumber) {
    idNumber = `PKI-${startDate.slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const existing = await query(`SELECT id FROM users WHERE email = ?`, [email]);
  if (existing.length > 0) return jsonError('That email is already registered.', 409);

  const userId = newId();
  const packetId = newId();
  const accessWindow = Number((await setting('default_access_window_days')) ?? 30) || 30;
  const officeName = (await setting('hq_office_name')) ?? 'Corporate Headquarters';
  const officeAddress = (await setting('hq_office_address')) ?? '';
  const arrival = (await setting('default_arrival_time')) ?? '8:00 AM';
  const dress = (await setting('default_dress_code')) ?? 'Smart-Casual';
  const reporting = (await setting('default_reporting_to')) ?? 'HR Reception';

  await transaction(async (q) => {
    await q(
      `INSERT INTO users (id, email, password_hash, role, full_name)
       VALUES (?, ?, SHA2(?, 256), 'employee', ?)`,
      [userId, email, tempPassword, fullName]
    );
    await q(
      `INSERT INTO employees (id, employee_number, position, department, manager_name,
         start_date, access_window_days, welcome_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, idNumber, position, department, managerName, startDate, accessWindow, `Welcome to the team, ${fullName}!`]
    );
    await q(
      `INSERT INTO onboarding_packets (id, employee_id, welcome_message) VALUES (?, ?, ?)`,
      [packetId, userId, `Welcome to the team, ${fullName}!`]
    );
    for (const r of DEFAULT_REQUIREMENTS) {
      await q(
        `INSERT INTO onboarding_tasks
           (id, packet_id, employee_id, title, description, category, required, display_order, has_download)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.slug, packetId, userId, r.title, r.description, r.category, r.required ? 1 : 0, r.displayOrder, r.hasDownload ? 1 : 0]
      );
    }
    await q(`INSERT INTO medical_records (id, employee_id) VALUES (?, ?)`, [newId(), userId]);
    await q(
      `INSERT INTO first_day_guides
         (id, employee_id, office_name, office_address, arrival_time, dress_code, reporting_to, items_to_bring)
       VALUES (?, ?, ?, ?, ?, ?, ?,
         JSON_ARRAY('Original Government Valid IDs', 'Original Physical NBI Clearance Certificate',
                    'Bank Account Details for Payroll Authorization', 'Signed Physical Employment Contract Copy'))`,
      [newId(), userId, officeName, officeAddress, arrival, dress, reporting]
    );
  });

  await auditEvent({
    actorId: user.id,
    actorName: user.full_name,
    actorRole: user.role,
    action: 'INVITE_EMPLOYEE',
    targetType: 'employee',
    targetId: userId,
    details: { employee_number: idNumber, department, start_date: startDate },
  });
  await notifyUser({
    userId,
    type: 'general',
    title: 'Welcome aboard! Your onboarding packet is ready.',
    body: 'Sign in to review your requirements and complete them before your start date.',
    linkSection: 'welcome',
  });

  return Response.json({ id: userId, employee_number: idNumber }, { status: 201 });
}
