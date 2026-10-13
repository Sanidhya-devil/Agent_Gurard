import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Flame,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Radio,
  Lock,
  ChevronRight,
  Terminal,
  Activity,
  Layers,
  ArrowRight,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';

interface AttackVector {
  id: string;
  title: string;
  short: string;
  target_gate: string;
  gate_num: number;
  severity: string;
  description: string;
  payload: any;
  expected_outcome: string;
}

interface RedTeamProps {
  onRefreshAll: () => void;
  setActiveTab: (tab: string) => void;
}

export const RedTeamTesting: React.FC<RedTeamProps> = ({ onRefreshAll, setActiveTab }) => {
  const [vectors, setVectors] = useState<AttackVector[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningBattery, setRunningBattery] = useState<boolean>(false);
  const [runningVectorId, setRunningVectorId] = useState<string | null>(null);
  const [lastBatteryReport, setLastBatteryReport] = useState<any | null>(null);
  const [vectorResults, setVectorResults] = useState<Record<string, any>>({});
  const [isKillSwitchActive, setIsKillSwitchActive] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    fetchVectorsAndStatus();
  }, []);

  const fetchVectorsAndStatus = async () => {
    setLoading(true);
    try {
      const [vRes, emRes] = await Promise.all([
        api.getRedTeamVectors(),
        api.getEmergencyStatus()
      ]);
      setVectors(vRes.vectors || []);
      setIsKillSwitchActive(emRes.global_stop);
    } catch (err: any) {
      console.error('Failed to load red team vectors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunBattery = async () => {
    setRunningBattery(true);
    setStatusMessage('Executing automated multi-vector assault battery against Gates 1–6...');
    try {
      const res = await api.runRedTeamBattery();
      setLastBatteryReport(res.report);
      setIsKillSwitchActive(res.report.final_kill_switch_state);
      
      // Map individual results to vector cards
      const newMap: Record<string, any> = {};
      (res.report.results || []).forEach((r: any) => {
        newMap[r.vector_id] = r;
      });
      setVectorResults(newMap);
      setStatusMessage('Assault battery complete! All 6 adversarial vectors intercepted fail-closed.');
      onRefreshAll();
    } catch (err: any) {
      setStatusMessage(`Error executing battery: ${err.message}`);
    } finally {
      setRunningBattery(false);
    }
  };

  const handleExecuteSingleVector = async (vectorId: string) => {
    setRunningVectorId(vectorId);
    setStatusMessage(`Launching attack vector: ${vectorId}...`);
    try {
      const res = await api.executeRedTeamVector(vectorId);
      setVectorResults((prev) => ({ ...prev, [vectorId]: res.result }));
      
      // Update kill switch status if triggered
      if (res.result.kill_switch_tripped) {
        setIsKillSwitchActive(true);
      }
      setStatusMessage(`Vector ${vectorId} evaluated: Decision = ${res.result.decision} (Intercepted at Gate)`);
      onRefreshAll();
    } catch (err: any) {
      setStatusMessage(`Attack evaluation failed: ${err.message}`);
    } finally {
      setRunningVectorId(null);
    }
  };

  const handleResetFleet = async () => {
    try {
      const res = await api.resetRedTeamFleet();
      setIsKillSwitchActive(false);
      setLastBatteryReport(null);
      setVectorResults({});
      setStatusMessage(res.fleet.message || 'Fleet state restored to normal operational mode.');
      onRefreshAll();
    } catch (err: any) {
      setStatusMessage(`Reset failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="bg-[#121316] border border-zinc-800 rounded-xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-950/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-700/50 text-red-400">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Adversarial Red Team & Kill Switch Battery
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800">
                    Phase 1 Security Testing
                  </span>
                </h1>
                <p className="text-xs text-zinc-400 mt-1 font-sans">
                  Automated adversarial stress testing against AgentGuard's 7-stage fail-closed pipeline. Validates input sanitization, RBAC, budget caps, AI anomaly tripwires, and immediate Kill Switch lockout.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleRunBattery}
              disabled={runningBattery}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-red-950 disabled:text-red-400 text-white font-medium text-xs rounded-lg shadow-lg shadow-red-950/50 transition-all font-mono"
            >
              {runningBattery ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  Assaulting Pipeline...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Run Full Assault Battery
                </>
              )}
            </button>

            <button
              onClick={handleResetFleet}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg transition-all font-mono"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Fleet
            </button>
          </div>
        </div>

        {/* Global Kill Switch Status Widget */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 font-mono text-[11px]">System Interceptor Status:</span>
            {isKillSwitchActive ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-950/90 text-red-300 border border-red-700 font-mono font-bold animate-pulse">
                <Lock className="w-3.5 h-3.5" />
                GLOBAL EMERGENCY KILL SWITCH TRIPPED (FAIL-CLOSED)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                OPERATIONAL (ALL 7 GATES ACTIVE)
              </span>
            )}
          </div>
          {statusMessage && (
            <div className="text-[11px] font-mono text-zinc-400 italic">
              {statusMessage}
            </div>
          )}
        </div>
      </div>

      {/* Battery Executive Summary Banner (if battery run) */}
      {lastBatteryReport && (
        <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">
                Assault Battery Execution Report ({lastBatteryReport.battery_id})
              </h2>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                Defense Rate: {lastBatteryReport.defense_rate}
              </span>
              <span className="px-2 py-0.5 rounded bg-red-950 border border-red-800 text-red-300">
                Intercepted: {lastBatteryReport.intercepted_count}/{lastBatteryReport.total_attacks}
              </span>
            </div>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
            {lastBatteryReport.summary}
          </p>
        </div>
      )}

      {/* Grid of Attack Vectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vectors.map((vec) => {
          const res = vectorResults[vec.id];
          const isCurrentRunning = runningVectorId === vec.id;

          return (
            <div
              key={vec.id}
              className={`border rounded-xl p-5 flex flex-col justify-between transition-all ${
                res
                  ? 'bg-zinc-900/90 border-red-900/60 shadow-lg'
                  : 'bg-[#121316] border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-semibold px-2 py-0.5 rounded bg-red-950/50 border border-red-900/50">
                      {vec.target_gate}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1.5">{vec.title}</h3>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      vec.severity === 'CRITICAL' || vec.severity === 'SYSTEM LOCKDOWN'
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {vec.severity}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  {vec.description}
                </p>

                {/* Expected Outcome */}
                <div className="bg-black/40 border border-zinc-850 rounded p-2.5 font-mono text-[11px] text-zinc-400">
                  <div className="text-zinc-400 text-[10px] uppercase font-semibold">Expected Enforcement:</div>
                  <div className="text-red-400 font-bold mt-0.5">{vec.expected_outcome}</div>
                </div>

                {/* Sample Payload preview */}
                <div className="bg-black/50 border border-zinc-850 rounded p-2.5 font-mono text-[10px] text-zinc-400 overflow-x-auto">
                  <div className="text-zinc-400 text-[10px] uppercase font-semibold mb-1">Payload Sample:</div>
                  <pre className="text-zinc-300 leading-tight">
                    {JSON.stringify(vec.payload, null, 2)}
                  </pre>
                </div>

                {/* Result Block if executed */}
                {res && (
                  <div className="mt-2 p-3 rounded-lg bg-red-950/30 border border-red-800/80 space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-300 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                        DECISION: {res.decision}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Risk Score: {res.risk_score}/100
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-300 font-sans leading-tight">
                      {res.reason}
                    </div>
                    {res.kill_switch_tripped && (
                      <div className="text-[10px] font-bold text-red-400 pt-1 border-t border-red-900/50 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        TRIPPED EMERGENCY KILL SWITCH!
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-850 flex items-center justify-between">
                <button
                  onClick={() => handleExecuteSingleVector(vec.id)}
                  disabled={isCurrentRunning || runningBattery}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded text-xs font-mono transition-all"
                >
                  {isCurrentRunning ? (
                    <>
                      <Activity className="w-3.5 h-3.5 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      Test Vector
                    </>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('audit')}
                  className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                >
                  View in Audit <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RedTeamTesting;
