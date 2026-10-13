import React, { useState } from 'react';
import { Search, Filter, FileText, Code2, ShieldAlert, CheckCircle, XCircle, X } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogViewerProps {
  logs: AuditLog[];
  onRefresh: () => Promise<void>;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ logs, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [filterDecision, setFilterDecision] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filtered = logs.filter((log) => {
    if (filterDecision !== 'ALL' && log.decision !== filterDecision) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.agent_id.toLowerCase().includes(q) ||
        log.event_id.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Immutable Audit Log Trail</h2>
          <p className="text-xs text-slate-400">
            Append-only, tamper-evident audit records capturing every agent request, decision, policy rule, and risk score
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            {['ALL', 'ALLOW', 'DENY', 'HUMAN_APPROVAL'].map((dec) => (
              <button
                key={dec}
                onClick={() => setFilterDecision(dec)}
                className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold transition ${
                  filterDecision === dec
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {dec}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Agent</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4">Evaluation Rationale</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-medium text-blue-400 text-[11px]">
                    {log.event_id}
                  </td>
                  <td className="py-3 px-4 font-mono text-white font-semibold">{log.agent_id}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-mono text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                        log.decision === 'ALLOW'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : log.decision === 'DENY'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {log.decision}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300 text-xs">
                    {log.risk_score}
                  </td>
                  <td className="py-3 px-4 text-slate-300 text-xs max-w-xs truncate" title={log.reason}>
                    {log.reason}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono transition"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No audit records found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl relative">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Audit Event Inspection</h3>
                <span className="text-xs text-blue-400 font-mono">{selectedLog.event_id}</span>
              </div>
            </div>

            <div className="space-y-3 mb-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Agent ID:</span>
                  <span className="text-white font-semibold">{selectedLog.agent_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Action:</span>
                  <span className="text-blue-300 font-semibold">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Decision:</span>
                  <span className="text-emerald-400 font-semibold">{selectedLog.decision}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Risk Score:</span>
                  <span className="text-amber-400 font-semibold">{selectedLog.risk_score}/100</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 font-sans text-xs font-semibold">
                  Policy Evaluation Decision Reason:
                </span>
                <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 font-sans leading-relaxed text-xs">
                  {selectedLog.reason}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 font-sans text-xs font-semibold">
                  Raw Request Payload:
                </span>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 text-[11px] overflow-x-auto max-h-48">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedLog.request_data), null, 2);
                    } catch {
                      return selectedLog.request_data;
                    }
                  })()}
                </pre>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
