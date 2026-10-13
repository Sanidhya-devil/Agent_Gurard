import React, { useState } from 'react';
import {
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  IndianRupee,
  Clock,
  ArrowRight,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  PlaySquare,
  Sparkles,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Cpu,
  Lock,
  Flame,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { RiskBadge } from '../components/RiskBadge';
import { Agent, Transaction, DashboardStats, AnalyticsData } from '../types';

interface DashboardOverviewProps {
  stats: DashboardStats | null;
  analytics: AnalyticsData | null;
  agents: Agent[];
  transactions: Transaction[];
  setActiveTab: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  analytics,
  agents,
  transactions,
  setActiveTab,
}) => {
  const [filterDecision, setFilterDecision] = useState<string>('ALL');
  const [activePipelineStage, setActivePipelineStage] = useState<number | null>(null);
  const [isSimulatingPacket, setIsSimulatingPacket] = useState(false);
  const [packetStage, setPacketStage] = useState<number>(0);

  // Trigger simulated packet flow animation across 7 stages
  const handleSimulateFlow = () => {
    if (isSimulatingPacket) return;
    setIsSimulatingPacket(true);
    setPacketStage(1);

    let stage = 1;
    const interval = setInterval(() => {
      stage += 1;
      if (stage > 7) {
        clearInterval(interval);
        setTimeout(() => {
          setIsSimulatingPacket(false);
          setPacketStage(0);
        }, 1200);
      } else {
        setPacketStage(stage);
      }
    }, 400);
  };

  // Pipeline Stage Definitions
  const pipelineStages = [
    {
      num: 1,
      title: 'Identity',
      short: 'API Key Hash',
      icon: Lock,
      desc: 'Validates cryptographic API key / Bearer token, agent registration & permissions hash.',
      status: 'VERIFIED',
    },
    {
      num: 2,
      title: 'Kill Switch',
      short: 'Global Stop',
      icon: Radio,
      desc: 'Atomic state-store check. If engaged, instant 503 fail-closed block fleet-wide in <1ms.',
      status: 'MONITORING',
    },
    {
      num: 3,
      title: 'Revocation',
      short: 'Active Check',
      icon: ShieldAlert,
      desc: 'Checks agent lifecycle state (ACTIVE vs REVOKED). Revoked agents rejected immediately with 403.',
      status: 'ENFORCED',
    },
    {
      num: 4,
      title: 'RBAC Scope',
      short: 'Permissions',
      icon: Cpu,
      desc: 'Matches action payload against granted capability scopes (e.g. payment:create, loan:disburse).',
      status: 'COMPLIANT',
    },
    {
      num: 5,
      title: 'Budget Vault',
      short: 'Atomic Deduct',
      icon: IndianRupee,
      desc: 'Atomic Redis/Memory reservation. Prevents concurrent race conditions & daily cap overflows.',
      status: 'ACTIVE',
    },
    {
      num: 6,
      title: 'AI Anomaly',
      short: 'Risk Engine',
      icon: Flame,
      desc: 'Contextual risk assessment: 15-min burst velocity, nocturnal hours, new beneficiary flags.',
      status: 'ANALYZING',
    },
    {
      num: 7,
      title: 'Settlement',
      short: 'Core Banking',
      icon: CheckCircle2,
      desc: 'Executes simulated settlement, prompts human approval if risk >= 75, and writes immutable audit hash.',
      status: 'READY',
    },
  ];

  // Decisions data in Linear palette
  const decisionData = analytics?.decisions?.length
    ? analytics.decisions
    : [
        { name: 'Allowed', value: stats?.allowed_actions || 0, color: '#10B981' },
        { name: 'Blocked', value: stats?.blocked_actions || 0, color: '#F43F5E' },
        { name: 'Review', value: stats?.pending_approvals || 0, color: '#F59E0B' },
      ];

  // Risk data in Linear palette
  const riskData = analytics?.risk_tiers?.length
    ? analytics.risk_tiers
    : [
        {
          name: 'Low Risk',
          value: Math.max(0, (stats?.allowed_actions || 0) - (stats?.high_risk_actions || 0)),
          color: '#10B981',
        },
        { name: 'Medium Risk', value: 0, color: '#F59E0B' },
        { name: 'High Risk', value: stats?.high_risk_actions || 0, color: '#F43F5E' },
      ];

  const timelineData = analytics?.timeline?.length
    ? analytics.timeline
    : [
        { time: '10:00', allowed: 1, blocked: 0, high_risk: 0 },
        { time: '11:00', allowed: 2, blocked: 1, high_risk: 0 },
        { time: '12:00', allowed: 4, blocked: 1, high_risk: 1 },
        { time: '13:00', allowed: 3, blocked: 0, high_risk: 1 },
        { time: '14:00', allowed: 5, blocked: 2, high_risk: 2 },
        {
          time: '15:00',
          allowed: stats?.allowed_actions || 4,
          blocked: stats?.blocked_actions || 1,
          high_risk: stats?.high_risk_actions || 1,
        },
      ];

  const totalRiskCount = riskData.reduce((acc, curr) => acc + curr.value, 0);

  // Filtered transactions for quick table inspection
  const filteredTxs = transactions.filter((tx) => {
    if (filterDecision === 'ALL') return true;
    return tx.decision === filterDecision;
  });

  // Linear Minimalist Tooltip
  const MinimalTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#121215] border border-zinc-800 rounded-lg p-2.5 shadow-xl text-xs font-sans">
          <p className="font-mono text-zinc-400 mb-1 border-b border-zinc-800 pb-1">{label}</p>
          <div className="space-y-1 font-mono">
            {payload.map((entry: any, index: number) => (
              <div key={`tooltip-${index}`} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-zinc-300">{entry.name}:</span>
                </span>
                <span className="font-semibold text-white">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header Overview Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-850">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100 tracking-tight">
            Control Plane Overview
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time interception telemetry, fail-closed policy gates, and agent spend velocity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSimulateFlow}
            disabled={isSimulatingPacket}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-750 hover:bg-zinc-800 text-zinc-200 transition-all shadow-sm"
          >
            <Zap className={`w-3.5 h-3.5 text-indigo-400 ${isSimulatingPacket ? 'animate-spin' : ''}`} />
            <span>{isSimulatingPacket ? `Simulating Gate ${packetStage}/7...` : 'Simulate Packet Flow'}</span>
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm"
          >
            <PlaySquare className="w-3.5 h-3.5" />
            <span>Launch Sandbox</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Active Agents"
          value={stats ? `${stats.active_agents}/${stats.total_agents}` : '0/0'}
          subtitle="Autonomous fleet"
          icon={Users}
          variant="blue"
        />
        <StatCard
          title="Allowed Actions"
          value={stats ? stats.allowed_actions.toLocaleString() : '0'}
          subtitle="100% Passed gates"
          icon={CheckCircle}
          variant="emerald"
        />
        <StatCard
          title="Blocked Actions"
          value={stats ? stats.blocked_actions.toLocaleString() : '0'}
          subtitle="Fail-closed blocked"
          icon={XCircle}
          variant="red"
        />
        <StatCard
          title="High Risk"
          value={stats ? stats.high_risk_actions.toLocaleString() : '0'}
          subtitle="Anomaly score ≥ 75"
          icon={AlertTriangle}
          variant="amber"
        />
        <StatCard
          title="Spent Today"
          value={stats ? `₹${stats.total_spent_today.toLocaleString()}` : '₹0'}
          subtitle="Settled transactions"
          icon={IndianRupee}
          variant="purple"
        />
        <StatCard
          title="Pending Reviews"
          value={stats ? stats.pending_approvals.toLocaleString() : '0'}
          subtitle="Dual-custody queue"
          icon={Clock}
          variant="amber"
        />
      </div>

      {/* 3. 7-Stage Zero-Trust Stepper */}
      <div className="linear-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              7-Stage Fail-Closed Governance Pipeline
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">Zero Trust Architecture</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {pipelineStages.map((stage) => {
            const Icon = stage.icon;
            const isSelected = activePipelineStage === stage.num;
            const isPacketActive = packetStage === stage.num;

            return (
              <div
                key={stage.num}
                onClick={() => setActivePipelineStage(isSelected ? null : stage.num)}
                className={`cursor-pointer rounded-xl p-3 border transition-all select-none ${
                  isPacketActive
                    ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500'
                    : isSelected
                    ? 'border-zinc-600 bg-zinc-800/90'
                    : 'border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-850 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-zinc-500">G{stage.num}</span>
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isPacketActive ? 'text-indigo-400' : 'text-zinc-400'
                    }`}
                  />
                </div>
                <div className="font-medium text-xs text-zinc-200">{stage.title}</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{stage.short}</div>

                <div className="mt-2 pt-1.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-600">Status</span>
                  <span
                    className={`font-semibold ${
                      isPacketActive ? 'text-indigo-400 animate-pulse' : 'text-emerald-400'
                    }`}
                  >
                    {isPacketActive ? 'ACTIVE' : stage.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expanded Stage Drawer */}
        {activePipelineStage !== null && (
          <div className="mt-3 p-3.5 rounded-xl border border-zinc-800 bg-[#0E0E12] text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-zinc-200 font-mono">
                Gate {activePipelineStage}: {pipelineStages[activePipelineStage - 1].title} Policy
              </span>
              <button
                onClick={() => setActivePipelineStage(null)}
                className="text-zinc-500 hover:text-zinc-300 font-mono text-[11px]"
              >
                [Dismiss]
              </button>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              {pipelineStages[activePipelineStage - 1].desc}
            </p>
          </div>
        )}
      </div>

      {/* 4. Primary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity Stream Area Chart (2 cols) */}
        <div className="lg:col-span-2 linear-card p-5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="font-semibold text-sm text-zinc-200">Governance Activity Stream</h3>
              <p className="text-xs text-zinc-500">Real-time throughput of evaluated financial actions</p>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Allowed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Blocked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> High Risk
              </span>
            </div>
          </div>

          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaAllowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="areaBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="areaHighRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="#1F1F23" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#52525B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#27272A' }}
                />
                <YAxis
                  stroke="#52525B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#27272A' }}
                  allowDecimals={false}
                />
                <Tooltip content={<MinimalTooltip />} />
                <Area
                  type="monotone"
                  dataKey="allowed"
                  name="Allowed"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#areaAllowed)"
                />
                <Area
                  type="monotone"
                  dataKey="blocked"
                  name="Blocked"
                  stroke="#F43F5E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#areaBlocked)"
                />
                <Area
                  type="monotone"
                  dataKey="high_risk"
                  name="High Risk"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#areaHighRisk)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Risk Score Donut Chart (1 col) */}
        <div className="linear-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-sm text-zinc-200">AI Risk Distribution</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
              Anomaly Model
            </span>
          </div>
          <p className="text-xs text-zinc-500 mb-2">Evaluated transaction risk severity tiers</p>

          <div className="relative h-48 w-full flex items-center justify-center my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={78}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`risk-cell-${index}`} fill={entry.color} stroke="#121215" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<MinimalTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-zinc-100 font-mono">{totalRiskCount}</span>
              <span className="text-[10px] uppercase font-mono text-zinc-500">Total Scored</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2.5 border-t border-zinc-800 text-xs">
            {riskData.map((item, idx) => {
              const pct = totalRiskCount > 0 ? Math.round((item.value / totalRiskCount) * 100) : 0;
              return (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-zinc-300">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-zinc-200 font-semibold">{item.value}</span>
                    <span className="text-[10px] text-zinc-500">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Secondary Row: Decisions & Budget Quotas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Policy Decisions Bar Breakdown (1 col) */}
        <div className="linear-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-sm text-zinc-200">Policy Gate Outcomes</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
              Results
            </span>
          </div>
          <p className="text-xs text-zinc-500 mb-2">Gate approvals vs fail-closed denials</p>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={decisionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1F1F23" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#52525B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#27272A' }}
                />
                <YAxis
                  stroke="#52525B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#27272A' }}
                  allowDecimals={false}
                />
                <Tooltip content={<MinimalTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {decisionData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-zinc-800 text-center font-mono">
            {decisionData.map((d, i) => (
              <div key={i} className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">{d.name}</span>
                <span className="text-xs font-bold text-zinc-200">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fleet Budget Vaults (2 cols) */}
        <div className="lg:col-span-2 linear-card p-5">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h3 className="font-semibold text-sm text-zinc-200">Agent Daily Budget Quotas</h3>
              <p className="text-xs text-zinc-500">Atomic limit deduction preventing over-allocation</p>
            </div>
            <button
              onClick={() => setActiveTab('agents')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <span>Manage Quotas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {agents.map((agent) => {
              const pct =
                agent.daily_limit > 0
                  ? Math.min(100, (agent.spent_today / agent.daily_limit) * 100)
                  : 0;
              const isHigh = pct >= 80;
              const isMed = pct >= 50 && pct < 80;

              return (
                <div
                  key={agent.id}
                  className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-200">{agent.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.2 rounded">
                        {agent.id}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                          agent.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {agent.status}
                      </span>
                    </div>
                    <span className="font-mono text-zinc-300 text-xs">
                      ₹{agent.spent_today.toLocaleString()}{' '}
                      <span className="text-zinc-500">/ ₹{agent.daily_limit.toLocaleString()}</span>
                    </span>
                  </div>

                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHigh ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1.5 font-mono">
                    <span>
                      <strong className={isHigh ? 'text-rose-400' : 'text-zinc-300'}>
                        {pct.toFixed(0)}%
                      </strong>{' '}
                      used
                    </span>
                    <span>
                      Remaining:{' '}
                      <strong className="text-emerald-400 font-medium">
                        ₹{agent.remaining_today.toLocaleString()}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. Live Interceptions Table */}
      <div className="linear-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold text-sm text-zinc-200">Recent Intercepted Financial Operations</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Stream of autonomous agent actions evaluated across gates</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Pills */}
            <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono">
              {['ALL', 'ALLOW', 'DENY', 'HUMAN_APPROVAL'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterDecision(f)}
                  className={`px-2.5 py-1 rounded-md transition ${
                    filterDecision === f
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {f === 'HUMAN_APPROVAL' ? 'APPROVAL' : f}
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <span>Full Feed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-zinc-900/60 text-zinc-400 font-mono border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-3">Agent</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Risk Assessment</th>
                <th className="py-2.5 px-3">Gate Decision</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {filteredTxs.slice(0, 6).map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-850/40 transition">
                  <td className="py-2.5 px-3 font-mono font-medium text-zinc-200">{tx.agent_id}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 font-mono text-[11px]">
                      {tx.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-zinc-100">
                    ₹{tx.amount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <RiskBadge score={tx.risk_score} level={tx.risk_level} />
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`font-mono text-[11px] font-bold ${
                        tx.decision === 'ALLOW'
                          ? 'text-emerald-400'
                          : tx.decision === 'DENY'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {tx.decision}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        tx.status === 'EXECUTED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : tx.status === 'BLOCKED'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredTxs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-zinc-500 font-mono">
                    No transactions recorded matching the selected filter.
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
