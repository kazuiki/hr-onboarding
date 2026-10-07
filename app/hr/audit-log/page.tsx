"use client";

import { useEffect, useState } from 'react';
import { History, Shield } from 'lucide-react';
import { useMe } from '@/lib/use-me';

interface AuditRow {
  id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: string | null;
  created_at: string;
}

const PAGE_SIZE = 10;

function detailText(details: string | null): string {
  if (!details) return '';
  try {
    const parsed = JSON.parse(details) as Record<string, unknown>;
    return Object.entries(parsed)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}`)
      .join(' · ');
  } catch {
    return details;
  }
}

export default function HRAuditLogPage() {
  const { me, loading: meLoading } = useMe({ allow: ['hr_manager', 'hr_assistant'] });
  const [items, setItems] = useState<AuditRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadPage = async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit?page=${p}`, { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items ?? []);
      setPage(data.page ?? 1);
      setTotalPages(data.totalPages ?? 1);
      setTotal(data.total ?? 0);
      setLoadError('');
    } catch {
      setLoadError('Could not load the audit log. Check the database connection and refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (me) void loadPage(1);
  }, [me]);

  if (meLoading || !me) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#b3cde0] border-t-[#005b96] rounded-full animate-spin" />
      </div>
    );
  }

  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#011f4b]">Audit Log</h2>
        <p className="text-sm text-[#6497b1] mt-1">
          Immutable compliance trail for invitations, uploads, reviews, privacy acknowledgements, and archival.
        </p>
      </div>

      <div className="bg-[#011f4b] text-[#b3cde0] rounded-2xl p-4 flex items-start gap-3 text-xs">
        <Shield className="w-4 h-4 shrink-0 mt-0.5 text-[#b3cde0]" />
        <p>
          Audit events are append-only. HR users can read this log; employees cannot alter review decisions
          or forge status transitions from the browser.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#eaf2f8] text-[#03396c]">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Timestamp</th>
                <th className="text-left font-semibold px-4 py-3">Actor</th>
                <th className="text-left font-semibold px-4 py-3">Action</th>
                <th className="text-left font-semibold px-4 py-3 hidden md:table-cell">Target</th>
                <th className="text-left font-semibold px-4 py-3 hidden lg:table-cell">Details</th>
              </tr>
            </thead>
            <tbody>
              {items.map((event) => (
                <tr key={event.id} className="border-t border-[#e2e8f0]">
                  <td className="px-4 py-3 text-xs text-[#6497b1] whitespace-nowrap">{event.created_at}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-semibold text-[#011f4b]">{event.actor_name}</div>
                    <div className="text-[11px] text-[#6497b1]">{event.actor_role}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#eaf2f8] text-[#005b96] border border-[#b3cde0]">
                      <History className="w-3 h-3" />
                      {event.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#03396c] hidden md:table-cell">
                    {event.target_type}
                    {event.target_id ? ` · ${event.target_id}` : ''}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#6497b1] hidden lg:table-cell">
                    {detailText(event.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loadError && <div className="p-6 text-center text-xs text-rose-600">{loadError}</div>}
        {!loadError && !loading && items.length === 0 && (
          <div className="p-10 text-center text-sm text-[#6497b1]">No audit events yet.</div>
        )}
        {/* Pagination controls — 10 rows per page */}
        {totalPages > 1 && (
          <div className="p-4 bg-[#f8fafc] border-t border-[#e2e8f0] text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadPage(page - 1)}
                disabled={page <= 1 || loading}
                className="px-3 py-1 rounded border border-[#e2e8f0] text-[#6497b1] disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-[#011f4b] tabular-nums">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => void loadPage(page + 1)}
                disabled={page >= totalPages || loading}
                className="px-3 py-1 rounded border border-[#e2e8f0] text-[#6497b1] disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="mt-1 text-[11px] text-[#6497b1] tabular-nums">
              Showing {start}-{end} of {total} events
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
