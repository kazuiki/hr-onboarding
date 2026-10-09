"use client";

import { useState } from 'react';
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
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'employee' | 'hr'>('employee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleTabSwitch = (tab: 'employee' | 'hr') => {
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string; role?: string; full_name?: string };
      if (!res.ok) {
        setErrorMsg(data.error || 'Invalid email or password.');
        return;
      }
      const isHrRole = data.role === 'hr_manager' || data.role === 'hr_assistant';
      if (activeTab === 'hr' && !isHrRole) {
        setErrorMsg('This account is not an HR account. Use the New Employee tab.');
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch {
          /* session cleanup best-effort */
        }
        return;
      }
      if (activeTab === 'employee' && data.role !== 'employee') {
        setErrorMsg('This account is not an employee account. Use the HR Portal tab.');
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch {
          /* session cleanup best-effort */
        }
        return;
      }
      setSuccessMsg(`Welcome back, ${data.full_name || 'user'}. Redirecting...`);
      setTimeout(() => {
        router.push(data.role === 'employee' ? '/dashboard' : '/hr');
        router.refresh();
      }, 600);
    } catch {
      setErrorMsg('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Brand Banner */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link href="/" className="inline-flex flex-col items-center gap-2 group">
          <Image
            src="/PKII-LOGO.png"
            alt="Philkoei International, Inc."
            width={400}
            height={50}
            className="h-12 sm:h-14 w-auto object-contain shrink-0"
            priority
          />
          <div className="text-xs text-[#6497b1] font-medium tracking-wide">
            Employee Onboarding Portal
          </div>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-[#e2e8f0] shadow-lg shadow-[#011f4b]/5">
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

          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#011f4b]">
              {activeTab === 'employee' ? 'Welcome, New Hire!' : 'HR Administrator Sign In'}
            </h2>
            <p className="text-xs text-[#6497b1] mt-1">
              {activeTab === 'employee'
                ? 'Sign in with the email HR registered for you to view your onboarding checklist.'
                : 'Sign in with HR credentials to review submissions and manage onboarding.'}
            </p>
          </div>

          {/* Alert messages */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#03396c] mb-1.5">
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
              <div className="mb-1.5">
                <label className="block text-xs font-semibold text-[#03396c]">
                  Password
                </label>
              </div>
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
              className="w-full mt-2 bg-[#005b96] hover:bg-[#03396c] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-[#005b96]/20 disabled:opacity-50"
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

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#6497b1]">
            <Shield className="w-3.5 h-3.5 text-[#005b96]" />
            <span>Credentials verified server-side on every sign-in</span>
          </div>
        </div>
      </div>
    </div>
  );
}
