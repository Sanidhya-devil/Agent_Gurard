import React from 'react';
import {
  Shield,
  Zap,
  PlaySquare,
  AlertOctagon,
  ChevronRight,
  ExternalLink,
  Bell,
  SlidersHorizontal,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isEmergencyStopped: boolean;
  onToggleEmergencyStop: () => void;
  pendingApprovalsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isEmergencyStopped,
  onToggleEmergencyStop,
  pendingApprovalsCount,
}) => {
  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Overview & Telemetry';
      case 'agents':
        return 'Autonomous Fleet Agents';
      case 'transactions':
        return 'Financial Action Stream';
      case 'approvals':
        return 'Dual-Custody Approvals';
      case 'audit':
        return 'Immutable Audit Ledger';
      case 'sandbox':
        return 'Scenario Demo Sandbox';
      case 'customers':
        return 'Fake Customer Profiles & Simulator';
      default:
        return 'Control Plane';
    }
  };

  return (
    <header className="h-14 border-b border-zinc-800/80 bg-[#09090B]/90 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between font-sans">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-zinc-500 font-mono">AgentGuard</span>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-zinc-200 font-medium">{getTabLabel(activeTab)}</span>
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center gap-3">
        {/* Fail-Closed Status Tag */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-[11px] font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isEmergencyStopped ? 'bg-red-500 animate-ping' : 'bg-emerald-400'
            }`}
          />
          <span className={isEmergencyStopped ? 'text-red-400 font-semibold' : 'text-zinc-400'}>
            {isEmergencyStopped ? 'SYSTEM STOPPED' : 'GATEWAY: FAIL-CLOSED'}
          </span>
        </div>

        {/* Demo Sandbox Button */}
        <button
          onClick={() => setActiveTab('sandbox')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-900 transition-all shadow-sm"
        >
          <PlaySquare className="w-3.5 h-3.5" />
          <span>Simulate Scenarios</span>
        </button>

        {/* Emergency Stop Toggle */}
        <button
          onClick={onToggleEmergencyStop}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            isEmergencyStopped
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
              : 'bg-red-950/40 hover:bg-red-900/50 text-red-300 border-red-800/80'
          }`}
          title={isEmergencyStopped ? 'Release Emergency Stop' : 'Trigger Global Fleet Stop'}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>{isEmergencyStopped ? 'Release Stop' : 'Kill Switch'}</span>
        </button>
      </div>
    </header>
  );
};
