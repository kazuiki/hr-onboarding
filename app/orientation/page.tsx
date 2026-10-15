"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Pause,
  Play,
  Shield,
  Unlock,
} from 'lucide-react';
import { apiUrl } from '@/lib/onboarding';

const ORIENTATION_WATCHED_KEY = 'pki_orientation_watched';

// Quick test mode so you can validate the onboarding flow without a real video.
// Set this to false and wire up a real MP4 when you have one.
const TEST_MODE = true;
const TEST_DURATION_SECONDS = 10;

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function OrientationPage() {
  const router = useRouter();

  const [simTime, setSimTime] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem(ORIENTATION_WATCHED_KEY) === 'true'
      ? TEST_DURATION_SECONDS
      : 0
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoFinished, setVideoFinished] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(ORIENTATION_WATCHED_KEY) === 'true'
  );
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    fetch(apiUrl('/api/auth/me'), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.full_name === 'string') setDisplayName(data.full_name);
      })
      .catch(() => undefined);
  }, []);

  // Server is the source of truth for the first-login gate; localStorage
  // only skips the redirect in this browser. Fire-and-forget so a flaky
  // connection never blocks the celebration UI.
  const markWatchedServer = useCallback(() => {
    void fetch(apiUrl('/api/me/orientation'), { method: 'POST' }).catch(() => undefined);
  }, []);

  // Clients flagged under the old local-only system sync once to the server.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (localStorage.getItem(ORIENTATION_WATCHED_KEY) === 'true') markWatchedServer();
    } catch {
      /* private mode — server flag still gates the next login */
    }
  }, [markWatchedServer]);

  useEffect(() => {
    if (!TEST_MODE) return;
    if (!isPlaying) return;
    if (videoFinished) return;

    const intervalId = window.setInterval(() => {
      setSimTime((prev) => {
        const next = Math.min(TEST_DURATION_SECONDS, prev + 0.1);
        if (next >= TEST_DURATION_SECONDS) {
          window.clearInterval(intervalId);

          localStorage.setItem(ORIENTATION_WATCHED_KEY, 'true');
          markWatchedServer();
          setVideoFinished(true);
          setIsPlaying(false);
        }
        return next;
      });
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [isPlaying, videoFinished, markWatchedServer]);

  const handleProceed = useCallback(() => {
    if (!videoFinished) return;
    setIsRedirecting(true);
    setTimeout(() => router.push('/dashboard'), 800);
  }, [router, videoFinished]);

  const watchedPct =
    TEST_DURATION_SECONDS > 0 ? (simTime / TEST_DURATION_SECONDS) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-8 sm:px-6 lg:px-8">
      {/* Top Brand Banner — matches the sign-in pages */}
      <div className="sm:mx-auto sm:w-full sm:max-w-3xl text-center mb-6 px-4">
        <div className="inline-flex flex-col items-center gap-2">
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
          <div className="mt-1 inline-flex items-center gap-2 text-[11px] text-[#005b96] font-semibold bg-[#eaf2f8] border border-[#b3cde0] rounded-full px-3 py-1">
            <Shield className="w-3.5 h-3.5" />
            Mandatory Orientation
          </div>
        </div>
      </div>

      <main className="sm:mx-auto sm:w-full sm:max-w-3xl px-4 sm:px-0">
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-lg shadow-[#011f4b]/5 px-5 sm:px-8 py-8 flex flex-col items-center gap-6">
        <div className="w-full text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#011f4b]">
            Welcome to Philkoei,{' '}
            <span className="text-[#005b96]">{displayName ? `${displayName}!` : 'new hire!'}</span>
          </h1>
          <p className="text-sm text-[#6497b1] max-w-xl mx-auto leading-relaxed">
            {TEST_MODE
              ? `For now, this is a ${TEST_DURATION_SECONDS}-second test playback so you can verify the onboarding flow.`
              : 'Please watch the company orientation video in full. The portal will unlock automatically once complete.'}
          </p>
        </div>

        <div className="w-full bg-black border border-[#e2e8f0] rounded-xl overflow-hidden">
          <div className="relative bg-black aspect-video w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-[#011f4b] via-[#03396c] to-[#005b96] opacity-70" />

            {!videoFinished ? (
              <button
                type="button"
                onClick={() => {
                  if (!TEST_MODE) return;
                  setIsPlaying((p) => !p);
                }}
                className="absolute inset-0 flex items-center justify-center"
                aria-label={isPlaying ? 'Pause orientation test' : 'Play orientation test'}
              >
                <div className="w-20 h-20 rounded-full bg-[#005b96]/80 backdrop-blur-sm flex items-center justify-center hover:bg-[#005b96] transition-all shadow-xl">
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-white" />
                  ) : (
                    <Play className="w-8 h-8 text-white ml-0.5" />
                  )}
                </div>
              </button>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white">Orientation Complete!</p>
                  <p className="text-sm text-[#b3cde0]">Your progress has been recorded.</p>
                </div>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="relative h-2 rounded-full bg-[#03396c] overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[#005b96] transition-all duration-300"
                  style={{ width: `${watchedPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-[#b3cde0]">
                <span className="font-mono tabular-nums">{formatTime(simTime)}</span>
                <span className="font-mono tabular-nums">{formatTime(TEST_DURATION_SECONDS)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col items-center gap-4">
          {!videoFinished && (
            <div className="flex items-center gap-2 text-sm text-[#6497b1]">
              <div className="w-44 h-1.5 bg-[#eaf2f8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#6497b1] rounded-full transition-all duration-300"
                  style={{ width: `${watchedPct}%` }}
                />
              </div>
              <span className="font-mono text-xs">{Math.floor(watchedPct)}% watched</span>
            </div>
          )}

          <button
            onClick={handleProceed}
            disabled={!videoFinished || isRedirecting}
            className={`relative flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-base transition-all duration-300 ${
              videoFinished && !isRedirecting
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25 scale-100 cursor-pointer'
                : 'bg-[#eaf2f8] text-[#6497b1] border border-[#e2e8f0] cursor-not-allowed scale-95 opacity-70'
            }`}
            aria-disabled={!videoFinished}
          >
            {isRedirecting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Entering Onboarding Portal…</span>
              </>
            ) : videoFinished ? (
              <>
                <Unlock className="w-5 h-5" />
                <span>Continue to Onboarding Portal</span>
                <ArrowRight className="w-5 h-5" />
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span>Proceed to Onboarding Portal</span>
                <span className="ml-1 text-xs opacity-70">(play test to unlock)</span>
              </>
            )}
          </button>

          {!videoFinished && (
            <p className="text-xs text-[#6497b1] text-center max-w-sm">
              This is a quick test playback. After it completes, the portal unlocks automatically.
            </p>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}
