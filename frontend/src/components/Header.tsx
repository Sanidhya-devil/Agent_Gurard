import React, { useState } from 'react';
import {
  Shield,
  Zap,
  PlaySquare,
  AlertOctagon,
  ChevronRight,
} from 'lucide-react';
import { KillSwitchModal } from './KillSwitchModal';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isEmergencyStopped: boolean;
  onToggleEmergencyStop: () => void | Promise<void>;
  pendingApprovalsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isEmergencyStopped,
  onToggleEmergencyStop,
  pendingApprovalsCount,
}) => {
  const [showKillModal, setShowKillModal] = useState(false);

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
        return 'Test Data Profiles & Simulator';
      default:
        return 'Control Plane';
    }
  };

  return (
    <>
      <header className="h-14 border-b border-zinc-800/80 bg-[#09090B]/90 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between font-sans">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400 font-mono">AgentGuard</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-200 font-medium">{getTabLabel(activeTab)}</span>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-3">
          {/* Fail-Closed Status Tag */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isEmergencyStopped ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
              }`}
            />
            <span className={isEmergencyStopped ? 'text-rose-400 font-semibold' : 'text-zinc-300'}>
              {isEmergencyStopped ? 'SYSTEM STOPPED' : 'GATEWAY: FAIL-CLOSED'}
            </span>
          </div>

          {/* Visual Divider Separating Kill Switch (Global Control) from standard status with extra spacing */}
          <div className="h-6 w-px bg-zinc-800 mx-3" aria-hidden="true" />

          {/* Emergency Stop Button (Isolated section) */}
          <button
            onClick={() => setShowKillModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isEmergencyStopped
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/80 active:scale-95'
            }`}
            title={isEmergencyStopped ? 'Release Emergency Stop' : 'Trigger Global Fleet Stop'}
            aria-label={isEmergencyStopped ? 'Release Emergency Stop' : 'Trigger Global Fleet Stop'}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>{isEmergencyStopped ? 'Release Stop' : 'Kill Switch'}</span>
          </button>
        </div>
      </header>

      {/* Kill Switch Confirmation Modal requiring "KILL" input */}
      <KillSwitchModal
        isOpen={showKillModal}
        onClose={() => setShowKillModal(false)}
        onConfirm={async () => {
          await onToggleEmergencyStop();
        }}
        isEmergencyStopped={isEmergencyStopped}
      />
    </>
  );
};
