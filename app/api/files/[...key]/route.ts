import { readFile } from 'fs/promises';
import path from 'path';
import { getSessionUser, isHr, jsonError } from '@/lib/auth';

interface Ctx {
  params: Promise<{ key: string[] }>;
}

const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

/** Authenticated file download. HR may read any hire's files; an employee may read only their own folder. */
export async function GET(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return jsonError('Not signed in.', 401);

  const key = (await ctx.params).key ?? [];
  // Only paths shaped like uploads/<employeeId>/<file> are servable.
  if (key.length !== 3 || key[0] !== 'uploads') return jsonError('File not found.', 404);
  const employeeId = key[1];
  const fileName = key[2];
  if (!employeeId || !fileName || fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
    return jsonError('File not found.', 404);
  }
  if (!isHr(user.role) && employeeId !== user.id) return jsonError('Not allowed.', 403);

  const abs = path.join(process.cwd(), 'public', 'uploads', employeeId, fileName);
  // Stay inside the uploads root even with encoded segments.
  const root = path.join(process.cwd(), 'public', 'uploads') + path.sep;
  if (!abs.startsWith(root)) return jsonError('File not found.', 404);

  let bytes: Buffer;
  try {
    bytes = await readFile(abs);
  } catch {
    return jsonError('File not found.', 404);
  }
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const body = new Uint8Array(bytes);
  return new Response(body, {
    headers: {
      'Content-Type': MIME_BY_EXT[ext] ?? 'application/octet-stream',
      'Content-Length': String(bytes.length),
      'Content-Disposition': `inline; filename="${fileName.replace(/"/g, '')}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
