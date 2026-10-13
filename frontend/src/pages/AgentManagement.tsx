import React, { useState } from 'react';
import { Plus, Shield, Ban, CheckCircle, Edit3, Key, Copy, Check } from 'lucide-react';
import { Agent, Permission } from '../types';
import { AgentModal } from '../components/AgentModal';

interface AgentManagementProps {
  agents: Agent[];
  permissions: Permission[];
  onRefresh: () => Promise<void>;
  onRegisterAgent: (data: any) => Promise<void>;
  onRevokeAgent: (agentId: string) => Promise<void>;
  onActivateAgent: (agentId: string) => Promise<void>;
  onUpdateBudget: (agentId: string, dailyLimit: number, txLimit: number) => Promise<void>;
}

export const AgentManagement: React.FC<AgentManagementProps> = ({
  agents,
  permissions,
  onRefresh,
  onRegisterAgent,
  onRevokeAgent,
  onActivateAgent,
  onUpdateBudget,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editingBudgetAgent, setEditingBudgetAgent] = useState<Agent | null>(null);
  const [editDailyLimit, setEditDailyLimit] = useState<number>(0);
  const [editTxLimit, setEditTxLimit] = useState<number>(0);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenBudgetModal = (agent: Agent) => {
    setEditingBudgetAgent(agent);
    setEditDailyLimit(agent.daily_limit);
    setEditTxLimit(agent.transaction_limit);
  };

  const handleSaveBudget = async () => {
    if (!editingBudgetAgent) return;
    await onUpdateBudget(editingBudgetAgent.id, editDailyLimit, editTxLimit);
    setEditingBudgetAgent(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Fleet Agent Governance</h2>
          <p className="text-xs text-slate-400">
            Configure system identities, least-privilege permissions, spending caps, and real-time revocation
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Agent</span>
        </button>
      </div>

      {/* Fleet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agents.map((agent) => {
          const isRevoked = agent.status === 'REVOKED';
          return (
            <div
              key={agent.id}
              className={`bg-slate-900/80 border rounded-2xl p-5 backdrop-blur-sm transition relative overflow-hidden flex flex-col justify-between ${
                isRevoked ? 'border-red-900/60 bg-red-950/10' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Agent Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-white">{agent.name}</h3>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          isRevoked
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {agent.status}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-slate-400 block mt-0.5">{agent.id}</span>
                  </div>

                  <span className="text-[10px] font-mono uppercase px-2 py-1 bg-slate-800 text-slate-300 rounded-lg">
                    {agent.type}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 mb-4 min-h-[32px]">
                  {agent.description || 'Autonomous agent connected to financial services.'}
                </p>

                {/* Spending Limits */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 mb-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Daily Limit:</span>
                    <span className="font-mono font-semibold text-white">₹{agent.daily_limit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Per-Tx Limit:</span>
                    <span className="font-mono font-semibold text-white">
                      ₹{agent.transaction_limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/60">
                    <span className="text-slate-400">Spent Today:</span>
                    <span className="font-mono text-blue-400 font-semibold">
                      ₹{agent.spent_today.toLocaleString()} (₹{agent.remaining_today.toLocaleString()} left)
                    </span>
                  </div>
                </div>

                {/* Permissions Badges */}
                <div className="mb-4">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase font-mono">
                    Assigned Permissions
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/50 text-[10px] font-mono"
                      >
                        {perm}
                      </span>
                    ))}
                    {agent.permissions.length === 0 && (
                      <span className="text-[11px] text-red-400 italic">No permissions assigned (zero access)</span>
                    )}
                  </div>
                </div>

                {/* API Key Box */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs mb-4">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <Key className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="font-mono text-slate-400 truncate text-[11px]">{agent.api_key}</span>
                  </div>
                  <button
                    onClick={() => handleCopyKey(agent.api_key)}
                    className="text-slate-400 hover:text-white shrink-0 ml-2"
                    title="Copy API Key"
                  >
                    {copiedKey === agent.api_key ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800/60">
                <button
                  onClick={() => handleOpenBudgetModal(agent)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Budget</span>
                </button>

                {isRevoked ? (
                  <button
                    onClick={() => onActivateAgent(agent.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Activate</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onRevokeAgent(agent.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-lg text-xs font-semibold transition"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Revoke</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Budget Modal */}
      {editingBudgetAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Adjust Spending Limits for {editingBudgetAgent.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">{editingBudgetAgent.id}</p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Daily Limit (₹)</label>
                <input
                  type="number"
                  value={editDailyLimit}
                  onChange={(e) => setEditDailyLimit(Number(e.target.value))}
                  min={0}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Per-Transaction Limit (₹)</label>
                <input
                  type="number"
                  value={editTxLimit}
                  onChange={(e) => setEditTxLimit(Number(e.target.value))}
                  min={0}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingBudgetAgent(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBudget}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white"
              >
                Save Limits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      <AgentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availablePermissions={permissions}
        onRegister={onRegisterAgent}
      />
    </div>
  );
};
