"use client";

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ShieldCheck, XCircle, AlertCircle, CheckCircle2, Smartphone } from 'lucide-react';
import { apiUrl } from '@/lib/onboarding';

function ApproveInner() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [maskedHint, setMaskedHint] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [decided, setDecided] = useState<'approved' | 'denied' | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setErrorMsg('This link is missing its token.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(apiUrl(`/api/auth/2fa/qr/approve?token=${encodeURIComponent(token)}`));
      const data = (await res.json()) as { error?: string; maskedHint?: string };
      if (!res.ok) {
        setErrorMsg(data.error || 'This link is expired or already used.');
        return;
      }
      setMaskedHint(data.maskedHint || '');
    } catch {
      setErrorMsg('Could not reach the server. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    setErrorMsg('');
    try {
      const res = await fetch(apiUrl('/api/auth/2fa/qr/approve'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, approve }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErrorMsg(data.error || 'This link is expired or already used.');
        return;
      }
      setDecided(approve ? 'approved' : 'denied');
    } catch {
      setErrorMsg('Could not reach the server. Check your connection.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-white py-8 px-6 rounded-2xl border border-[#e2e8f0] shadow-lg shadow-[#011f4b]/5 text-center">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-[#005b96]/30 border-t-[#005b96] rounded-full animate-spin" />
        </div>
      ) : errorMsg && !decided ? (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 text-left">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      ) : decided ? (
        <div className="py-4">
          {decided === 'approved' ? (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600 mb-3" />
              <h2 className="text-lg font-bold text-[#011f4b]">Approved</h2>
              <p className="text-xs text-[#6497b1] mt-1">Your other device is signing in now.</p>
            </>
          ) : (
            <>
              <XCircle className="w-12 h-12 mx-auto text-red-500 mb-3" />
              <h2 className="text-lg font-bold text-[#011f4b]">Denied</h2>
              <p className="text-xs text-[#6497b1] mt-1">That sign-in was blocked. If it wasn&apos;t you, tell HR.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <Smartphone className="w-10 h-10 mx-auto text-[#005b96] mb-3" />
          <h2 className="text-lg font-bold text-[#011f4b]">Approve sign-in?</h2>
          <p className="text-xs text-[#6497b1] mt-1 mb-1">
            Account <strong className="text-[#03396c]">{maskedHint}</strong> is trying to sign in on another device.
          </p>
          <p className="text-xs text-[#6497b1] mb-5">Was this you? The link expires in 3 minutes.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => decide(false)}
              disabled={busy}
              className="flex-1 border border-red-200 text-red-700 font-semibold py-3 rounded-xl text-sm hover:bg-red-50 disabled:opacity-50"
            >
              Deny
            </button>
            <button
              type="button"
              onClick={() => decide(true)}
              disabled={busy}
              className="flex-[2] bg-[#005b96] hover:bg-[#03396c] text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {busy ? 'Working…' : 'Approve'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ApprovePage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center py-12 px-4">
      <div className="inline-flex flex-col items-center gap-2 mb-6">
        <Image src={apiUrl('/PKII-LOGO.png')} alt="Philkoei International, Inc." width={400} height={50} className="h-11 w-auto object-contain" priority />
        <div className="text-xs text-[#6497b1] font-medium tracking-wide">Sign-In Approval</div>
      </div>
      <Suspense fallback={
        <div className="w-full max-w-sm bg-white py-8 px-6 rounded-2xl border border-[#e2e8f0] flex justify-center">
          <div className="w-8 h-8 border-2 border-[#005b96]/30 border-t-[#005b96] rounded-full animate-spin" />
        </div>
      }>
        <ApproveInner />
      </Suspense>
    </div>
  );
}
