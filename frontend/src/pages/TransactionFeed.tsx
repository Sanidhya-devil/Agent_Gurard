import React, { useState } from 'react';
import { RefreshCw, Filter, ShieldCheck, ShieldAlert, Clock, IndianRupee } from 'lucide-react';
import { Transaction } from '../types';
import { RiskBadge } from '../components/RiskBadge';

interface TransactionFeedProps {
  transactions: Transaction[];
  onRefresh: () => Promise<void>;
}

export const TransactionFeed: React.FC<TransactionFeedProps> = ({ transactions, onRefresh }) => {
  const [filterDecision, setFilterDecision] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const filtered = transactions.filter((tx) => {
    if (filterDecision === 'ALL') return true;
    return tx.decision === filterDecision;
  });

  return (
    <div className="space-y-5">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Financial Transaction Feed</h2>
          <p className="text-xs text-slate-400">
            Real-time intercept stream of all autonomous financial requests processed through AgentGuard
          </p>
        </div>

        <div className="flex items-center gap-3">
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

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition"
            title="Refresh transactions"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Agent</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Risk Evaluation</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Status & Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-medium text-slate-400 text-[11px]">
                    {tx.id}
                  </td>
                  <td className="py-3 px-4 font-mono text-white font-semibold">
                    {tx.agent_id}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-mono text-[11px]">
                      {tx.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-100 text-sm">
                    ₹{tx.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300 text-[11px] truncate max-w-[140px]">
                    {tx.recipient}
                  </td>
                  <td className="py-3 px-4">
                    <RiskBadge score={tx.risk_score} level={tx.risk_level} />
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                        tx.decision === 'ALLOW'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : tx.decision === 'DENY'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {tx.decision}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <span className="text-[11px] font-mono font-semibold text-slate-300 block">
                        {tx.status}
                      </span>
                      {tx.simulated_tx_id && (
                        <span className="text-[10px] font-mono text-emerald-400 block truncate max-w-[160px]" title={tx.simulated_tx_id}>
                          ✓ {tx.simulated_tx_id}
                        </span>
                      )}
                      {tx.reason && tx.decision !== 'ALLOW' && (
                        <span className="text-[10px] text-red-400 block truncate max-w-[200px]" title={tx.reason}>
                          {tx.reason}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No transactions match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
