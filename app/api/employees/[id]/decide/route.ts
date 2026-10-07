import { query, newId, auditEvent, notifyUser, recalcProgress, type Row } from '@/lib/server-db';
import { getSessionUser, isHr, jsonError } from '@/lib/auth';
import { sectionForCategory, type TaskCategory } from '@/lib/onboarding';

interface Ctx {
  params: Promise<{ id: string }>;
}

interface DecideBody {
  taskId?: unknown;
  decision?: unknown;
  feedback?: unknown;
}

/** HR: approve a submission or send it back with feedback. */
export async function POST(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user || !isHr(user.role)) return jsonError('HR sign-in required.', 403);
  const { id: employeeId } = await ctx.params;

  let body: DecideBody;
  try {
    body = (await req.json()) as DecideBody;
  } catch {
    return jsonError('Invalid request body.');
  }
  const taskId = typeof body.taskId === 'string' ? body.taskId : '';
  const decision = body.decision === 'approved' || body.decision === 'needs_changes' ? body.decision : '';
  const feedback = typeof body.feedback === 'string' ? body.feedback.trim() : '';
  if (!taskId || !decision) return jsonError('Task and decision are required.');
  if (decision === 'needs_changes' && !feedback) {
    return jsonError('Feedback is required when sending back.');
  }

  const task = await query<Row & { id: string; title: string; category: TaskCategory }>(
    `SELECT id, title, category FROM onboarding_tasks WHERE id = ? AND employee_id = ?`,
    [taskId, employeeId]
  );
  if (task.length === 0) return jsonError('Task not found.', 404);

  await query(
    `UPDATE onboarding_tasks
     SET status = ?, feedback = ?, reviewed_at = NOW(), reviewed_by = ?
     WHERE id = ? AND employee_id = ?`,
    [decision, decision === 'needs_changes' ? feedback : null, user.id, taskId, employeeId]
  );
  await query(
    `INSERT INTO review_decisions (id, task_id, employee_id, reviewer_id, decision, comment)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [newId(), taskId, employeeId, user.id, decision, decision === 'needs_changes' ? feedback : null]
  );
  const pct = await recalcProgress(employeeId);

  await notifyUser({
    userId: employeeId,
    type: decision === 'approved' ? 'approval' : 'rejection',
    title: decision === 'approved' ? `${task[0].title} approved.` : `${task[0].title} needs changes.`,
    body: decision === 'approved' ? 'HR approved your submission. Nice work.' : feedback,
    linkSection: sectionForCategory(task[0].category),
    taskId,
  });
  await auditEvent({
    actorId: user.id,
    actorName: user.full_name,
    actorRole: user.role,
    action: decision === 'approved' ? 'APPROVE' : 'REJECT',
    targetType: 'task',
    targetId: taskId,
    details: { employee_id: employeeId, feedback: decision === 'needs_changes' ? feedback : null },
  });

  return Response.json({ ok: true, completion_pct: pct });
}
