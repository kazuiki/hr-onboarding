"use client";

import { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  X,
  Filter,
  Mail,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { MockEmployeeProfile } from '@/lib/mock-data';
import { CURRENT_HR_NAME, logAudit } from '@/lib/db';
import { useDB } from '@/lib/use-db';

export default function HREmployeesPage() {
  const [db, updateDB] = useDB();
  const employees = db.employees;
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    employee_number: '',
    position: '',
    department: 'Civil & Environmental Engineering',
    manager_name: '',
    start_date: '',
  });

  const departments = useMemo(
    () => ['all', ...Array.from(new Set(employees.map((e) => e.department)))],
    [employees]
  );

  const filtered = employees.filter((e) => {
    const matchesQuery =
      e.full_name.toLowerCase().includes(query.toLowerCase()) ||
      e.employee_number.toLowerCase().includes(query.toLowerCase()) ||
      e.position.toLowerCase().includes(query.toLowerCase());
    const matchesDept = department === 'all' || e.department === department;
    return matchesQuery && matchesDept;
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const newEmployee: MockEmployeeProfile = {
      id: `emp-${Date.now()}`,
      email: form.email,
      role: 'employee',
      full_name: form.full_name,
      employee_number: form.employee_number || `PKI-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      position: form.position,
      department: form.department,
      manager_name: form.manager_name,
      start_date: form.start_date,
      access_window_days: 30,
      avatar_url: '',
      status: 'active',
      welcome_message: `Welcome to Philkoei, ${form.full_name}!`,
      completion_percentage: 0,
      has_watched_orientation: false,
    };
    updateDB((prev) =>
      logAudit(
        { ...prev, employees: [newEmployee, ...prev.employees] },
        CURRENT_HR_NAME,
        'hr_manager',
        'INVITE_EMPLOYEE',
        newEmployee.full_name,
        `Invited ${newEmployee.email} with packet for ${newEmployee.start_date || 'TBD'}.`
      )
    );
    setInviteSuccess(true);
    setTimeout(() => {
      setInviteSuccess(false);
      setInviteOpen(false);
      setForm({
        full_name: '',
        email: '',
        employee_number: '',
        position: '',
        department: 'Civil & Environmental Engineering',
        manager_name: '',
        start_date: '',
      });
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#011f4b]">Employee Directory</h2>
          <p className="text-sm text-[#6497b1] mt-1">
            Search, filter, and invite new hires into the onboarding workspace.
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 bg-[#005b96] hover:bg-[#03396c] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Invite Employee
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6497b1]" />
          <input
            type="text"
            placeholder="Search by name, employee number, or position..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#b3cde0] rounded-xl focus:border-[#005b96] text-[#011f4b]"
          />
        </div>
        <div className="relative sm:w-72">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6497b1]" />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#b3cde0] rounded-xl focus:border-[#005b96] text-[#011f4b] bg-white"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === 'all' ? 'All Departments' : d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#eaf2f8] text-[#03396c]">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Employee</th>
                <th className="text-left font-semibold px-4 py-3 hidden md:table-cell">Position</th>
                <th className="text-left font-semibold px-4 py-3 hidden lg:table-cell">Department</th>
                <th className="text-left font-semibold px-4 py-3">Start Date</th>
                <th className="text-left font-semibold px-4 py-3">Progress</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id} className="border-t border-[#e2e8f0] hover:bg-[#f8fafc]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#011f4b] flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                        {emp.full_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <div className="font-semibold text-[#011f4b]">{emp.full_name}</div>
                        <div className="text-[11px] text-[#6497b1]">{emp.employee_number}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#03396c] hidden md:table-cell">{emp.position}</td>
                  <td className="px-4 py-3 text-[#6497b1] hidden lg:table-cell">{emp.department}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-[#03396c]">
                      <Calendar className="w-3 h-3 text-[#005b96]" />
                      {emp.start_date}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <div className="flex-1 bg-[#e2e8f0] rounded-full h-1.5">
                        <div
                          className="h-full bg-[#005b96] rounded-full"
                          style={{ width: `${emp.completion_percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[#011f4b] w-8">
                        {emp.completion_percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-[#6497b1]">
            No employees match your search.
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e2e8f0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#011f4b]">Invite New Employee</h3>
                <p className="text-xs text-[#6497b1] mt-0.5">
                  Creates an onboarding packet and sends a sign-in invitation.
                </p>
              </div>
              <button onClick={() => setInviteOpen(false)} className="text-[#6497b1] hover:text-[#011f4b]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <div className="text-sm font-bold text-emerald-800">Invitation sent</div>
                <div className="text-xs text-emerald-600">
                  The employee will receive a secure sign-in link for the onboarding portal.
                </div>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-3 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#03396c] mb-1">Full Name</label>
                    <input
                      required
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className="w-full p-2.5 border border-[#b3cde0] rounded-xl text-[#011f4b]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#03396c] mb-1">Corporate Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6497b1]" />
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full pl-9 p-2.5 border border-[#b3cde0] rounded-xl text-[#011f4b]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#03396c] mb-1">Employee Number</label>
                    <input
                      value={form.employee_number}
                      onChange={(e) => setForm({ ...form, employee_number: e.target.value })}
                      placeholder="Auto-generated if blank"
                      className="w-full p-2.5 border border-[#b3cde0] rounded-xl text-[#011f4b]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#03396c] mb-1">Start Date</label>
                    <input
                      required
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="w-full p-2.5 border border-[#b3cde0] rounded-xl text-[#011f4b]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#03396c] mb-1">Position</label>
                    <input
                      required
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                      className="w-full p-2.5 border border-[#b3cde0] rounded-xl text-[#011f4b]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#03396c] mb-1">Department</label>
                    <input
                      required
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="w-full p-2.5 border border-[#b3cde0] rounded-xl text-[#011f4b]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#03396c] mb-1">Manager / Supervisor</label>
                    <input
                      required
                      value={form.manager_name}
                      onChange={(e) => setForm({ ...form, manager_name: e.target.value })}
                      className="w-full p-2.5 border border-[#b3cde0] rounded-xl text-[#011f4b]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
                  <button
                    type="button"
                    onClick={() => setInviteOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#6497b1]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#005b96] hover:bg-[#03396c] text-white text-xs font-semibold px-5 py-2 rounded-xl"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
