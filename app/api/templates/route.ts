import { query, transaction, newId, type Row } from '@/lib/server-db';
import { getSessionUser, isHr, jsonError } from '@/lib/auth';

/** HR: templates with their requirement lists. */
export async function GET() {
  const user = await getSessionUser();
  if (!user || !isHr(user.role)) return jsonError('HR sign-in required.', 403);

  const templates = await query<Row>(
    `SELECT t.id, t.name, t.description, t.department, t.is_active,
            u.full_name AS created_by_name
     FROM onboarding_templates t LEFT JOIN users u ON u.id = t.created_by
     ORDER BY t.created_at DESC`
  );
  const items = await query<Row>(
    `SELECT template_id, slug, title, category, required, display_order
     FROM template_tasks ORDER BY template_id, display_order ASC`
  );
  const byTemplate: Record<string, Row[]> = {};
  for (const item of items) {
    const key = String(item.template_id);
    (byTemplate[key] = byTemplate[key] || []).push(item);
  }
  return Response.json({
    templates: templates.map((t) => ({ ...t, tasks: byTemplate[String(t.id)] ?? [] })),
  });
}

interface TemplateBody {
  name?: unknown;
  department?: unknown;
  description?: unknown;
  tasks?: unknown;
}

/** HR: save a template; tasks arrive one title per line. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || !isHr(user.role)) return jsonError('HR sign-in required.', 403);

  let body: TemplateBody;
  try {
    body = (await req.json()) as TemplateBody;
  } catch {
    return jsonError('Invalid request body.');
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const department = typeof body.department === 'string' ? body.department.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const rawTasks = typeof body.tasks === 'string' ? body.tasks : '';
  const titles = rawTasks
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 60);
  if (!name || !department) return jsonError('Name and department are required.');
  if (titles.length === 0) return jsonError('Add at least one requirement.');

  const templateId = newId();
  await transaction(async (q) => {
    await q(
      `INSERT INTO onboarding_templates (id, name, description, department, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [templateId, name, description || null, department, user.id]
    );
    let order = 1;
    for (const title of titles) {
      const slug =
        title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) ||
        `item-${order}`;
      await q(
        `INSERT INTO template_tasks (id, template_id, slug, title, category, required, display_order)
         VALUES (?, ?, ?, ?, 'document', 1, ?)`,
        [newId(), templateId, `${slug}-${order}`, title, order]
      );
      order += 1;
    }
  });

  return Response.json({ id: templateId }, { status: 201 });
}
