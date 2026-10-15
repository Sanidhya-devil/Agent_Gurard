import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  IndianRupee,
  Clock,
  ArrowRight,
  ChevronDown,
  PlaySquare,
  Zap,
  Lock,
  Radio,
  ShieldAlert,
  Cpu,
  Flame,
  CheckCircle2,
  RotateCcw,
  Inbox,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { RiskBadge } from '../components/RiskBadge';
import { getControlPlaneSharedData, formatINR } from '../data/controlPlaneSharedData';
import { Agent, Transaction, DashboardStats, AnalyticsData } from '../types';

interface DashboardOverviewProps {
  stats: DashboardStats | null;
  analytics: AnalyticsData | null;
  agents: Agent[];
  transactions: Transaction[];
  setActiveTab: (tab: string, filter?: string, search?: string) => void;
  isEmergencyStopped?: boolean;
  onToggleEmergencyStop?: () => Promise<void> | void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  analytics,
  agents,
  transactions,
  setActiveTab,
  isEmergencyStopped = false,
}) => {
  // Shared consistent data source (Item 3)
  const sharedData = getControlPlaneSharedData(isEmergencyStopped);

  // UI state
  const [filterDecision, setFilterDecision] = useState<string>('ALL');
  const [activePipelineStage, setActivePipelineStage] = useState<number | null>(null);
  const [isSimulatingPacket, setIsSimulatingPacket] = useState(false);
  const [packetStage, setPacketStage] = useState<number>(0);
  const [simulateMenuOpen, setSimulateMenuOpen] = useState(false);

  // Live updated timer (Item 4)
  const [secondsAgo, setSecondsAgo] = useState(2);
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo((prev) => (prev >= 15 ? 1 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Demo state toggles (Loading skeleton, Empty state)
  const [demoState, setDemoState] = useState<'normal' | 'loading' | 'empty'>('normal');

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
    }, 450);
  };

  // Gate Icon mapping
  const gateIcons: Record<number, any> = {
    1: Lock,
    2: Radio,
    3: ShieldAlert,
    4: Cpu,
    5: IndianRupee,
    6: Flame,
    7: CheckCircle2,
  };

  // Filtered transactions for table
  const filteredTxs = transactions.filter((tx) => {
    if (filterDecision === 'ALL') return true;
    return tx.decision === filterDecision;
  });

  // Stacked Bar Tooltip (Accessible & Minimalist, Item 6)
  const StackedBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const allowedVal = payload.find((p: any) => p.dataKey === 'allowed')?.value || 0;
      const blockedVal = payload.find((p: any) => p.dataKey === 'blocked')?.value || 0;
      const highRiskVal = payload.find((p: any) => p.dataKey === 'high_risk')?.value || 0;
      const bucketTotal = allowedVal + blockedVal + highRiskVal;

      return (
        <div className="bg-[#121215] border border-zinc-800 rounded-lg p-3 shadow-2xl text-xs font-sans min-w-[170px]">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-2 font-mono">
            <span className="text-zinc-200 font-semibold">{label}</span>
            <span className="text-zinc-400">Total: {bucketTotal}</span>
          </div>
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Allowed:
              </span>
              <span className="font-bold text-white tabular-nums">{allowedVal}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                Blocked:
              </span>
              <span className="font-bold text-white tabular-nums">{blockedVal}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                High Risk:
              </span>
              <span className="font-bold text-white tabular-nums">{highRiskVal}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Pie Chart Tooltip (Item 6)
  const DonutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#121215] border border-zinc-800 rounded-lg p-2.5 shadow-xl text-xs font-mono">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="text-white font-semibold">{data.name}</span>
          </div>
          <div className="text-zinc-300">
            Count: <strong className="text-white tabular-nums">{data.value}</strong> ({data.percentage}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Accessible SVG Pattern Definitions for Color-Blind Accessibility (Item 6) */}
      <svg className="sr-only" aria-hidden="true">
        <defs>
          {/* Diagonal Stripes Pattern for High Risk */}
          <pattern id="pattern-stripes-red" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#EF4444" strokeWidth="3" />
            <line x1="0" y1="0" x2="8" y2="0" stroke="#7F1D1D" strokeWidth="3" />
          </pattern>
          {/* Dots Pattern for Medium Risk */}
          <pattern id="pattern-dots-amber" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.5" fill="#F59E0B" />
          </pattern>
          {/* Solid Pattern for Low Risk */}
          <pattern id="pattern-solid-green" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#10B981" />
          </pattern>
        </defs>
      </svg>

      {/* 1. Header Overview Bar (Item 1: Kill Switch removed from here; Launch Sandbox is the single primary CTA) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100 tracking-tight">
              Control Plane Overview
            </h1>
            {/* Transparent Demo Data Badge */}
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              Demo data
            </span>
            {/* Live Updated Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live · updated {secondsAgo}s ago</span>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time interception telemetry, chained 7-gate fail-closed pipeline, and agent spend velocity.
          </p>
        </div>

        {/* Action Controls: State Switcher + Simulate dropdown + Launch Sandbox */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Direct State Views Switcher (Item 7: Instant access to Normal / Skeleton / Empty) */}
          <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-750 text-xs font-mono shadow-sm">
            <span className="px-2 text-zinc-400 text-xs font-sans">State:</span>
            <button
              onClick={() => setDemoState('normal')}
              className={`px-2.5 py-1 rounded-md transition text-xs font-medium ${
                demoState === 'normal'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setDemoState('loading')}
              className={`px-2.5 py-1 rounded-md transition text-xs font-medium ${
                demoState === 'loading'
                  ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Skeleton
            </button>
            <button
              onClick={() => setDemoState('empty')}
              className={`px-2.5 py-1 rounded-md transition text-xs font-medium ${
                demoState === 'empty'
                  ? 'bg-amber-600 text-white shadow-sm border border-amber-500'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Empty
            </button>
          </div>

          {/* Merged Secondary Dropdown: Simulate */}
          <div className="relative">
            <button
              onClick={() => setSimulateMenuOpen(!simulateMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-750 hover:bg-zinc-800 text-zinc-200 transition-all shadow-sm focus:outline-none"
              aria-expanded={simulateMenuOpen}
              aria-haspopup="true"
            >
              <Zap className={`w-3.5 h-3.5 text-indigo-400 ${isSimulatingPacket ? 'animate-spin' : ''}`} />
              <span>{isSimulatingPacket ? `Simulating Gate ${packetStage}/7...` : 'Simulate'}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {simulateMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-[#121215] border border-zinc-800 shadow-2xl py-1.5 z-30 font-sans">
                <button
                  onClick={() => {
                    setSimulateMenuOpen(false);
                    handleSimulateFlow();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Simulate Packet Flow (G1-G7)</span>
                </button>
                <button
                  onClick={() => {
                    setSimulateMenuOpen(false);
                    setActiveTab('sandbox');
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                >
                  <PlaySquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Run Pre-Configured Scenarios</span>
                </button>
                <button
                  onClick={() => {
                    setSimulateMenuOpen(false);
                    setActiveTab('customers');
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Simulate Test Data Banking Ledger</span>
                </button>

                <div className="border-t border-zinc-800 my-1 pt-1 px-3">
                  <span className="text-xs font-mono text-zinc-400 block mb-1">State Views:</span>
                  <div className="grid grid-cols-3 gap-1 text-xs font-mono">
                    <button
                      onClick={() => { setDemoState('normal'); setSimulateMenuOpen(false); }}
                      className={`px-1.5 py-0.5 rounded text-xs ${demoState === 'normal' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}
                    >
                      Normal
                    </button>
                    <button
                      onClick={() => { setDemoState('loading'); setSimulateMenuOpen(false); }}
                      className={`px-1.5 py-0.5 rounded text-xs ${demoState === 'loading' ? 'bg-indigo-600 text-white font-semibold' : 'text-zinc-400 hover:bg-zinc-800'}`}
                    >
                      Skeleton
                    </button>
                    <button
                      onClick={() => { setDemoState('empty'); setSimulateMenuOpen(false); }}
                      className={`px-1.5 py-0.5 rounded text-xs ${demoState === 'empty' ? 'bg-amber-600 text-white font-semibold' : 'text-zinc-400 hover:bg-zinc-800'}`}
                    >
                      Empty
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Single Primary Action: Launch Sandbox (Item 1) */}
          <button
            onClick={() => setActiveTab('sandbox')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm"
          >
            <PlaySquare className="w-3.5 h-3.5" />
            <span>Launch Sandbox</span>
          </button>
        </div>
      </div>

      {/* Demo State Banner */}
      {demoState === 'loading' && (
        <div className="rounded-xl p-3 bg-indigo-950/40 border border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span className="font-semibold text-white">Skeleton Loading View Active:</span>
            <span>Simulating network latency and skeleton placeholders for all dashboard widgets and telemetry rails.</span>
          </div>
          <button
            onClick={() => setDemoState('normal')}
            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition self-start sm:self-auto shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Back to Live View</span>
          </button>
        </div>
      )}

      {demoState === 'empty' && (
        <div className="rounded-xl p-3 bg-amber-950/40 border border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="font-semibold text-white">Empty State View Active:</span>
            <span>Simulating a freshly installed AgentGuard instance with zero traffic, zero queued approvals, and reset ledgers.</span>
          </div>
          <button
            onClick={() => setDemoState('normal')}
            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium flex items-center gap-1.5 transition self-start sm:self-auto shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Back to Live View</span>
          </button>
        </div>
      )}

      {/* 2. Top Metric Cards (Item 3, 4, 5: Dynamic subtext, clipped sparklines, WCAG AA contrast) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Active Agents"
          value={demoState === 'empty' ? 0 : sharedData.kpis.activeAgents}
          subtitle={demoState === 'empty' ? '0/0 agents online' : sharedData.kpis.activeAgentsSubtitle}
          delta={demoState === 'empty' ? { text: '0 online', isPositive: true } : sharedData.kpis.activeAgentsDelta}
          sparklineData={demoState === 'empty' ? [0, 0, 0, 0] : sharedData.sparklines.activeAgents}
          icon={Users}
          variant="blue"
          isLoading={demoState === 'loading'}
        />
        <StatCard
          title="Allowed Actions"
          value={demoState === 'empty' ? 0 : sharedData.kpis.allowedActions}
          subtitle={demoState === 'empty' ? 'Zero actions executed' : sharedData.kpis.allowedSubtext}
          delta={demoState === 'empty' ? { text: '0 today', isPositive: true } : sharedData.kpis.allowedDelta}
          sparklineData={demoState === 'empty' ? [0, 0, 0, 0] : sharedData.sparklines.allowed}
          icon={CheckCircle}
          variant="emerald"
          isLoading={demoState === 'loading'}
        />
        <StatCard
          title="Blocked Actions"
          value={demoState === 'empty' ? 0 : sharedData.kpis.blockedActions}
          subtitle={demoState === 'empty' ? 'Zero violations' : sharedData.kpis.blockedSubtext}
          delta={demoState === 'empty' ? { text: '0 blocked', isPositive: true } : sharedData.kpis.blockedDelta}
          sparklineData={demoState === 'empty' ? [0, 0, 0, 0] : sharedData.sparklines.blocked}
          icon={XCircle}
          variant="indigo"
          onClick={() => setActiveTab('audit', 'DENY')}
          isLoading={demoState === 'loading'}
        />
        <StatCard
          title="High Risk"
          value={demoState === 'empty' ? 0 : sharedData.kpis.highRiskActions}
          subtitle={demoState === 'empty' ? 'Zero anomalies' : sharedData.kpis.highRiskSubtext}
          delta={demoState === 'empty' ? { text: '0 flagged', isPositive: true } : sharedData.kpis.highRiskDelta}
          sparklineData={demoState === 'empty' ? [0, 0, 0, 0] : sharedData.sparklines.highRisk}
          icon={AlertTriangle}
          variant="red"
          onClick={() => setActiveTab('audit', 'ALL', 'Risk')}
          isLoading={demoState === 'loading'}
        />
        <StatCard
          title="Spent Today"
          value={demoState === 'empty' ? '₹0' : sharedData.kpis.spentTodayFormatted}
          subtitle={demoState === 'empty' ? '₹0 allocated' : sharedData.kpis.spentTodaySubtext}
          delta={demoState === 'empty' ? { text: '0% used', isPositive: true } : sharedData.kpis.spentTodayDelta}
          sparklineData={demoState === 'empty' ? [0, 0, 0, 0] : sharedData.sparklines.spent}
          icon={IndianRupee}
          variant="purple"
          isLoading={demoState === 'loading'}
        />
        <StatCard
          title="Pending Reviews"
          value={demoState === 'empty' ? 0 : sharedData.kpis.pendingReviews}
          subtitle={demoState === 'empty' ? 'Queue empty' : sharedData.kpis.pendingReviewsSubtext}
          delta={demoState === 'empty' ? { text: '0 pending', isPositive: true } : sharedData.kpis.pendingReviewsDelta}
          sparklineData={demoState === 'empty' ? [0, 0, 0, 0] : sharedData.sparklines.pendingReviews}
          icon={Clock}
          variant="amber"
          onClick={() => setActiveTab('approvals')}
          isLoading={demoState === 'loading'}
        />
      </div>

      {/* 3. 7-Stage Chained Pipeline Funnel Strip (Item 2: Consistent 6-row layout with equal height across all cards) */}
      <div className="linear-card p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
              7-Stage Fail-Closed Governance Funnel
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              Chained Pipeline
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {demoState === 'loading'
              ? 'Loading pipeline metrics...'
              : demoState === 'empty'
              ? 'Total Inflow: 0 reqs · Final Settled: 0'
              : `Total Inflow: ${sharedData.pipelineGates[0].inCount} reqs · Final Settled: ${sharedData.pipelineGates[6].passedCount}`}
          </span>
        </div>

        {/* Chained Funnel Cards with Strict 6-Row Layout (Item 2) */}
        {demoState === 'loading' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 items-stretch animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <div
                key={num}
                className="rounded-xl p-3 border border-zinc-800/80 bg-zinc-900/60 flex flex-col justify-between h-44 space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-3 w-6 bg-zinc-800 rounded" />
                    <div className="h-3.5 w-3.5 bg-zinc-800 rounded-full" />
                  </div>
                  <div className="h-4 w-20 bg-zinc-800 rounded mb-1.5" />
                  <div className="h-3 w-14 bg-zinc-800 rounded mb-3" />
                  <div className="border-t border-zinc-800 pt-2 space-y-1.5">
                    <div className="h-3 w-full bg-zinc-800 rounded" />
                    <div className="h-2.5 w-16 bg-zinc-800 rounded" />
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full mt-2" />
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-800/80">
                  <div className="h-4 w-full bg-zinc-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : demoState === 'empty' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 items-stretch">
            {sharedData.pipelineGates.map((gate) => {
              const Icon = gateIcons[gate.num] || CheckCircle2;
              return (
                <div
                  key={gate.num}
                  className="rounded-xl p-3 border border-zinc-800/90 bg-zinc-900/40 flex flex-col justify-between h-full min-h-0 min-w-0"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-zinc-500 tabular-nums">G{gate.num}</span>
                      <Icon className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                    </div>
                    <div className="mb-2">
                      <div className="font-semibold text-xs text-zinc-300 truncate">{gate.title}</div>
                      <div className="text-xs text-zinc-500 font-mono truncate">{gate.short}</div>
                    </div>
                    <div className="border-t border-zinc-800/80 pt-1.5 space-y-1">
                      <div className="text-xs font-mono tabular-nums whitespace-nowrap text-zinc-400 flex items-center justify-between">
                        <span><strong>0</strong> in</span>
                        <span>·</span>
                        <span>0 blocked</span>
                      </div>
                      <div className="text-xs font-mono tabular-nums whitespace-nowrap text-zinc-500">
                        -- ms avg
                      </div>
                      <div className="space-y-1 pt-0.5">
                        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                          <span>Passed: 0</span>
                          <span>(0%)</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                          <div className="h-full bg-zinc-700" style={{ width: '0%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-zinc-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-500 text-xs">Status</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-semibold border text-zinc-400 bg-zinc-800/40 border-zinc-700">
                        IDLE
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                      <span>Drop</span>
                      <span>--</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 items-stretch">
          {sharedData.pipelineGates.map((gate) => {
            const Icon = gateIcons[gate.num] || CheckCircle2;
            const isSelected = activePipelineStage === gate.num;
            const isPacketActive = packetStage === gate.num;

            // Semantic status state styling
            const stateStyles = {
              healthy: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
              degraded: 'text-amber-400 bg-amber-950/60 border-amber-800',
              tripped: 'text-rose-400 bg-rose-950/60 border-rose-800',
            }[gate.state];

            const retentionPct = gate.inCount > 0 ? Math.round((gate.passedCount / gate.inCount) * 100) : 0;

            return (
              <div
                key={gate.num}
                onClick={() => setActiveTab('audit', 'ALL', gate.title)}
                className={`cursor-pointer rounded-xl p-3 border transition-all select-none flex flex-col justify-between h-full min-h-0 min-w-0 ${
                  isPacketActive
                    ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500 shadow-lg shadow-indigo-950/50'
                    : isSelected
                    ? 'border-zinc-600 bg-zinc-800/90'
                    : 'border-zinc-800/90 bg-zinc-900/50 hover:bg-zinc-850 hover:border-zinc-700'
                }`}
                title={`Click to inspect Gate ${gate.num} (${gate.title}) audit logs`}
              >
                {/* Top Half: Rows 1 to 5 */}
                <div>
                  {/* Row 1: gate id + icon */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-zinc-300 tabular-nums">G{gate.num}</span>
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isPacketActive ? 'text-indigo-400' : 'text-zinc-300'
                      }`}
                    />
                  </div>

                  {/* Row 2: name + subtitle (Item 5: 12px min, text-zinc-100 & text-zinc-400) */}
                  <div className="mb-2">
                    <div className="font-semibold text-xs text-zinc-100 truncate">{gate.title}</div>
                    <div className="text-xs text-zinc-400 font-mono truncate">{gate.short}</div>
                  </div>

                  {/* Divider for Metric Rows */}
                  <div className="border-t border-zinc-800/80 pt-1.5 space-y-1">
                    {/* Row 3: "{in} in · {blocked} blocked" (never wrap, tabular-nums) */}
                    <div className="text-xs font-mono tabular-nums whitespace-nowrap text-zinc-300 flex items-center justify-between">
                      <span><strong className="text-zinc-100">{gate.inCount}</strong> in</span>
                      <span>·</span>
                      <span className={gate.blockedCount > 0 ? 'text-indigo-300 font-semibold' : 'text-zinc-400'}>
                        {gate.blockedCount} blocked
                      </span>
                    </div>

                    {/* Row 4: latency on its own line (e.g. "2.1ms avg") */}
                    <div className="text-xs font-mono tabular-nums whitespace-nowrap text-zinc-400">
                      {gate.latencyMs}ms avg
                    </div>

                    {/* Row 5: "Passed: {n} ({pct}%)" + progress bar */}
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center justify-between text-xs font-mono tabular-nums whitespace-nowrap text-zinc-300">
                        <span>Passed: <strong className="text-emerald-400">{gate.passedCount}</strong></span>
                        <span className="text-zinc-400">({retentionPct}%)</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            gate.state === 'tripped'
                              ? 'bg-rose-500'
                              : gate.state === 'degraded'
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                          style={{ width: `${retentionPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Rows: Status badge & Drop-off (Item 3 & 4: stacked on 2 lines so nothing touches or crosses border at 1440px & 1920px) */}
                <div className="mt-2.5 pt-2 border-t border-zinc-800/80 space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400 text-xs">Status</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-semibold border leading-tight ${stateStyles}`}>
                      {gate.state.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-zinc-400 text-xs">Drop</span>
                    <span className="text-xs font-medium text-zinc-300">
                      {gate.dropOffText}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* 4. Primary Charts Grid (Item 5, 6: Stacked Bar Chart & Donut Verification) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Governance Activity Stream: Stacked Bar Chart in 15-min buckets */}
        <div
          className="lg:col-span-2 linear-card p-5 flex flex-col justify-between"
          aria-label="Stacked bar chart showing governance activity in 15-minute intervals, with 78 allowed, 26 blocked, and 14 high risk actions. Total: 104."
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-zinc-100">Governance Activity Stream</h3>
                <span className="text-xs font-mono text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                  15-min buckets
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Exact evaluated throughput • Discrete non-interpolated counts
              </p>
            </div>

            {/* Accessible Legend with Pattern and Color Swatches (Item 5 & 6) */}
            <div className="flex items-center gap-3.5 text-xs font-mono text-zinc-300 flex-wrap">
              <span className="flex items-center gap-1.5" title="Cleared all policy gates">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                Allowed (78)
              </span>
              <span className="flex items-center gap-1.5" title="Fail-closed interception">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400" />
                Blocked (26)
              </span>
              <span className="flex items-center gap-1.5" title="Anomaly score >= 75">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                High Risk (14)
              </span>
            </div>
          </div>

          {/* Chart Display / Loading Skeleton / Empty State */}
          <div className="h-64 w-full mt-2 relative">
            {demoState === 'loading' ? (
              <div className="w-full h-full flex items-end justify-between gap-2 p-4 bg-zinc-900/40 rounded-xl animate-pulse">
                {[45, 70, 35, 85, 50, 90, 65, 40, 80, 55, 95, 45].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full bg-zinc-800 rounded-t" style={{ height: `${h}%` }} />
                    <div className="w-5 h-2 bg-zinc-850 rounded" />
                  </div>
                ))}
              </div>
            ) : demoState === 'empty' ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800 text-center p-4">
                <span className="text-xs font-mono text-zinc-400 mb-2">No activity recorded for this period</span>
                <button
                  onClick={handleSimulateFlow}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium"
                >
                  Generate Activity
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sharedData.activityStream}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  barCategoryGap="18%"
                >
                  <CartesianGrid strokeDasharray="2 2" stroke="#1F1F23" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="#A1A1AA"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#27272A' }}
                  />
                  <YAxis
                    domain={[0, 'auto']}
                    allowDecimals={false}
                    stroke="#A1A1AA"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#27272A' }}
                  />
                  <Tooltip content={<StackedBarTooltip />} />
                  {/* Allowed Series: Emerald Green */}
                  <Bar
                    dataKey="allowed"
                    name="Allowed"
                    stackId="governance"
                    fill="#10B981"
                    radius={[0, 0, 0, 0]}
                  />
                  {/* Blocked Series: Lightened Violet / Indigo (WCAG AA > 4.5:1) */}
                  <Bar
                    dataKey="blocked"
                    name="Blocked"
                    stackId="governance"
                    fill="#818CF8"
                    radius={[0, 0, 0, 0]}
                  />
                  {/* High Risk Series: Amber */}
                  <Bar
                    dataKey="high_risk"
                    name="High Risk"
                    stackId="governance"
                    fill="#F59E0B"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="sr-only">
            Summary: Across 12 15-minute buckets from 10:00 to 12:45, a total of 78 transactions were allowed, 26 blocked by fail-closed policy, and 14 flagged high risk, with a peak activity burst at 11:30. Total evaluated inflow: 104.
          </div>
        </div>

        {/* AI Risk Score Donut Chart: Color-blind safe with direct labels (Item 6) */}
        <div
          className="linear-card p-5 flex flex-col justify-between"
          aria-label="Donut chart showing evaluated transaction risk severity distribution: 65% Low Risk, 21% Medium Risk, 14% High Risk. Total: 104."
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-sm text-zinc-100">AI Risk Distribution</h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              Anomaly Model
            </span>
          </div>
          <p className="text-xs text-zinc-400 mb-2">Evaluated transaction risk severity tiers</p>

          {demoState === 'loading' ? (
            <div className="w-full flex-1 flex flex-col justify-between animate-pulse">
              <div className="h-48 w-full flex items-center justify-center my-1">
                <div className="w-36 h-36 rounded-full border-8 border-zinc-800/80 border-t-indigo-500/60 animate-spin" />
              </div>
              <div className="space-y-2 pt-2.5 border-t border-zinc-800">
                <div className="h-3.5 bg-zinc-800 rounded w-full" />
                <div className="h-3.5 bg-zinc-800 rounded w-5/6" />
                <div className="h-3.5 bg-zinc-800 rounded w-4/6" />
              </div>
            </div>
          ) : demoState === 'empty' ? (
            <div className="w-full flex-1 flex flex-col items-center justify-center py-8 text-center border border-dashed border-zinc-800 rounded-xl my-2">
              <ShieldAlert className="w-8 h-8 text-zinc-600 mb-2" />
              <span className="text-xs font-mono text-zinc-300 font-semibold">Zero Risk Evaluations</span>
              <span className="text-xs text-zinc-500 mt-0.5">No anomalies evaluated yet</span>
            </div>
          ) : (
            <>
              <div className="relative h-48 w-full flex items-center justify-center my-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sharedData.riskTiers}
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={78}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {sharedData.riskTiers.map((entry, index) => (
                        <Cell
                          key={`risk-cell-${index}`}
                          fill={entry.color}
                          stroke="#121215"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-zinc-100 font-mono tabular-nums">{sharedData.totalScored}</span>
                  <span className="text-xs uppercase font-mono text-zinc-400">Total Scored</span>
                </div>
              </div>

              {/* Color-blind safe direct text labels with counts and percentages (Item 5 & 6) */}
              <div className="space-y-2 pt-2.5 border-t border-zinc-800 text-xs">
                {sharedData.riskTiers.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                      <span className="text-zinc-200 font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      <span className="text-zinc-100 font-bold">{item.value}</span>
                      <span className="text-xs text-zinc-400">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="sr-only">
            Donut chart summary: 104 total evaluated transactions. 68 low risk (65%), 22 medium risk (21%), and 14 high risk (14%).
          </div>
        </div>
      </div>

      {/* 5. Secondary Row: Policy Outcomes & Budget Quotas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Policy Decisions Bar Breakdown (1 col) */}
        <div className="linear-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-sm text-zinc-100">Policy Gate Outcomes</h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              Results
            </span>
          </div>
          <p className="text-xs text-zinc-400 mb-2">Gate approvals vs fail-closed denials</p>

          <div className="h-44 w-full">
            {demoState === 'loading' ? (
              <div className="h-full w-full flex items-end justify-around p-3 bg-zinc-900/30 rounded-xl animate-pulse">
                <div className="w-16 h-36 bg-zinc-800 rounded-t" />
                <div className="w-16 h-20 bg-zinc-800 rounded-t" />
                <div className="w-16 h-12 bg-zinc-800 rounded-t" />
              </div>
            ) : demoState === 'empty' ? (
              <div className="h-full w-full flex flex-col items-center justify-center p-3 text-center border border-dashed border-zinc-800 rounded-xl">
                <span className="text-xs font-mono text-zinc-400 font-semibold">Zero Policy Outcomes</span>
                <span className="text-xs text-zinc-500 mt-0.5">Awaiting agent operations</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sharedData.policyOutcomes} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1F1F23" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#A1A1AA"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#27272A' }}
                  />
                  <YAxis
                    stroke="#A1A1AA"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#27272A' }}
                    allowDecimals={false}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {sharedData.policyOutcomes.map((entry, index) => (
                      <Cell key={`policy-cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-zinc-800 text-center font-mono">
            {sharedData.policyOutcomes.map((d, i) => (
              <div key={i} className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-xs text-zinc-400 block">{d.name}</span>
                <span className="text-xs font-bold text-zinc-100 tabular-nums">
                  {demoState === 'loading' ? '--' : demoState === 'empty' ? 0 : d.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Fleet Budget Vaults (2 cols) */}
        <div className="lg:col-span-2 linear-card p-5">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h3 className="font-semibold text-sm text-zinc-100">Agent Daily Budget Quotas</h3>
              <p className="text-xs text-zinc-400">Atomic limit deduction preventing over-allocation</p>
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
            {demoState === 'loading' ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2.5 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 bg-zinc-800 rounded" />
                    <div className="h-4 w-24 bg-zinc-800 rounded" />
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full" />
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-16 bg-zinc-800 rounded" />
                    <div className="h-3 w-28 bg-zinc-800 rounded" />
                  </div>
                </div>
              ))
            ) : demoState === 'empty' ? (
              <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl">
                <span className="text-xs font-mono text-zinc-300 font-semibold block mb-1">
                  All Daily Budget Quotas Available
                </span>
                <span className="text-xs text-zinc-500">
                  Zero agent spend incurred today (₹0 / ₹1,20,000 total limits)
                </span>
              </div>
            ) : (
              agents.map((agent) => {
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
                        <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                          {agent.id}
                        </span>
                        <span
                          className={`text-xs font-mono px-1.5 py-0.5 rounded font-semibold ${
                            agent.status === 'ACTIVE'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {agent.status}
                        </span>
                      </div>
                      <span className="font-mono text-zinc-200 text-xs tabular-nums">
                        {formatINR(agent.spent_today)}{' '}
                        <span className="text-zinc-400">/ {formatINR(agent.daily_limit)}</span>
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

                    <div className="flex justify-between items-center text-xs text-zinc-400 mt-1.5 font-mono">
                      <span>
                        <strong className={isHigh ? 'text-rose-400' : 'text-zinc-200'}>
                          {pct.toFixed(0)}%
                        </strong>{' '}
                        used
                      </span>
                      <span>
                        Remaining:{' '}
                        <strong className="text-emerald-400 font-medium tabular-nums">
                          {formatINR(agent.remaining_today)}
                        </strong>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 6. Live Interceptions Table */}
      <div className="linear-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold text-sm text-zinc-100">Recent Intercepted Financial Operations</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Stream of autonomous agent actions evaluated across gates</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Pills */}
            <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono">
              {['ALL', 'ALLOW', 'DENY', 'HUMAN_APPROVAL'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterDecision(f)}
                  className={`px-2.5 py-1 rounded-md transition ${
                    filterDecision === f
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200'
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
            <thead className="bg-zinc-900/60 text-zinc-300 font-mono border-b border-zinc-800">
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
              {demoState === 'loading' ? (
                [1, 2, 3, 4, 5, 6].map((i) => (
                  <tr key={`skel-tx-${i}`} className="animate-pulse">
                    <td className="py-3 px-3">
                      <div className="h-4 w-28 bg-zinc-800 rounded" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-4 w-24 bg-zinc-800 rounded" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-4 w-16 bg-zinc-800 rounded" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-4 w-20 bg-zinc-800 rounded" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-4 w-16 bg-zinc-800 rounded" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-4 w-20 bg-zinc-800 rounded" />
                    </td>
                  </tr>
                ))
              ) : demoState === 'empty' ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-zinc-400 font-mono">
                    <Inbox className="w-7 h-7 mx-auto mb-2 text-zinc-600" />
                    <span className="block font-semibold text-zinc-300">No transactions recorded</span>
                    <span className="text-xs text-zinc-500 mt-1 block">
                      Autonomous agent financial requests will appear here in real time.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredTxs.slice(0, 6).map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-850/40 transition">
                    <td className="py-2.5 px-3 font-mono font-medium text-zinc-200">{tx.agent_id}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 font-mono text-xs">
                        {tx.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-zinc-100 tabular-nums">
                      {formatINR(tx.amount)}
                    </td>
                    <td className="py-2.5 px-3">
                      <RiskBadge score={tx.risk_score} level={tx.risk_level} />
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-mono text-xs font-bold ${
                          tx.decision === 'ALLOW'
                            ? 'text-emerald-400'
                            : tx.decision === 'DENY'
                            ? 'text-indigo-300' // Lightened Indigo for Blocked (WCAG AA > 4.5:1)
                            : 'text-amber-400'
                        }`}
                      >
                        {tx.decision}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-xs font-mono px-2 py-0.5 rounded ${
                          tx.status === 'EXECUTED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : tx.status === 'BLOCKED'
                            ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
              {demoState === 'normal' && filteredTxs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-zinc-400 font-mono">
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
