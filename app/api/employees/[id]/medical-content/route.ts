import { query, auditEvent, type Row } from '@/lib/server-db';
import { getSessionUser, isHr, jsonError } from '@/lib/auth';

interface Ctx {
  params: Promise<{ id: string }>;
}

interface MedicalContentBody {
  clinicName?: unknown;
  clinicAddress?: unknown;
  clinicPhone?: unknown;
  clinicHours?: unknown;
}

function clean(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

/** HR: save one hire's Accredited Clinic details (upsert, audited). */
export async function PUT(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user || !isHr(user.role)) return jsonError('HR sign-in required.', 403);
  const { id: employeeId } = await ctx.params;

  let body: MedicalContentBody;
  try {
    body = (await req.json()) as MedicalContentBody;
  } catch {
    return jsonError('Invalid request body.');
  }
  const clinicName = clean(body.clinicName, 255);
  const clinicAddress = clean(body.clinicAddress, 2000);
  const clinicPhone = clean(body.clinicPhone, 64);
  const clinicHours = clean(body.clinicHours, 255);
  if (!clinicName || !clinicAddress || !clinicPhone || !clinicHours) {
    return jsonError('Clinic name, address, phone, and hours are all required.');
  }

  try {
    const exists = await query<Row>(`SELECT id FROM employees WHERE id = ?`, [employeeId]);
    if (exists.length === 0) return jsonError('Employee not found.', 404);

    await query(
      `INSERT INTO employee_medical_content
        (employee_id, clinic_name, clinic_address, clinic_phone, clinic_hours, updated_by)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        clinic_name = VALUES(clinic_name),
        clinic_address = VALUES(clinic_address),
        clinic_phone = VALUES(clinic_phone),
        clinic_hours = VALUES(clinic_hours),
        updated_by = VALUES(updated_by)`,
      [employeeId, clinicName, clinicAddress, clinicPhone, clinicHours, user.id]
    );
  } catch (e) {
    if ((e as { code?: string })?.code === 'ER_NO_SUCH_TABLE') {
      return jsonError(
        'Medical content storage is not set up yet. Import database/parts/29_employee_medical_content.sql.',
        503
      );
    }
    throw e;
  }

  await auditEvent({
    actorId: user.id,
    actorName: user.full_name,
    actorRole: user.role,
    action: 'MEDICAL_CONTENT_UPDATED',
    targetType: 'employee',
    targetId: employeeId,
    details: { clinic_name: clinicName },
  });

  return Response.json({
    ok: true,
    medicalClinic: { clinicName, clinicAddress, clinicPhone, clinicHours },
  });
}
