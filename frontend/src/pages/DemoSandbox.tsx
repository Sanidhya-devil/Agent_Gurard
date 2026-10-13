import React, { useState } from 'react';
import { Play, CheckCircle, AlertTriangle, XCircle, ShieldAlert, Zap, ArrowRight, CornerDownRight, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import { Agent, Permission } from '../types';

interface DemoSandboxProps {
  agents: Agent[];
  permissions: Permission[];
  onRefreshAll: () => Promise<void>;
  setActiveTab: (tab: string) => void;
}

export const DemoSandbox: React.FC<DemoSandboxProps> = ({
  agents,
  permissions,
  onRefreshAll,
  setActiveTab,
}) => {
  const [activeScenario, setActiveScenario] = useState<number | null>(null);
  const [scenarioResult, setScenarioResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Custom Simulator state
  const [customAgentId, setCustomAgentId] = useState('agent_payment_01');
  const [customAction, setCustomAction] = useState('payment:create');
  const [customAmount, setCustomAmount] = useState(5000);
  const [customRecipient, setCustomRecipient] = useState('merchant_target_01');
  const [customFrequency, setCustomFrequency] = useState(1);
  const [customTime, setCustomTime] = useState('14:30');
  const [customResult, setCustomResult] = useState<any>(null);
  const [customLoading, setCustomLoading] = useState(false);

  const scenarios = [
    {
      id: 1,
      badge: 'Scenario 1 — Normal',
      title: 'Standard Authorized Payment',
      desc: 'PaymentAgent initiates ₹5,000 payment to verified merchant. Checks permission, budget, and low contextual risk.',
      expected: 'ALLOW (Settled in Financial Simulator)',
      color: 'border-emerald-600/40 hover:border-emerald-500 bg-emerald-950/20',
      badgeColor: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
    },
    {
      id: 2,
      badge: 'Scenario 2 — Budget Limit',
      title: 'Dynamic Budget Limit Violation',
      desc: 'PaymentAgent attempts ₹15,000 transaction. Exceeds configured ₹10,000 per-transaction limit.',
      expected: 'DENY / BLOCK (Budget Cap Enforced)',
      color: 'border-red-600/40 hover:border-red-500 bg-red-950/20',
      badgeColor: 'bg-red-900/60 text-red-300 border-red-700/50',
    },
    {
      id: 3,
      badge: 'Scenario 3 — AI Risk',
      title: 'Suspicious AI Activity Anomaly',
      desc: 'Burst frequency (9 rapid transactions) + unverified crypto wallet + nocturnal hour (03:15 AM). AI Risk > 75.',
      expected: 'HUMAN_APPROVAL (Enters Review Queue)',
      color: 'border-amber-600/40 hover:border-amber-500 bg-amber-950/20',
      badgeColor: 'bg-amber-900/60 text-amber-300 border-amber-700/50',
    },
    {
      id: 4,
      badge: 'Scenario 4 — Emergency Stop',
      title: 'Fleet-Wide Fail-Closed Shutdown',
      desc: 'Global emergency kill switch engaged. All subsequent autonomous transactions blocked fail-closed.',
      expected: 'BLOCKED (Global Emergency Stop)',
      color: 'border-red-600/40 hover:border-red-500 bg-red-950/20',
      badgeColor: 'bg-red-900/60 text-red-300 border-red-700/50',
    },
    {
      id: 5,
      badge: 'Scenario 5 — Revocation',
      title: 'Real-Time Agent Revocation',
      desc: 'Revoked agent attempts transaction. Instant 403 AGENT_REVOKED rejection without touching financial API.',
      expected: 'DENY (Agent Revoked)',
      color: 'border-purple-600/40 hover:border-purple-500 bg-purple-950/20',
      badgeColor: 'bg-purple-900/60 text-purple-300 border-purple-700/50',
    },
  ];

  const handleRunScenario = async (scenarioId: number) => {
    setActiveScenario(scenarioId);
    setLoading(true);
    setScenarioResult(null);
    try {
      const res = await api.runDemoScenario(scenarioId);
      setScenarioResult(res);
      await onRefreshAll();
    } catch (err: any) {
      setScenarioResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRunCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomLoading(true);
    setCustomResult(null);
    try {
      const agent = agents.find((a) => a.id === customAgentId);
      const res = await api.authorizeAction(
        {
          agent_id: customAgentId,
          action: customAction,
          amount: Number(customAmount),
          currency: 'INR',
          recipient: customRecipient,
          context: {
            frequency: Number(customFrequency),
            time: customTime,
          },
        },
        agent?.api_key
      );
      setCustomResult({ status: 'SUCCESS', data: res });
      await onRefreshAll();
    } catch (err: any) {
      setCustomResult({ status: 'DENIED', error: err.message });
      await onRefreshAll();
    } finally {
      setCustomLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Sandbox Header */}
      <div>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold text-white tracking-wide">Interactive Demo Sandbox</h2>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Execute and inspect the official PRD test scenarios and test custom autonomous agent actions in real time
        </p>
      </div>

      {/* 5 Preset Demo Scenarios */}
      <div>
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
          Official PRD Section 18 Scenarios (1-Click Run)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((sc) => (
            <div
              key={sc.id}
              className={`border rounded-2xl p-5 backdrop-blur-sm transition flex flex-col justify-between ${sc.color}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${sc.badgeColor}`}>
                    {sc.badge}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white mb-1.5">{sc.title}</h4>
                <p className="text-xs text-slate-300 mb-3 leading-relaxed">{sc.desc}</p>
                <div className="text-[11px] font-mono text-slate-400 mb-4 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Expected:</span>
                  <span className="text-white font-semibold">{sc.expected}</span>
                </div>
              </div>

              <button
                onClick={() => handleRunScenario(sc.id)}
                disabled={loading && activeScenario === sc.id}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/60 rounded-xl text-xs font-bold transition shadow"
              >
                <Play className="w-3.5 h-3.5 text-blue-400 fill-current" />
                <span>
                  {loading && activeScenario === sc.id ? 'Evaluating Pipeline...' : 'Run Scenario'}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Scenario Output Inspector */}
      {scenarioResult && (
        <div className="bg-slate-900 border border-blue-500/40 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
              <h4 className="font-bold text-sm text-white font-mono">
                Execution Result: Scenario {activeScenario} — {scenarioResult.title || 'Evaluated'}
              </h4>
            </div>
            <button
              onClick={() => setScenarioResult(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block mb-1 font-semibold">Request Payload Intercepted:</span>
              <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 text-[11px] overflow-x-auto">
                {JSON.stringify(scenarioResult.request, null, 2)}
              </pre>
            </div>

            <div>
              <span className="text-slate-400 block mb-1 font-semibold">Governance Decision & Trace:</span>
              <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-emerald-300 text-[11px] overflow-x-auto">
                {JSON.stringify(
                  scenarioResult.response || scenarioResult.detail || scenarioResult,
                  null,
                  2
                )}
              </pre>
            </div>
          </div>

          {scenarioResult.response?.approval_id && (
            <div className="mt-4 p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>
                  Transaction flagged as high-risk. Approval request{' '}
                  <strong className="font-mono">{scenarioResult.response.approval_id}</strong> is waiting in the Human Approvals Queue.
                </span>
              </div>
              <button
                onClick={() => setActiveTab('approvals')}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 transition"
              >
                <span>View Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Custom Transaction Tester Playground */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
        <h3 className="font-bold text-sm text-white mb-1">Custom Agent Transaction Simulator</h3>
        <p className="text-xs text-slate-400 mb-5">
          Simulate arbitrary agent requests against the live AgentGuard control plane to test custom budget limits, permissions, or anomaly conditions.
        </p>

        <form onSubmit={handleRunCustom} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Target Agent</label>
              <select
                value={customAgentId}
                onChange={(e) => setCustomAgentId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.id}) [{a.status}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Action / Permission</label>
              <select
                value={customAction}
                onChange={(e) => setCustomAction(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="payment:create">payment:create</option>
                <option value="payment:refund">payment:refund</option>
                <option value="loan:disburse">loan:disburse</option>
                <option value="loan:create">loan:create</option>
                <option value="unauthorized:action">unauthorized:action (Test RBAC Deny)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Amount (₹)</label>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(Number(e.target.value))}
                min={0}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Recipient Identifier</label>
              <input
                type="text"
                value={customRecipient}
                onChange={(e) => setCustomRecipient(e.target.value)}
                placeholder="e.g. merchant_corp or crypto_temp_wallet"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Recent Frequency Spike (Reqs / 15m)
              </label>
              <input
                type="number"
                value={customFrequency}
                onChange={(e) => setCustomFrequency(Number(e.target.value))}
                min={1}
                max={20}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Simulated Time (HH:MM)</label>
              <input
                type="text"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                placeholder="e.g. 03:00 for nocturnal anomaly"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={customLoading}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{customLoading ? 'Authorizing...' : 'Authorize Action Through AgentGuard'}</span>
            </button>
          </div>
        </form>

        {customResult && (
          <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <div className="flex items-center justify-between mb-2">
              <span
                className={`font-bold ${
                  customResult.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                Outcome: {customResult.status}
              </span>
              <button onClick={() => setCustomResult(null)} className="text-slate-500 hover:text-white">
                Clear
              </button>
            </div>
            <pre className="text-slate-300 overflow-x-auto text-[11px]">
              {JSON.stringify(customResult.data || customResult.error, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
