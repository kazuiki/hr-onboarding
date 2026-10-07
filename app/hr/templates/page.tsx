"use client";

import { useEffect, useState } from 'react';
import { Plus, ClipboardList, Check, X } from 'lucide-react';
import { useMe } from '@/lib/use-me';

interface TemplateTask {
  slug: string;
  title: string;
  category: string;
  required: number;
  display_order: number;
}

interface Template {
  id: string;
  name: string;
  department: string;
  description: string | null;
  is_active: number;
  created_by_name: string | null;
  tasks: TemplateTask[];
}

const DEFAULT_TASK_TEXT =
  'Personal Data Sheet\nCompany ID Photo\nNBI Clearance\nMedical Examination\nData Privacy Acknowledgement';

export default function HRTemplatesPage() {
  const { me, loading: meLoading } = useMe({ allow: ['hr_manager', 'hr_assistant'] });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', department: '', description: '', tasks: DEFAULT_TASK_TEXT });

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/templates', { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTemplates(data.templates ?? []);
      setLoadError('');
    } catch {
      setLoadError('Could not load templates. Check the database connection and refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (me) void loadTemplates();
  }, [me]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || 'Could not save the template.');
        return;
      }
      setOpen(false);
      setForm({ name: '', department: '', description: '', tasks: DEFAULT_TASK_TEXT });
      await loadTemplates();
    } catch {
      setSaveError('Could not reach the server. Try again.');
    } finally {
      setSaving(false);
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

      {loadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">{loadError}</div>
      )}

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
                  <p className="text-[11px] text-[#6497b1]">{tpl.department || 'All departments'}</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {tpl.tasks.length} items
              </span>
            </div>
            {tpl.description && <p className="text-xs text-[#03396c] mb-3">{tpl.description}</p>}
            <ul className="space-y-1.5">
              {tpl.tasks.map((task) => (
                <li key={task.slug} className="flex items-center gap-2 text-xs text-[#03396c]">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  {task.title}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {!loading && !loadError && templates.length === 0 && (
        <div className="p-10 text-center text-sm text-[#6497b1] bg-white rounded-2xl border border-[#e2e8f0]">
          No templates yet. Create the first one to speed up future invites.
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#011f4b]">Create Template</h3>
              <button onClick={() => setOpen(false)} className="text-[#6497b1] hover:text-[#011f4b]" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            {saveError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {saveError}
              </div>
            )}
            <form onSubmit={(e) => void handleCreate(e)} className="space-y-3 text-sm">
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
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-xs font-semibold text-[#6497b1] px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#005b96] text-white text-xs font-semibold px-5 py-2 rounded-xl disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
