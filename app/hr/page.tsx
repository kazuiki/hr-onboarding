"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  Filter,
  Plus,
  X,
  UserPlus,
  ChevronDown,
} from 'lucide-react';
import { useMe } from '@/lib/use-me';
import { formatStartDate } from '@/lib/onboarding';

const DEPARTMENTS = [
  'Finance',
  'Marketing',
  'Human Resource',
  'Information Technology',
  'Engineering',
  'Others',
];

interface EmployeeRow {
  id: string;
  employee_number: string;
  position: string;
  department: string;
  manager_name: string;
  start_date: string;
  status: 'active' | 'completed' | 'archived';
  completion_pct: number;
  email: string;
  full_name: string;
}

interface Stats {
  total: number;
  completed: number;
  inProgress: number;
  pendingReview: number;
}

function StatusBadge({ status }: { status: EmployeeRow['status'] }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Completed
      </span>
    );
  }
  if (status === 'archived') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-400 text-white">
        Archived
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white">
      <Clock className="w-3.5 h-3.5" />
      In Progress
    </span>
  );
}

const EMPTY_FORM = {
  full_name: '',
  id_number: '',
  email: '',
  temp_password: '',
  department: '',
  department_other: '',
  position: '',
  manager_name: '',
  start_date: '',
};

export default function HROverviewPage() {
  const { me, loading: meLoading } = useMe({ allow: ['hr_manager', 'hr_assistant'] });

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, inProgress: 0, pendingReview: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');

  const [addOpen, setAddOpen] = useState(false);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadEmployees = async () => {
    try {
      const res = await fetch('/api/employees', { cache: 'no-store' });
      if (!res.ok) throw new Error('Could not load employees.');
      const data = await res.json();
      setEmployees(data.employees ?? []);
      setStats(data.stats ?? { total: 0, completed: 0, inProgress: 0, pendingReview: 0 });
      setLoadError('');
    } catch {
      setLoadError('Could not load employees. Check the database connection and refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (me) void loadEmployees();
  }, [me]);

  const statCards = useMemo(
    () => [
      { label: 'Total Employee', value: stats.total, icon: Users, chip: 'bg-[#eaf2f8] text-[#005b96]' },
      { label: 'Completed', value: stats.completed, icon: CheckCircle2, chip: 'bg-emerald-50 text-emerald-600' },
      { label: 'In Progress', value: stats.inProgress, icon: Clock, chip: 'bg-amber-50 text-amber-600' },
      { label: 'Pending Review', value: stats.pendingReview, icon: FileText, chip: 'bg-rose-50 text-rose-600' },
    ],
    [stats]
  );

  const departments = useMemo(
    () => ['all', ...Array.from(new Set(employees.map((e) => e.department)))],
    [employees]
  );

  const activeFilterCount = (department !== 'all' ? 1 : 0) + (status !== 'all' ? 1 : 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((e) => {
      const matchesQuery =
        q.length === 0 ||
        e.full_name.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q) ||
        e.employee_number.toLowerCase().includes(q);
      const matchesDept = department === 'all' || e.department === department;
      const matchesStatus = status === 'all' || e.status === status;
      return matchesQuery && matchesDept && matchesStatus;
    });
  }, [employees, query, department, status]);

  const setField =
    (key: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const closeAddModal = () => {
    setAddOpen(false);
    setAddSuccess(null);
    setAddError('');
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setAddError('');
    try {
      const payload = {
        ...form,
        department: form.department === 'Others' ? form.department_other.trim() || 'Others' : form.department,
      };
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || 'Could not create the account.');
        return;
      }
      setAddSuccess(form.full_name.trim());
      setForm(EMPTY_FORM);
      await loadEmployees();
    } catch {
      setAddError('Could not reach the server. Try again.');
    } finally {
      setAdding(false);
    }
  };

  if (meLoading || !me) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#b3cde0] border-t-[#005b96] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Statistics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${stat.chip}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-[#64748b]">{stat.label}</div>
              <div className="text-3xl font-extrabold text-[#011f4b] tabular-nums leading-tight">
                {loading ? '—' : stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search / Filter / Create row */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8] pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by employee, department, or position"
            aria-label="Search by employee, department, or position"
            className="w-full pl-11 pr-4 py-3 text-sm bg-white border border-[#e2e8f0] rounded-xl text-[#011f4b] placeholder:text-[#94a3b8] focus:border-[#005b96] focus:outline-none shadow-sm"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className={`relative inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl border transition-colors shadow-sm ${
              filtersOpen || activeFilterCount > 0
                ? 'bg-[#eaf2f8] border-[#b3cde0] text-[#005b96]'
                : 'bg-white border-[#e2e8f0] text-[#011f4b] hover:border-[#b3cde0]'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-[#005b96] text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setAddSuccess(null);
              setAddError('');
              setAddOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl bg-[#011f4b] hover:bg-[#03396c] text-white transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Create Employee Account
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-sm flex flex-col sm:flex-row gap-3">
          <label className="flex-1 text-xs font-semibold text-[#03396c]">
            <span className="block mb-1.5">Department</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2.5 text-sm font-normal border border-[#b3cde0] rounded-xl text-[#011f4b] bg-white focus:border-[#005b96] focus:outline-none"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === 'all' ? 'All Departments' : d}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1 text-xs font-semibold text-[#03396c]">
            <span className="block mb-1.5">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 text-sm font-normal border border-[#b3cde0] rounded-xl text-[#011f4b] bg-white focus:border-[#005b96] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">In Progress</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setDepartment('all');
                setStatus('all');
                setQuery('');
              }}
              className="px-4 py-2.5 text-xs font-semibold text-[#6497b1] hover:text-[#011f4b] transition-colors whitespace-nowrap"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Employee Data Table */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="bg-[#011f4b] text-white">
                <th className="text-left font-semibold px-5 py-4">Employee</th>
                <th className="text-left font-semibold px-5 py-4">Department</th>
                <th className="text-left font-semibold px-5 py-4">Position</th>
                <th className="text-left font-semibold px-5 py-4">Starting Date</th>
                <th className="text-left font-semibold px-5 py-4">Status</th>
                <th className="text-left font-semibold px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id} className="border-t border-[#e2e8f0] hover:bg-[#f8fafc] transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-[#011f4b] whitespace-nowrap">
                      {emp.full_name}{' '}
                      <span className="font-normal text-[#64748b]">(ID: {emp.employee_number})</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#03396c] whitespace-nowrap">{emp.department}</td>
                  <td className="px-5 py-4 text-[#03396c] whitespace-nowrap">{emp.position}</td>
                  <td className="px-5 py-4 text-[#03396c] whitespace-nowrap tabular-nums">
                    {formatStartDate(emp.start_date)}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <StatusBadge status={emp.status} />
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <Link
                      href={`/hr/employees/${emp.id}`}
                      className="text-xs font-semibold text-[#005b96] hover:text-[#03396c] hover:underline transition-colors"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loadError && <div className="p-6 text-center text-xs text-rose-600">{loadError}</div>}
        {!loadError && !loading && filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-[#6497b1]">
            {employees.length === 0
              ? 'No hires yet. Create the first employee account to begin.'
              : 'No employees match your search.'}
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#e2e8f0] max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={closeAddModal}
              aria-label="Close add employee"
              className="absolute top-4 right-4 p-2 rounded-xl text-[#011f4b] hover:bg-[#f1f5f9] transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={2.5} />
            </button>

            {addSuccess ? (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
                <h3 className="text-lg font-bold text-[#011f4b]">Employee Added</h3>
                <p className="text-sm text-[#6497b1] leading-relaxed">
                  {addSuccess}&apos;s onboarding packet is ready. Share the temporary password
                  so they can sign in and start.
                </p>
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="mt-2 px-6 py-3 text-sm font-semibold bg-[#011f4b] hover:bg-[#03396c] text-white rounded-xl transition-colors shadow-sm"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-[#011f4b] flex items-center justify-center mb-3">
                    <UserPlus className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-[#011f4b]">Add Employee</h3>
                  <p className="text-xs text-[#6497b1] mt-1">
                    Complete the form below to add a new employee
                  </p>
                </div>

                {addError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    {addError}
                  </div>
                )}

                <form onSubmit={handleAddEmployee} className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="add-full-name" className="block text-xs font-bold text-[#011f4b] mb-1.5">
                        Full Name
                      </label>
                      <input
                        id="add-full-name"
                        required
                        value={form.full_name}
                        onChange={setField('full_name')}
                        placeholder="Enter full name"
                        className="w-full px-4 py-3 text-sm border border-[#e2e8f0] rounded-xl text-[#011f4b] placeholder:text-[#94a3b8] focus:border-[#005b96] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="add-id-number" className="block text-xs font-bold text-[#011f4b] mb-1.5">
                        ID Number
                      </label>
                      <input
                        id="add-id-number"
                        value={form.id_number}
                        onChange={setField('id_number')}
                        placeholder="Enter ID No."
                        className="w-full px-4 py-3 text-sm border border-[#e2e8f0] rounded-xl text-[#011f4b] placeholder:text-[#94a3b8] focus:border-[#005b96] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="add-email" className="block text-xs font-bold text-[#011f4b] mb-1.5">
                      Email Address
                    </label>
                    <input
                      id="add-email"
                      required
                      type="email"
                      value={form.email}
                      onChange={setField('email')}
                      placeholder="Enter email address"
                      className="w-full px-4 py-3 text-sm border border-[#e2e8f0] rounded-xl text-[#011f4b] placeholder:text-[#94a3b8] focus:border-[#005b96] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="add-temp-password" className="block text-xs font-bold text-[#011f4b] mb-1.5">
                      Temporary Password
                    </label>
                    <input
                      id="add-temp-password"
                      required
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      value={form.temp_password}
                      onChange={setField('temp_password')}
                      placeholder="Enter temporary password"
                      className="w-full px-4 py-3 text-sm border border-[#e2e8f0] rounded-xl text-[#011f4b] placeholder:text-[#94a3b8] focus:border-[#005b96] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="add-department" className="block text-xs font-bold text-[#011f4b] mb-1.5">
                        Department
                      </label>
                      <div className="relative">
                        <select
                          id="add-department"
                          required
                          value={form.department}
                          onChange={setField('department')}
                          className="w-full appearance-none px-4 py-3 pr-10 text-sm border border-[#e2e8f0] rounded-xl text-[#011f4b] bg-white focus:border-[#005b96] focus:outline-none invalid:text-[#94a3b8]"
                        >
                          <option value="" disabled>
                            Select
                          </option>
                          {DEPARTMENTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b] pointer-events-none" />
                      </div>
                      {form.department === 'Others' && (
                        <input
                          id="add-department-other"
                          required
                          value={form.department_other}
                          onChange={setField('department_other')}
                          placeholder="Specify department"
                          aria-label="Specify department"
                          className="mt-2 w-full px-4 py-3 text-sm border border-[#e2e8f0] rounded-xl text-[#011f4b] placeholder:text-[#94a3b8] focus:border-[#005b96] focus:outline-none"
                        />
                      )}
                    </div>
                    <div>
                      <label htmlFor="add-position" className="block text-xs font-bold text-[#011f4b] mb-1.5">
                        Position
                      </label>
                      <input
                        id="add-position"
                        required
                        value={form.position}
                        onChange={setField('position')}
                        placeholder="Enter position"
                        className="w-full px-4 py-3 text-sm border border-[#e2e8f0] rounded-xl text-[#011f4b] placeholder:text-[#94a3b8] focus:border-[#005b96] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="add-manager" className="block text-xs font-bold text-[#011f4b] mb-1.5">
                        Manager / Supervisor
                      </label>
                      <input
                        id="add-manager"
                        required
                        value={form.manager_name}
                        onChange={setField('manager_name')}
                        placeholder="Enter manager/supervisor"
                        className="w-full px-4 py-3 text-sm border border-[#e2e8f0] rounded-xl text-[#011f4b] placeholder:text-[#94a3b8] focus:border-[#005b96] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="add-start-date" className="block text-xs font-bold text-[#011f4b] mb-1.5">
                        Starting Date
                      </label>
                      <input
                        id="add-start-date"
                        required
                        type="date"
                        value={form.start_date}
                        onChange={setField('start_date')}
                        className="w-full px-4 py-3 text-sm border border-[#e2e8f0] rounded-xl text-[#011f4b] placeholder:text-[#94a3b8] focus:border-[#005b96] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={adding}
                      className="px-6 py-3 text-sm font-semibold bg-[#011f4b] hover:bg-[#03396c] text-white rounded-xl transition-colors shadow-sm disabled:opacity-50"
                    >
                      {adding ? 'Adding...' : 'Add Employee'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
