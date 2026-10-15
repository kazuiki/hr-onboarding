import nodemailer, { type Transporter } from 'nodemailer';

// Server-only mailer. Never import from client components.
// All credentials come from env — fill them in `.env` / `.env.local`:
//
//   SMTP_HOST="smtp.gmail.com"
//   SMTP_PORT="587"
//   SMTP_USER="you@gmail.com"
//   SMTP_PASS="your-gmail-app-password"
//   SMTP_FROM="HR Onboarding <you@gmail.com>"   (optional, falls back to SMTP_USER)
//   HR_NOTIFY_EMAIL="hr@gmail.com"              (where employee submissions go)
//
// Gmail tip: use an App Password (Google Account → Security → 2-Step
// Verification → App passwords), not your normal login password.

interface MailerConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  hrEmail: string;
}

function getConfig(): MailerConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const hrEmail = process.env.HR_NOTIFY_EMAIL?.trim();
  if (!host || !user || !pass || !hrEmail) return null;
  const port = Number(process.env.SMTP_PORT || '587');
  return {
    host,
    port: Number.isInteger(port) && port > 0 ? port : 587,
    user,
    pass,
    // Friendly display name so the recipient recognizes the sender at a
    // glance (bare addresses get ignored or marked as spam more often).
    // Keep the address identical to SMTP_USER so Gmail auth stays aligned.
    from: process.env.SMTP_FROM?.trim() || `PKII Onboarding <${user}>`,
    hrEmail,
  };
}

/** False when credentials are missing — callers should skip silently. */
export function isEmailConfigured(): boolean {
  return getConfig() !== null;
}

let transporter: Transporter | null = null;

function getTransporter(cfg: MailerConfig): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
    });
  }
  return transporter;
}

export interface HrDocumentNotice {
  employeeName: string;
  employeeEmail: string;
  employeeNumber?: string | null;
  /** Requirement title / form type — the "name of document" grouping. */
  documentName: string;
  /** Original filenames the employee uploaded. */
  fileNames: string[];
  /** 'requirement' for task uploads, 'form' for form submissions. */
  kind: 'requirement' | 'form';
}

/**
 * Notify HR that a specific employee submitted a document.
 * Never throws — email must not break the upload flow. Returns true
 * when the message was accepted, false when skipped/failed.
 */
export async function notifyHrOfDocumentSubmission(notice: HrDocumentNotice): Promise<boolean> {
  const cfg = getConfig();
  if (!cfg) {
    console.warn('[mailer] Skipped HR notification: SMTP_HOST/SMTP_USER/SMTP_PASS/HR_NOTIFY_EMAIL not set.');
    return false;
  }
  const files = notice.fileNames.length > 0 ? notice.fileNames : ['(no files listed)'];
  const subject = `New document submitted: ${notice.documentName} — ${notice.employeeName}`;
  const lines = [
    `Employee: ${notice.employeeName} (${notice.employeeEmail})`,
    ...(notice.employeeNumber ? [`Employee no.: ${notice.employeeNumber}`] : []),
    `Document: ${notice.documentName}`,
    `Type: ${notice.kind === 'form' ? 'Form submission' : 'Requirement upload'}`,
    `Submitted at: ${new Date().toLocaleString()}`,
    ``,
    `Files:`,
    ...files.map((f) => ` - ${f}`),
  ];
  const text = lines.join('\n');

  try {
    await getTransporter(cfg).sendMail({
      from: cfg.from,
      to: cfg.hrEmail,
      replyTo: notice.employeeEmail || undefined,
      subject,
      text,
      html: buildHrNoticeHtml(notice, files),
    });
    return true;
  } catch (err) {
    console.error('[mailer] Failed to send HR notification:', err);
    return false;
  }
}

/**
 * Sign-in verification code email (Philkoei white + blue theme, no attachments).
 * Code stays out of the subject so notification previews never leak it.
 * Never throws — returns false when unconfigured or sending fails.
 */
