"use client";

import { History, Shield } from 'lucide-react';
import { INITIAL_AUDIT_LOGS } from '@/lib/mock-data';

export default function HRAuditLogPage() {
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
              {INITIAL_AUDIT_LOGS.map((event) => (
                <tr key={event.id} className="border-t border-[#e2e8f0]">
                  <td className="px-4 py-3 text-xs text-[#6497b1] whitespace-nowrap">
                    {event.timestamp}
                  </td>
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
                  <td className="px-4 py-3 text-xs text-[#03396c] hidden md:table-cell">{event.target}</td>
                  <td className="px-4 py-3 text-xs text-[#6497b1] hidden lg:table-cell">{event.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
