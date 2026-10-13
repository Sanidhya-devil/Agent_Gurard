import React, { useState } from 'react';
import { X, ShieldPlus, Key, Info } from 'lucide-react';
import { Permission } from '../types';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  availablePermissions: Permission[];
  onRegister: (agentData: any) => Promise<void>;
}

export const AgentModal: React.FC<AgentModalProps> = ({
  isOpen,
  onClose,
  availablePermissions,
  onRegister,
}) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('PAYMENT');
  const [riskLevel, setRiskLevel] = useState('LOW');
  const [dailyLimit, setDailyLimit] = useState(50000);
  const [transactionLimit, setTransactionLimit] = useState(10000);
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['payment:create']);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const togglePermission = (permId: string) => {
    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== permId));
    } else {
      setSelectedPermissions([...selectedPermissions, permId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name) {
      alert('Agent ID and Name are required');
      return;
    }
    setLoading(true);
    try {
      await onRegister({
        id: id.trim(),
        name: name.trim(),
        type,
        risk_level: riskLevel,
        daily_limit: Number(dailyLimit),
        transaction_limit: Number(transactionLimit),
        description: description.trim(),
        permissions: selectedPermissions,
      });
      onClose();
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
            <ShieldPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Register Autonomous AI Agent</h3>
            <p className="text-xs text-slate-400">Establish controlled system identity and least-privilege policy</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Agent ID *</label>
              <input
                type="text"
                placeholder="e.g. agent_trade_01"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Agent Name *</label>
              <input
                type="text"
                placeholder="e.g. TradingExecutionAgent"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Agent Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="PAYMENT">PAYMENT</option>
                <option value="LOAN">LOAN</option>
                <option value="REFUND">REFUND</option>
                <option value="INVESTMENT">INVESTMENT</option>
                <option value="SUPPORT">SUPPORT</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Risk Tier</label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Daily Limit (₹)</label>
              <input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                min={0}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Per-Tx Limit (₹)</label>
              <input
                type="number"
                value={transactionLimit}
                onChange={(e) => setTransactionLimit(Number(e.target.value))}
                min={0}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
            <input
              type="text"
              placeholder="Operational responsibilities and scope"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              Granular Permissions (Least-Privilege Policy)
            </label>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
              {availablePermissions.map((perm) => (
                <label
                  key={perm.id}
                  className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                    className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-0 bg-slate-900 cursor-pointer"
                  />
                  <div>
                    <span className="font-mono text-blue-400 font-semibold">{perm.id}</span>
                    <span className="text-slate-500 text-[11px] ml-2">— {perm.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
