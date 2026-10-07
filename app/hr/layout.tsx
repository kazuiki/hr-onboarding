"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  ClipboardList,
  History,
  LogOut,
  Menu,
  MessageCircle,
  X,
  Bell,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/hr', label: 'Overview', icon: LayoutDashboard },
  { href: '/hr/templates', label: 'Templates', icon: ClipboardList },
  { href: '/hr/messages', label: 'Messages', icon: MessageCircle },
  { href: '/hr/audit-log', label: 'Audit Log', icon: History },
];

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hrName, setHrName] = useState('HR');
  const [hrRole, setHrRole] = useState('');

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

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-[#011f4b] text-white shrink-0">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-[#03396c]">
          <div className="w-8 h-8 rounded-lg bg-[#005b96] flex items-center justify-center">
            <Building2 className="w-4.5 h-4.5 text-white" />
          </div>
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
          <Link
            href="/login"
            className="flex items-center gap-2 text-xs text-[#b3cde0] hover:text-white transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </Link>
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
                <div className="w-8 h-8 rounded-lg bg-[#005b96] flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
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
            <button className="relative p-2 text-[#6497b1] hover:text-[#011f4b] hover:bg-[#eaf2f8] rounded-lg transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
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
    </div>
  );
}
