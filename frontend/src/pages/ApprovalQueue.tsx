import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle, ShieldAlert, Check, X } from 'lucide-react';
import { ApprovalRequest } from '../types';
import { RiskBadge } from '../components/RiskBadge';

interface ApprovalQueueProps {
  approvals: ApprovalRequest[];
  onDecideApproval: (approvalId: string, decision: 'APPROVED' | 'REJECTED', notes?: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  approvals,
  onDecideApproval,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('PENDING');
  const [operatorNotes, setOperatorNotes] = useState<{ [key: string]: string }>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDecision = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    setLoadingId(id);
    try {
      const notes = operatorNotes[id] || (decision === 'APPROVED' ? 'Approved by operator' : 'Rejected by operator');
      await onDecideApproval(id, decision, notes);
      await onRefresh();
    } catch (err: any) {
      alert(`Decision failed: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  const filtered = approvals.filter((a) => {
    if (filter === 'PENDING') return a.status === 'PENDING';
    if (filter === 'RESOLVED') return a.status !== 'PENDING';
    return true;
  });

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-wide">Dual-Custody Human Approval Queue</h2>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 font-mono animate-pulse">
                {pendingCount} PENDING
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            High-risk transactions flagged by the AI Risk Engine requiring operator verification before settlement
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
          {(['PENDING', 'RESOLVED', 'ALL'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-3 py-1 rounded-md font-mono text-[11px] font-semibold transition ${
                filter === mode
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Approvals Cards */}
      <div className="space-y-4">
        {filtered.map((item) => {
          const isPending = item.status === 'PENDING';
          const isApproved = item.status === 'APPROVED';
          return (
            <div
              key={item.id}
              className={`border rounded-2xl p-5 backdrop-blur-sm transition ${
                isPending
                  ? 'bg-slate-900/90 border-amber-900/40 shadow-lg shadow-amber-950/20'
                  : isApproved
                  ? 'bg-slate-900/60 border-emerald-900/30'
                  : 'bg-slate-900/60 border-red-900/30'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl border mt-0.5 ${
                      isPending
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : isApproved
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white">{item.agent_id}</span>
                      <span className="text-slate-500 text-xs font-mono">• {item.id}</span>
                      <RiskBadge score={item.risk_score} level="HIGH" />
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          isPending
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : isApproved
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-300 mt-1 font-mono">
                      <span>
                        Action: <strong className="text-blue-400">{item.action}</strong>
                      </span>
                      <span>
                        Amount: <strong className="text-white text-sm">₹{item.amount.toLocaleString()}</strong>
                      </span>
                      <span>
                        Recipient: <strong className="text-slate-200">{item.recipient}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 font-mono self-start lg:self-center">
                  Created: {new Date(item.created_at).toLocaleTimeString()}
                </div>
              </div>

              {/* AI Risk Explanation Box */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 mb-4">
                <span className="text-[11px] font-mono font-semibold text-amber-400 uppercase block mb-1">
                  AI Contextual Risk Assessment Rationale:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{item.risk_reasons}</p>
                {item.operator_notes && (
                  <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800 font-mono">
                    Operator Decision Note: {item.operator_notes}
                  </p>
                )}
              </div>

              {/* Operator Action Bar for Pending */}
              {isPending && (
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <input
                    type="text"
                    placeholder="Optional operator verification note..."
                    value={operatorNotes[item.id] || ''}
                    onChange={(e) =>
                      setOperatorNotes({ ...operatorNotes, [item.id]: e.target.value })
                    }
                    className="w-full sm:flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleDecision(item.id, 'REJECTED')}
                      disabled={loadingId === item.id}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-lg text-xs font-bold transition disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject & Block</span>
                    </button>
                    <button
                      onClick={() => handleDecision(item.id, 'APPROVED')}
                      disabled={loadingId === item.id}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 rounded-lg text-xs font-bold transition disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Settle</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium">No approval requests matching filter '{filter}'.</p>
            <p className="text-xs text-slate-600 mt-1">
              High-risk transactions with AI scores &ge; 75 will appear here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
