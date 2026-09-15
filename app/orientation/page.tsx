"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Lock,
  Unlock,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ArrowRight,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { INITIAL_EMPLOYEE } from '@/lib/mock-data';

const ORIENTATION_WATCHED_KEY = 'pki_orientation_watched';

// NOTE: Replace with your real company introduction video (MP4) before production.
const VIDEO_SRC =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function OrientationPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  // Anti-skip: furthest verified playback position.
  const maxWatchedRef = useRef(0);

  const [videoFinished, setVideoFinished] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [showSeekWarning, setShowSeekWarning] = useState(false);
  const seekWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const alreadyWatched = localStorage.getItem(ORIENTATION_WATCHED_KEY);
    if (alreadyWatched === 'true') {
      router.replace('/dashboard');
    }
  }, [router]);

  const flashSeekWarning = useCallback(() => {
    setShowSeekWarning(true);
    if (seekWarningTimerRef.current) clearTimeout(seekWarningTimerRef.current);
    seekWarningTimerRef.current = setTimeout(() => setShowSeekWarning(false), 2500);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const ct = video.currentTime;
    setCurrentTime(ct);

    if (ct > maxWatchedRef.current) {
      maxWatchedRef.current = ct;
    }
  }, []);

  // Forward seeking guard.
  const handleSeeking = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.currentTime > maxWatchedRef.current + 1) {
      video.currentTime = maxWatchedRef.current;
      flashSeekWarning();
    }
  }, [flashSeekWarning]);

  // Keyboard guard: Right Arrow + l/L.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const blocked = ['ArrowRight', 'l', 'L'];
      if (blocked.includes(e.key)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        flashSeekWarning();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [flashSeekWarning]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setVideoFinished(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ORIENTATION_WATCHED_KEY, 'true');
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const v = Number(e.target.value);
    video.volume = v;
    setVolume(v);
    setIsMuted(v === 0);
  }, []);

  const handleProgressScrub = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current;
      if (!video) return;

      const requested = Number(e.target.value);
      if (requested > maxWatchedRef.current + 1) {
        flashSeekWarning();
        return;
      }

      video.currentTime = requested;
      setCurrentTime(requested);
    },
    [flashSeekWarning]
  );

  const handleProceed = useCallback(() => {
    if (!videoFinished) return;
    setIsRedirecting(true);
    setTimeout(() => router.push('/dashboard'), 800);
  }, [router, videoFinished]);

  const watchedPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const maxWatchedPct =
    duration > 0 ? (maxWatchedRef.current / duration) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#011f4b] text-white flex flex-col">
      <header className="h-14 flex items-center justify-between px-5 sm:px-8 border-b border-[#03396c]/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#005b96] flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">
            Philkoei International, Inc.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#b3cde0] font-medium border border-[#03396c] rounded-full px-3 py-1">
          <Shield className="w-3.5 h-3.5 text-[#6497b1]" />
          Mandatory Orientation
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-4 sm:px-8 py-8 gap-8 max-w-5xl mx-auto w-full">
        <div className="w-full text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome to Philkoei,{' '}
            <span className="text-[#b3cde0]">{INITIAL_EMPLOYEE.full_name}!</span>
          </h1>
          <p className="text-sm text-[#6497b1] max-w-xl mx-auto leading-relaxed">
            Before you begin your onboarding checklist, please watch the Company Introduction &amp;
            Orientation video in full. The portal will unlock automatically once the video is
            complete.
          </p>
        </div>

        <div className="w-full bg-[#03396c]/30 border border-[#03396c] rounded-2xl overflow-hidden shadow-2xl">
          <div
            className={`flex items-center gap-2.5 px-5 py-3 bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs font-medium transition-all duration-300 ${
              showSeekWarning
                ? 'opacity-100 max-h-12'
                : 'opacity-0 max-h-0 overflow-hidden py-0 border-none'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            Fast-forwarding is disabled — please watch the entire orientation video.
          </div>

          <div className="relative bg-black aspect-video w-full group">
            <video
              ref={videoRef}
              src={VIDEO_SRC}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onSeeking={handleSeeking}
              onEnded={handleEnded}
              onLoadedMetadata={() => {
                const v = videoRef.current;
                setDuration(v?.duration ?? 0);
              }}
              onContextMenu={(e) => e.preventDefault()}
              disablePictureInPicture
              controls={false}
            />

            {!isPlaying && !videoFinished && (
              <button
                onClick={togglePlayPause}
                className="absolute inset-0 flex items-center justify-center"
                aria-label="Play orientation video"
              >
                <div className="w-20 h-20 rounded-full bg-[#005b96]/80 backdrop-blur-sm flex items-center justify-center hover:bg-[#005b96] transition-all shadow-xl">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </button>
            )}

            {videoFinished && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#011f4b]/80 backdrop-blur-sm gap-4">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white">Orientation Complete!</p>
                  <p className="text-sm text-[#b3cde0]">Your progress has been recorded.</p>
                </div>
              </div>
            )}
          </div>

          <div className="px-5 py-4 bg-[#011f4b]/80 space-y-3 border-t border-[#03396c]/60">
            <div className="relative h-2 rounded-full bg-[#03396c] overflow-hidden cursor-pointer">
              <div
                className="absolute inset-y-0 left-0 bg-[#6497b1]/60 pointer-events-none"
                style={{ width: `${maxWatchedPct}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-[#005b96] pointer-events-none"
                style={{ width: `${watchedPct}%` }}
              />
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleProgressScrub}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                aria-label="Video progress"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlayPause}
                  disabled={videoFinished}
                  className="w-9 h-9 rounded-full bg-[#005b96] hover:bg-[#03396c] disabled:opacity-40 flex items-center justify-center transition-colors"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 text-white" />
                  ) : (
                    <Play className="w-4 h-4 text-white ml-0.5" />
                  )}
                </button>

                <span className="text-xs font-mono text-[#b3cde0] tabular-nums">
                  {formatTime(currentTime)} <span className="text-[#6497b1]">/ {formatTime(duration)}</span>
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-[#6497b1]">
                <Lock className="w-3 h-3" />
                No skipping — watch fully to unlock
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="text-[#6497b1] hover:text-white transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 accent-[#005b96]"
                  aria-label="Volume"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col items-center gap-4">
          {!videoFinished && (
            <div className="flex items-center gap-2 text-sm text-[#6497b1]">
              <div className="w-44 h-1.5 bg-[#03396c] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#6497b1] rounded-full transition-all duration-300"
                  style={{ width: `${maxWatchedPct}%` }}
                />
              </div>
              <span className="font-mono text-xs">{Math.floor(maxWatchedPct)}% watched</span>
            </div>
          )}

          <button
            onClick={handleProceed}
            disabled={!videoFinished || isRedirecting}
            className={`relative flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-base transition-all duration-300 ${
              videoFinished && !isRedirecting
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25 scale-100 cursor-pointer'
                : 'bg-[#03396c] text-[#6497b1] border border-[#03396c] cursor-not-allowed scale-95 opacity-70'
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
                <span className="ml-1 text-xs opacity-70">(watch video to unlock)</span>
              </>
            )}
          </button>

          {!videoFinished && (
            <p className="text-xs text-[#6497b1] text-center max-w-sm">
              This button becomes active once you have fully watched the orientation video.
              You may pause but cannot fast-forward.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
