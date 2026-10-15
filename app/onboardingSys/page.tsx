"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Shield,
  User,
  UserCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  MailCheck,
  QrCode,
} from 'lucide-react';
import { apiUrl } from '@/lib/onboarding';

const RESEND_COOLDOWN = 120; // 2 minutes — mirrors OTP_RESEND_SECONDS server-side.

type Step2Method = 'email' | 'totp' | 'qr';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'employee' | 'hr'>('employee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  // Step 2 — exactly one method visible at a time.
  const [challengeId, setChallengeId] = useState('');
  const [method, setMethod] = useState<Step2Method>('email');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrWaiting, setQrWaiting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Step-2 field state — error shakes + red border, success green border.
  const [codeStatus, setCodeStatus] = useState<'idle' | 'error' | 'success'>('idle');
  const shakeRef = useRef<HTMLDivElement>(null);

  const triggerShake = () => {
    const el = shakeRef.current;
    if (!el) return;
    el.classList.remove('animate-shake');
    void el.offsetWidth; // reflow so the animation replays on every failure
    el.classList.add('animate-shake');
  };

  // Landing links carry ?tab=hr|employee — preselect without Suspense.
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'hr' || tab === 'employee') setActiveTab(tab);
  }, []);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setQrWaiting(false);
  };

  const resetStep2 = () => {
    stopPolling();
    setChallengeId('');
    setCodeStatus('idle');
    setMethod('email');
    setMaskedEmail('');
    setCode('');
    setResendCooldown(0);
    setQrDataUrl('');
  };

  const handleTabSwitch = (tab: 'employee' | 'hr') => {
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
    resetStep2();
  };

  // Resend cooldown ticker.
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => stopPolling, []);

  const finishLogin = async (data: { role?: string; full_name?: string }) => {
    // Fresh sign-in resets this browser's orientation cache (it may belong
    // to whoever used this browser last). The server flag decides per user.
    try {
      localStorage.removeItem('pki_orientation_watched');
    } catch {
      /* private mode — server flag still gates correctly */
    }
    const isHrRole = data.role === 'hr_manager' || data.role === 'hr_assistant';
    if (activeTab === 'hr' && !isHrRole) {
      setErrorMsg('This account is not an HR account. Use the New Employee tab.');
      setCodeStatus('error');
      try {
        await fetch(apiUrl('/api/auth/logout'), { method: 'POST' });
      } catch {
        /* session cleanup best-effort */
      }
      return;
    }
    if (activeTab === 'employee' && data.role !== 'employee') {
      setErrorMsg('This account is not an employee account. Use the HR Portal tab.');
      setCodeStatus('error');
      try {
        await fetch(apiUrl('/api/auth/logout'), { method: 'POST' });
      } catch {
        /* session cleanup best-effort */
      }
      return;
    }
    setCodeStatus('success');
    setSuccessMsg(`Welcome back, ${data.full_name || 'user'}. Redirecting...`);
    setTimeout(() => {
      router.push(data.role === 'employee' ? '/dashboard' : '/hr');
      router.refresh();
    }, 600);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as {
        error?: string;
        role?: string;
        full_name?: string;
        requiresCode?: boolean;
        method?: 'email' | 'totp';
        challengeId?: string;
        maskedEmail?: string;
      };
      if (!res.ok) {
        setErrorMsg(data.error || 'Invalid email or password.');
        return;
      }
      if (data.requiresCode && data.challengeId) {
        setChallengeId(data.challengeId);
        setMethod(data.method === 'totp' ? 'totp' : 'email');
        setMaskedEmail(data.maskedEmail || '');
        setCode('');
        setQrDataUrl('');
        if (data.method !== 'totp') {
          setResendCooldown(RESEND_COOLDOWN);
          setSuccessMsg('We emailed you a 6-digit sign-in code.');
        }
        return;
      }
      await finishLogin(data);
    } catch {
      setErrorMsg('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(apiUrl('/api/auth/2fa/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, code, rememberDevice: false, method }),
      });
      const data = (await res.json()) as { error?: string; role?: string; full_name?: string };
      if (!res.ok) {
        setErrorMsg(data.error || 'Invalid email or password.');
        setCodeStatus('error');
        triggerShake();
        return;
      }
      // Keep the challenge visible so the box flashes green before redirect.
      await finishLogin(data);
    } catch {
      setErrorMsg('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const finalizeQrApproval = async () => {
    stopPolling();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(apiUrl('/api/auth/2fa/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, method: 'qr', rememberDevice: false }),
      });
      const data = (await res.json()) as { error?: string; role?: string; full_name?: string };
      if (!res.ok) {
        setErrorMsg(data.error || 'Approval failed. Sign in again.');
        setMethod('email');
        setQrDataUrl('');
        return;
      }
      resetStep2();
      await finishLogin(data);
    } catch {
      setErrorMsg('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const pollQrStatus = async (cid: string) => {
    try {
      const res = await fetch(apiUrl(`/api/auth/2fa/qr/status?challengeId=${encodeURIComponent(cid)}`));
      const data = (await res.json()) as { status?: string };
      if (data.status === 'approved') {
        await finalizeQrApproval();
      } else if (data.status === 'denied') {
        stopPolling();
        setErrorMsg('Denied from your phone. Back to the code, or sign in again.');
        setMethod('email');
        setQrDataUrl('');
      } else if (data.status === 'expired' || data.status === 'missing') {
        stopPolling();
        setErrorMsg('QR expired. Back to the code, or sign in again.');
        setMethod('email');
        setQrDataUrl('');
      }
    } catch {
      /* transient network blip — keep polling */
    }
  };

  // "Try it in another way" → QR edition: scan with phone, tap Approve.
  const switchToQr = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setCodeStatus('idle');
    try {
      const res = await fetch(apiUrl('/api/auth/2fa/qr/start'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId }),
      });
      const data = (await res.json()) as { error?: string; qrDataUrl?: string };
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not load the QR code.');
        return;
      }
      setQrDataUrl(data.qrDataUrl || '');
      setCode('');
      setMethod('qr');
      stopPolling();
      setQrWaiting(true);
      const cid = challengeId;
      pollRef.current = setInterval(() => pollQrStatus(cid), 2000);
    } catch {
      setErrorMsg('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Back the other way: fresh emailed code on the same challenge.
  const switchToEmail = async () => {
    stopPolling();
    setLoading(true);
    setErrorMsg('');
    setCodeStatus('idle');
    try {
      const res = await fetch(apiUrl('/api/auth/2fa/email/send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId }),
      });
      const data = (await res.json()) as { error?: string; retryAfter?: number };
      if (!res.ok) {
        if (typeof data.retryAfter === 'number') setResendCooldown(data.retryAfter);
        setErrorMsg(data.error || 'Could not send the code.');
        return;
      }
      setMethod('email');
      setQrDataUrl('');
      setCode('');
      setResendCooldown(RESEND_COOLDOWN);
      setSuccessMsg('We emailed you a 6-digit sign-in code.');
    } catch {
      setErrorMsg('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setErrorMsg('');
    setCodeStatus('idle');
    try {
      const res = await fetch(apiUrl('/api/auth/2fa/email/send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId }),
      });
      const data = (await res.json()) as { error?: string; retryAfter?: number };
      if (!res.ok) {
        if (typeof data.retryAfter === 'number') setResendCooldown(data.retryAfter);
        setErrorMsg(data.error || 'Could not resend the code.');
        return;
      }
      setResendCooldown(RESEND_COOLDOWN);
      setSuccessMsg('A fresh code is on its way — the old one no longer works.');
    } catch {
      setErrorMsg('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const backToEmail = () => {
    stopPolling();
    setCodeStatus('idle');
    setMethod('email');
    setQrDataUrl('');
    setCode('');
    setErrorMsg('');
  };

  const cooldownLabel = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-8 sm:px-6 lg:px-8">
      {/* Top Brand Banner */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link href="/" className="inline-flex flex-col items-center gap-2 group">
          <Image
            src={apiUrl('/PKII-LOGO.png')}
            alt="Philkoei International, Inc."
            width={400}
            height={50}
            className="h-11 sm:h-12 w-auto object-contain shrink-0"
            priority
          />
          <div className="text-xs text-[#6497b1] font-medium tracking-wide">
            Employee Onboarding Portal
          </div>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white p-8 sm:p-10 rounded-2xl border border-[#e2e8f0] shadow-lg shadow-[#011f4b]/5">
          {/* Role Selection Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#eaf2f8] rounded-xl mb-6">
            <button
              type="button"
              onClick={() => handleTabSwitch('employee')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'employee'
                  ? 'bg-white text-[#011f4b] shadow-sm'
                  : 'text-[#6497b1] hover:text-[#011f4b]'
              }`}
            >
              <User className="w-4 h-4" />
              New Employee
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('hr')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'hr'
                  ? 'bg-white text-[#011f4b] shadow-sm'
                  : 'text-[#6497b1] hover:text-[#011f4b]'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              HR Portal
            </button>
          </div>

          <div className="mb-2.5">
            <h2 className="text-xl font-bold text-[#011f4b]">
              {activeTab === 'employee' ? 'Welcome, New Hire!' : 'HR Administrator Sign In'}
            </h2>
            <p className="text-xs text-[#6497b1] mt-2 leading-relaxed">
              {activeTab === 'employee'
                ? 'Sign in with the email HR registered for you to view your onboarding checklist.'
                : 'Sign in with HR credentials to review submissions and manage onboarding.'}
            </p>
          </div>

          {/* Alert banner — login step only. Step 2 uses inline field feedback instead. */}
          {!challengeId && (errorMsg || successMsg) && (
            <div className="mb-2.5">
              {errorMsg ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}
            </div>
          )}

          {challengeId ? (
            method === 'qr' ? (
              <div className="space-y-4">
                <div className="p-3 bg-[#eaf2f8] border border-[#b3cde0] rounded-xl text-xs text-[#03396c] flex items-start gap-2">
                  <QrCode className="w-4 h-4 shrink-0 mt-0.5 text-[#005b96]" />
                  <span>Scan with your phone camera, then tap <strong>Approve</strong> on your phone. No typing needed.</span>
                </div>
                <div className="flex justify-center">
                  {qrDataUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={qrDataUrl} alt="Approve sign-in QR code" width={160} height={160} className="border border-[#b3cde0] rounded-xl" />
                  ) : (
                    <div className="w-[160px] h-[160px] flex items-center justify-center border border-[#b3cde0] rounded-xl">
                      <div className="w-8 h-8 border-2 border-[#005b96]/30 border-t-[#005b96] rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {qrWaiting && qrDataUrl && (
                  <p className="text-center text-xs text-[#6497b1] flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-[#005b96]/30 border-t-[#005b96] rounded-full animate-spin" />
                    Waiting for your phone…
                  </p>
                )}
                {errorMsg && (
                  <p role="alert" className="text-center text-xs font-medium text-red-600">
                    {errorMsg}
                  </p>
                )}
                <button
                  type="button"
                  onClick={backToEmail}
                  disabled={loading}
                  className="w-full text-xs font-semibold text-[#005b96] hover:text-[#03396c] py-1 disabled:opacity-50"
                >
                  Back to email code
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerify} className="space-y-5">
                <div className="p-3 bg-[#eaf2f8] border border-[#b3cde0] rounded-xl text-xs text-[#03396c] flex items-start gap-2">
                  <MailCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#005b96]" />
                  <span>
                    {method === 'totp' ? (
                      <>Password accepted. Enter the 6-digit code from your authenticator app.</>
                    ) : (
                      <>Password accepted. We sent a 6-digit code to <strong>{maskedEmail || 'your email'}</strong>. It expires in <strong>3 minutes</strong> — check your inbox (and spam).</>
                    )}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#03396c] mb-2">
                    {method === 'totp' ? 'Authenticator Code' : 'Email Code'}
                  </label>
                  <div className="relative" ref={shakeRef}>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className={`w-4 h-4 ${codeStatus === 'error' ? 'text-red-500' : codeStatus === 'success' ? 'text-emerald-500' : 'text-[#6497b1]'}`} />
                    </div>
                    <input
                      type="text"
                      required
                      autoFocus
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      value={code}
                      aria-invalid={codeStatus === 'error'}
                      onChange={(e) => {
                        setCode(e.target.value);
                        if (codeStatus !== 'idle') setCodeStatus('idle');
                        if (errorMsg) setErrorMsg('');
                      }}
                      className={`w-full pl-9 pr-3 py-2.5 text-sm bg-white border rounded-xl focus:ring-2 transition-all text-[#011f4b] tracking-[0.3em] text-center ${
                        codeStatus === 'error'
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                          : codeStatus === 'success'
                            ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                            : 'border-[#b3cde0] focus:border-[#005b96] focus:ring-[#005b96]/20'
                      }`}
                      placeholder="••••••"
                    />
                  </div>
                  {codeStatus !== 'idle' && (errorMsg || successMsg) && (
                    <p role="alert" className={`mt-2 text-xs font-medium ${codeStatus === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
                      {errorMsg || successMsg}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6! bg-[#005b96] hover:bg-[#03396c] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-[#005b96]/20 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Verify Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center text-xs text-[#6497b1] space-y-2 mt-4!">
                  {method === 'email' && (
                    <div>
                      No code yet?{' '}
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={loading || resendCooldown > 0}
                        className="font-semibold text-[#005b96] hover:text-[#03396c] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resendCooldown > 0 ? `Resend in ${cooldownLabel(resendCooldown)}` : 'Resend code'}
                      </button>
                    </div>
                  )}
                  <div>
                    {method === 'email' ? (
                      <button
                        type="button"
                        onClick={switchToQr}
                        disabled={loading}
                        className="font-semibold text-[#005b96] hover:text-[#03396c] disabled:opacity-50"
                      >
                        Try it in another way — scan a QR code
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={switchToEmail}
                        disabled={loading}
                        className="font-semibold text-[#005b96] hover:text-[#03396c] disabled:opacity-50"
                      >
                        Try it in another way — email me a code instead
                      </button>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetStep2();
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="w-full text-xs font-semibold text-[#6497b1] hover:text-[#011f4b] py-1"
                >
                  Back to password
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#03396c] mb-2">
                Corporate Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-[#6497b1]" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-[#b3cde0] rounded-xl focus:border-[#005b96] focus:ring-2 focus:ring-[#005b96]/20 transition-all text-[#011f4b] placeholder-[#6497b1]/50"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#03396c] mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-[#6497b1]" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-[#b3cde0] rounded-xl focus:border-[#005b96] focus:ring-2 focus:ring-[#005b96]/20 transition-all text-[#011f4b]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6! bg-[#005b96] hover:bg-[#03396c] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-[#005b96]/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as {activeTab === 'employee' ? 'Employee' : 'HR Admin'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          )}

          <div className="mt-5 flex flex-col items-center text-center text-xs leading-relaxed text-[#6497b1]">
            <div className="flex items-start justify-center gap-2 text-left">
              <Shield className="mt-0.5 w-3.5 h-3.5 shrink-0 text-[#005b96]" />
              <span>Password + verification code, checked server-side on every sign-in</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