export async function sendSignInCode(to: string, name: string, code: string): Promise<boolean> {
  const cfg = getConfig();
  if (!cfg) {
    console.warn('[mailer] Skipped sign-in code: SMTP_HOST/SMTP_USER/SMTP_PASS not set.');
    return false;
  }
  const digits = code
    .split('')
    .map((d) => `<span style="display:inline-block;background-color:#1e40af;color:#ffffff;font-size:28px;font-weight:bold;padding:10px 0;width:46px;margin:0 3px;border-radius:8px;">${escapeHtml(d)}</span>`)
    .join('');
  const text = [
    `Hi ${name},`,
    ``,
    `Your PKII Onboarding sign-in code is: ${code}`,
    `It expires in 3 minutes.`,
    ``,
    `If you did not try to sign in, ignore this email — your password alone cannot complete a sign-in.`,
  ].join('\n');
  const html = `
<div style="margin:0;padding:24px 12px;background-color:#eff6ff;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #bfdbfe;">
    <tr>
      <td style="background-color:#ffffff;padding:22px 28px 6px;text-align:center;border-bottom:3px solid #1e40af;">
        <div style="color:#1e40af;font-size:13px;font-weight:bold;letter-spacing:0.4px;margin:8px 0 12px;">PHILKOEI INTERNATIONAL, INC. &bull; HR ONBOARDING</div>
      </td>
    </tr>
    <tr>
      <td style="padding:26px 30px;text-align:center;">
        <div style="font-size:20px;font-weight:bold;color:#011f4b;">Your sign-in code</div>
        <p style="font-size:13px;color:#475569;margin:8px 0 18px;">Hi ${escapeHtml(name)}, enter this code to finish signing in:</p>
        <div style="margin:0 0 18px;">${digits}</div>
        <div style="display:inline-block;background-color:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;font-size:12px;font-weight:bold;padding:7px 16px;border-radius:999px;">Expires in 3 minutes</div>
        <p style="font-size:11px;color:#94a3b8;margin:18px 0 0;">Didn&apos;t try to sign in? Ignore this email — the code alone is useless without your password.</p>
      </td>
    </tr>
    <tr>
      <td style="background-color:#1e3a8a;padding:14px 28px;text-align:center;color:#bfdbfe;font-size:11px;">Automated message from the PKII HR Onboarding system. Please do not reply.</td>
    </tr>
  </table>
</div>`;
  try {
    await getTransporter(cfg).sendMail({
      from: cfg.from,
      to,
      subject: 'Your PKII Onboarding sign-in code',
      text,
      html,
    });
    return true;
  } catch (err) {
    console.error('[mailer] Failed to send sign-in code:', err);
    return false;
  }
}

/** Blue-themed branded HR notification email. Table layout for Gmail support. */
export function buildHrNoticeHtml(notice: HrDocumentNotice, files: string[]): string {
  const typeLabel = notice.kind === 'form' ? 'Form submission' : 'Requirement upload';
  const submittedAt = new Date().toLocaleString();
  const badgeBg = notice.kind === 'form' ? '#1d4ed8' : '#0284c7';
  const fileRows = files
    .map(
      (f) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #dbeafe;font-size:13px;color:#1e3a8a;">&#128196; ${escapeHtml(f)}</td></tr>`
    )
    .join('');
  return `
<div style="margin:0;padding:24px 12px;background-color:#eff6ff;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #bfdbfe;">
    <tr>
      <td style="background-color:#1e40af;padding:24px 28px;text-align:center;">
        <div style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:0.3px;">New Document Submitted</div>
        <div style="color:#bfdbfe;font-size:12px;margin-top:4px;">Philkoei International, Inc. &bull; HR Onboarding</div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 28px;">
        <span style="display:inline-block;background-color:${badgeBg};color:#ffffff;font-size:11px;font-weight:bold;letter-spacing:0.6px;text-transform:uppercase;padding:5px 12px;border-radius:999px;">${escapeHtml(typeLabel)}</span>
        <p style="font-size:14px;color:#334155;margin:14px 0 18px;">Hi HR, <strong style="color:#1e3a8a;">${escapeHtml(notice.employeeName)}</strong> just submitted a document for review.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;margin-bottom:18px;">
          <tr><td style="padding:10px 14px;font-size:12px;color:#64748b;width:130px;">Employee</td><td style="padding:10px 14px;font-size:13px;color:#0f172a;font-weight:bold;">${escapeHtml(notice.employeeName)}</td></tr>
          <tr><td style="padding:10px 14px;font-size:12px;color:#64748b;border-top:1px solid #bfdbfe;">Email</td><td style="padding:10px 14px;font-size:13px;color:#0f172a;border-top:1px solid #bfdbfe;">${escapeHtml(notice.employeeEmail)}</td></tr>
          ${notice.employeeNumber ? `<tr><td style="padding:10px 14px;font-size:12px;color:#64748b;border-top:1px solid #bfdbfe;">Employee no.</td><td style="padding:10px 14px;font-size:13px;color:#0f172a;border-top:1px solid #bfdbfe;">${escapeHtml(notice.employeeNumber)}</td></tr>` : ''}
          <tr><td style="padding:10px 14px;font-size:12px;color:#64748b;border-top:1px solid #bfdbfe;">Document</td><td style="padding:10px 14px;font-size:13px;color:#1e40af;font-weight:bold;border-top:1px solid #bfdbfe;">${escapeHtml(notice.documentName)}</td></tr>
          <tr><td style="padding:10px 14px;font-size:12px;color:#64748b;border-top:1px solid #bfdbfe;">Submitted</td><td style="padding:10px 14px;font-size:13px;color:#0f172a;border-top:1px solid #bfdbfe;">${escapeHtml(submittedAt)}</td></tr>
        </table>
        <div style="font-size:12px;font-weight:bold;color:#1e40af;letter-spacing:0.4px;text-transform:uppercase;margin-bottom:8px;">Files submitted (${files.length})</div>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #bfdbfe;border-radius:8px;overflow:hidden;margin-bottom:4px;">${fileRows}</table>
      </td>
    </tr>
    <tr>
      <td style="background-color:#1e3a8a;padding:14px 28px;text-align:center;color:#bfdbfe;font-size:11px;">This is an automated notification from the PKII HR Onboarding system. Please do not reply directly.</td>
    </tr>
  </table>
</div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
}
