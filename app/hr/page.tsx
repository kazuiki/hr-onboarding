"use client";

import Link from 'next/link';
import {
  Users,
  FileSearch,
  AlertCircle,
  TrendingUp,
  Calendar,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import { useDB } from '@/lib/use-db';

export default function HROverviewPage() {
  const [db] = useDB();

  const totalEmployees = db.employees.length;
  const pendingReviews = db.tasks.filter((t) => t.status === 'submitted').length;
  const needsChanges = db.tasks.filter((t) => t.status === 'needs_changes').length;
  const avgCompletion =
    totalEmployees === 0
      ? 0
      : Math.round(db.employees.reduce((sum, e) => sum + e.completion_percentage, 0) / totalEmployees);

  const stats = [
    {
      label: 'Active Onboardings',
      value: totalEmployees,
      icon: Users,
      color: 'bg-[#eaf2f8] text-[#005b96]',
      href: '/hr/employees',
    },
    {
      label: 'Pending Reviews',
      value: pendingReviews,
      icon: FileSearch,
      color: 'bg-amber-50 text-amber-700',
      href: '/hr/reviews',
    },
    {
      label: 'Needs Changes',
      value: needsChanges,
      icon: AlertCircle,
      color: 'bg-rose-50 text-rose-700',
      href: '/hr/reviews',
    },
    {
      label: 'Avg. Completion',
      value: `${avgCompletion}%`,
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-700',
      href: '/hr/employees',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#011f4b]">Dashboard Overview</h2>
        <p className="text-sm text-[#6497b1] mt-1">
          Real-time snapshot of employee onboarding activity and pending reviews.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-2xl border border-[#e2e8f0] p-5 hover:border-[#b3cde0] hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#b3cde0] group-hover:text-[#005b96] transition-colors" />
            </div>
            <div className="text-2xl font-extrabold text-[#011f4b]">{stat.value}</div>
            <div className="text-xs font-medium text-[#6497b1] mt-1">{stat.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Employees */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#011f4b]">Incoming Employees</h3>
            <Link
              href="/hr/employees"
              className="text-xs font-semibold text-[#005b96] hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {db.employees.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#011f4b] flex items-center justify-center text-xs font-bold text-white">
                    {emp.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#011f4b]">
                      {emp.full_name}
                    </div>
                    <div className="text-[11px] text-[#6497b1]">
                      {emp.position} · {emp.department}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-[#011f4b]">
                    {emp.completion_percentage}%
                  </div>
                  <div className="w-16 bg-[#e2e8f0] rounded-full h-1.5 mt-1">
                    <div
                      className="h-full bg-[#005b96] rounded-full"
                      style={{ width: `${emp.completion_percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & Upcoming */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
            <h3 className="text-sm font-bold text-[#011f4b] mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/hr/employees"
                className="flex items-center gap-3 p-3 rounded-xl bg-[#eaf2f8] hover:bg-[#b3cde0]/40 transition-colors"
              >
                <Users className="w-4 h-4 text-[#005b96]" />
                <span className="text-xs font-semibold text-[#011f4b]">
                  Invite New Employee
                </span>
              </Link>
              <Link
                href="/hr/reviews"
                className="flex items-center gap-3 p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#b3cde0] transition-colors"
              >
                <FileSearch className="w-4 h-4 text-[#005b96]" />
                <span className="text-xs font-semibold text-[#011f4b]">
                  Review Submissions
                </span>
              </Link>
              <Link
                href="/hr/templates"
                className="flex items-center gap-3 p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#b3cde0] transition-colors"
              >
                <ClipboardList className="w-4 h-4 text-[#005b96]" />
                <span className="text-xs font-semibold text-[#011f4b]">
                  Manage Templates
                </span>
              </Link>
            </div>
          </div>

          <div className="bg-[#011f4b] rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-[#b3cde0]" />
              <h3 className="text-sm font-bold">Upcoming Start Dates</h3>
            </div>
            <div className="space-y-3">
              {[...db.employees]
                .sort(
                  (a, b) =>
                    new Date(a.start_date).getTime() -
                    new Date(b.start_date).getTime()
                )
                .map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-[#b3cde0]">{emp.full_name}</span>
                  <span className="font-semibold">{emp.start_date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
