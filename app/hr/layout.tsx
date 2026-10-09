"use client";

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  History,
  LogOut,
  Menu,
  MessageCircle,
  X,
  Bell,
  Send,
  Info,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface HRNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link_section: string | null;
  is_read: number;
  created_at: string;
}

const NAV_ITEMS = [
  { href: '/hr', label: 'Overview', icon: LayoutDashboard },
  // Templates page kept for a future feature; hidden from the nav for now.
  // { href: '/hr/templates', label: 'Templates', icon: ClipboardList },
  { href: '/hr/messages', label: 'Messages', icon: MessageCircle },
  { href: '/hr/audit-log', label: 'Audit Log', icon: History },
];

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hrName, setHrName] = useState('HR');
  const [hrRole, setHrRole] = useState('');
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<HRNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.full_name === 'string') setHrName(data.full_name);
        if (data && typeof data.role === 'string') {
          setHrRole(data.role === 'hr_manager' ? 'HR Manager' : 'HR Assistant');
        }
      })
      .catch(() => undefined);
  }, []);

  const loadNotifs = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.items ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Bell refreshes on next poll.
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadNotifs();
    const timer = setInterval(() => void loadNotifs(), 10000);
    return () => clearInterval(timer);
  }, [loadNotifs]);

  // Auto mark-read: viewing HR messages clears unread chat alerts, no bell click needed.
  useEffect(() => {
    if (!pathname.startsWith('/hr/messages')) return;
    const ids = notifications.filter((n) => !n.is_read && n.type === 'chat').map((n) => n.id);
    if (ids.length === 0) return;
    (async () => {
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
      } catch {
        return;
      }
      setNotifications((prev) => prev.map((x) => (ids.includes(x.id) ? { ...x, is_read: 1 } : x)));
      setUnreadCount((c) => Math.max(0, c - ids.length));
    })();
  }, [pathname, notifications]);

  const handleNotifClick = async (n: HRNotification) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id }),
      });
    } catch {
      // Mark-read is best-effort.
    }
    setNotifOpen(false);
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, is_read: 1 } : x))
    );
    setUnreadCount((c) => Math.max(0, c - (n.is_read ? 0 : 1)));
    if (n.type === 'chat') {
      router.push('/hr/messages');
    }
  };

  const handleSignOut = async () => {
    setConfirmSignOut(false);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-[#011f4b] text-white shrink-0">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-[#03396c]">
          <Image
            src="/PKII-LOGO1.png"
            alt="PKII"
            width={32}
            height={32}
            className="w-8 h-8 rounded-lg object-contain bg-white shrink-0"
          />
          <div>
            <div className="text-sm font-bold tracking-tight">Philkoei HR</div>
            <div className="text-[10px] text-[#b3cde0]">Admin Portal</div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/hr'
                ? pathname === '/hr'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#005b96] text-white shadow-sm'
                    : 'text-[#b3cde0] hover:bg-[#03396c] hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#03396c]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#03396c] flex items-center justify-center text-xs font-bold text-[#b3cde0]">
              {hrName
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-bold text-white">{hrName}</div>
              <div className="text-[10px] text-[#b3cde0]">{hrRole || 'HR Portal'}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              setConfirmSignOut(true);
            }}
            className="flex items-center gap-2 text-xs text-[#b3cde0] hover:text-white transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#011f4b] text-white flex flex-col">
            <div className="h-16 flex items-center justify-between px-5 border-b border-[#03396c]">
              <div className="flex items-center gap-3">
                <Image
                  src="/PKII-LOGO1.png"
                  alt="PKII"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-lg object-contain bg-white shrink-0"
                />
                <span className="text-sm font-bold">Philkoei HR</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5 text-[#b3cde0]" />
              </button>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === '/hr'
                    ? pathname === '/hr'
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#005b96] text-white'
                        : 'text-[#b3cde0] hover:bg-[#03396c] hover:text-white'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 text-[#03396c] hover:bg-[#eaf2f8] rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-bold text-[#011f4b] hidden sm:block">
              HR Administration
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                aria-expanded={notifOpen}
                aria-label="Open notifications"
                className="relative p-2 text-[#6497b1] hover:text-[#011f4b] hover:bg-[#eaf2f8] rounded-lg transition-colors"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 px-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 max-w-[80vw] bg-white border border-[#e2e8f0] rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#f1f5f9] text-xs font-bold text-[#011f4b]">
                    Notifications
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-[#f1f5f9]">
                    {notifications.length === 0 && (
                      <p className="px-4 py-6 text-xs text-[#6497b1] text-center">No notifications.</p>
                    )}
                    {notifications.slice(0, 8).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => void handleNotifClick(n)}
                        className={`w-full flex items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[#eaf2f8] ${
                          n.is_read ? '' : 'bg-[#eaf2f8]/50'
                        }`}
                      >
                        {n.type === 'chat' ? (
                          <Send className="w-4 h-4 text-[#005b96] shrink-0 mt-0.5" />
                        ) : n.type === 'approval' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : n.type === 'rejection' ? (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-[#005b96] shrink-0 mt-0.5" />
                        )}
                        <span className="min-w-0">
                          <span className="text-xs font-semibold text-[#011f4b] leading-snug block">
                            {n.title}
                          </span>
                          {n.body && (
                            <span className="text-[11px] text-[#6497b1] mt-0.5 leading-snug block truncate">
                              {n.body}
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-7 h-7 rounded-full bg-[#011f4b] flex items-center justify-center text-[10px] font-bold text-white">
                {hrName
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Sign Out Confirm Modal */}
      {confirmSignOut && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#e2e8f0]">
            <h3 className="text-base font-bold text-[#011f4b]">Sign out?</h3>
            <p className="text-xs text-[#6497b1] mt-1 leading-relaxed">
              You will need to sign in again to continue.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setConfirmSignOut(false)}
                className="px-4 py-2 text-xs font-semibold text-[#6497b1] hover:text-[#011f4b]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="bg-[#011f4b] hover:bg-[#03396c] text-white text-xs font-bold px-5 py-2 rounded-xl transition-colors"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
