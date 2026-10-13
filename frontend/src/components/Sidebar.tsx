import React from 'react';
import {
  Shield,
  LayoutDashboard,
  Users,
  ArrowRightLeft,
  ListCheck,
  FileText,
  PlaySquare,
  AlertOctagon,
  ShieldCheck,
  Command,
  Search,
  ChevronRight,
  Sparkles,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingApprovalsCount: number;
  isEmergencyStopped: boolean;
  onToggleEmergencyStop: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingApprovalsCount,
  isEmergencyStopped,
  onToggleEmergencyStop,
}) => {
  const navSections = [
    {
      title: 'PLATFORM',
      items: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'agents', label: 'Fleet Agents', icon: Users },
        { id: 'transactions', label: 'Live Transactions', icon: ArrowRightLeft },
      ],
    },
    {
      title: 'GOVERNANCE & AUDIT',
      items: [
        {
          id: 'approvals',
          label: 'Approvals Queue',
          icon: ListCheck,
          badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
        },
        { id: 'audit', label: 'Audit Trail', icon: FileText },
      ],
    },
    {
      title: 'HACKATHON DEMO',
      items: [
        {
          id: 'sandbox',
          label: 'Scenario Sandbox',
          icon: PlaySquare,
          isSpecial: true,
        },
        {
          id: 'customers',
          label: 'Fake Customers & Accounts',
          icon: UserCheck,
          isSpecial: true,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#0C0C0E] border-r border-zinc-800/80 flex flex-col shrink-0 min-h-screen select-none font-sans">
      {/* Workspace Logo & Title */}
      <div className="p-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-indigo-400 shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-zinc-100 tracking-tight">AgentGuard</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                PRO
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">Control Plane v1.0</span>
          </div>
        </div>

        {/* Quick Search Shortcut */}
        <div className="mt-3.5 flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-900/70 border border-zinc-850 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[11px]">Quick navigation...</span>
          </div>
          <kbd className="font-mono text-[10px] px-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-2.5 mb-1.5 text-[10px] font-mono font-semibold text-zinc-500 tracking-wider">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-zinc-800/90 text-white shadow-sm'
                      : item.isSpecial
                      ? 'text-indigo-400 hover:bg-indigo-950/30 hover:text-indigo-300'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-indigo-400'
                          : item.isSpecial
                          ? 'text-indigo-400'
                          : 'text-zinc-500 group-hover:text-zinc-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}

                  {item.isSpecial && (
                    <Sparkles className="w-3 h-3 text-indigo-400 opacity-60 group-hover:opacity-100" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Emergency Switch & Status */}
      <div className="p-3 border-t border-zinc-800/60 bg-zinc-950/40 space-y-2.5">
        {/* Fail-Closed Kill Switch Card */}
        <div
          onClick={onToggleEmergencyStop}
          className={`cursor-pointer p-2.5 rounded-xl border transition-all ${
            isEmergencyStopped
              ? 'bg-red-950/50 border-red-800/80 hover:bg-red-950/70'
              : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`p-1 rounded-md ${
                  isEmergencyStopped ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-zinc-200">Emergency Stop</span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {isEmergencyStopped ? 'FAIL-CLOSED ACTIVE' : 'FAIL-CLOSED ARMED'}
                </span>
              </div>
            </div>

            <span
              className={`w-2 h-2 rounded-full ${
                isEmergencyStopped ? 'bg-red-500 animate-ping' : 'bg-emerald-500'
              }`}
            />
          </div>
        </div>

        {/* Operational Status Dot */}
        <div className="flex items-center justify-between px-2 text-[10px] font-mono text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Policy Gateway: Online</span>
          </div>
          <span>99.98%</span>
        </div>
      </div>
    </aside>
  );
};
