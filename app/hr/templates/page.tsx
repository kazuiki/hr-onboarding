"use client";

import { useState } from 'react';
import { Plus, ClipboardList, Check, X } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  department: string;
  description: string;
  tasks: string[];
  is_active: boolean;
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'tpl-eng',
    name: 'Standard Engineering Onboarding',
    department: 'Civil & Environmental Engineering',
    description: 'Forms, government IDs, PRC license, medical exam, first-day guide, and privacy consent.',
    tasks: [
      'Personal Data Sheet',
      'BIR / Tax Forms',
      'Payroll Direct Deposit',
      'Company ID Photo',
      'SSS / PhilHealth / Pag-IBIG',
      'NBI Clearance',
      'PRC License & Transcript',
      'Pre-Employment Medical Exam',
      'First-Day Orientation',
      'Data Privacy Acknowledgement',
    ],
    is_active: true,
  },
  {
    id: 'tpl-fin',
    name: 'Finance & Project Controls Packet',
    department: 'Finance & Project Controls',
    description: 'Core employment packet plus confidentiality and cost-control policy acknowledgements.',
    tasks: [
      'Personal Data Sheet',
      'BIR / Tax Forms',
      'Payroll Direct Deposit',
      'Company ID Photo',
      'Government Benefits IDs',
      'NBI Clearance',
      'Medical Examination',
      'Finance Confidentiality Addendum',
      'First-Day Orientation',
      'Data Privacy Acknowledgement',
    ],
    is_active: true,
  },
];

export default function HRTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    department: '',
    description: '',
    tasks: 'Personal Data Sheet\nCompany ID Photo\nNBI Clearance\nMedical Examination\nData Privacy Acknowledgement',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setTemplates((prev) => [
      {
        id: `tpl-${Date.now()}`,
        name: form.name,
        department: form.department,
        description: form.description,
        tasks: form.tasks.split('\n').map((t) => t.trim()).filter(Boolean),
        is_active: true,
      },
      ...prev,
    ]);
    setOpen(false);
    setForm({
      name: '',
      department: '',
      description: '',
      tasks: 'Personal Data Sheet\nCompany ID Photo\nNBI Clearance\nMedical Examination\nData Privacy Acknowledgement',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#011f4b]">Onboarding Templates</h2>
          <p className="text-sm text-[#6497b1] mt-1">
            Reusable packets of forms, documents, medical instructions, and first-day content.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 bg-[#005b96] hover:bg-[#03396c] text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {templates.map((tpl) => (
          <div key={tpl.id} className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#eaf2f8] flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-[#005b96]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#011f4b]">{tpl.name}</h3>
                  <p className="text-[11px] text-[#6497b1]">{tpl.department}</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
            </div>
            <p className="text-xs text-[#03396c] mb-3">{tpl.description}</p>
            <ul className="space-y-1.5">
              {tpl.tasks.map((task) => (
                <li key={task} className="flex items-center gap-2 text-xs text-[#03396c]">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  {task}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#011f4b]">Create Template</h3>
              <button onClick={() => setOpen(false)} className="text-[#6497b1] hover:text-[#011f4b]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-[#03396c] mb-1">Template Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
              <div>
                <label className="block text-xs font-bold text-[#03396c] mb-1">Description</label>
                <input
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 border border-[#b3cde0] rounded-xl text-[#011f4b]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#03396c] mb-1">
                  Required Tasks (one per line)
                </label>
                <textarea
                  required
                  rows={6}
                  value={form.tasks}
                  onChange={(e) => setForm({ ...form, tasks: e.target.value })}
                  className="w-full p-2.5 border border-[#b3cde0] rounded-xl text-[#011f4b] text-xs font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold text-[#6497b1] px-4 py-2">
                  Cancel
                </button>
                <button type="submit" className="bg-[#005b96] text-white text-xs font-semibold px-5 py-2 rounded-xl">
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
