import React from 'react';
import { Shield, Activity, Users, ListCheck, FileText, PlaySquare, ArrowRightLeft } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingApprovalsCount: number;
  isEmergencyStopped: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingApprovalsCount,
  isEmergencyStopped,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: Activity },
    { id: 'agents', label: 'Fleet Agents', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: ListCheck,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { id: 'audit', label: 'Audit Trail', icon: FileText },
    { id: 'sandbox', label: 'Demo Sandbox', icon: PlaySquare, highlight: true },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-600/20 border border-cyan-500/40 rounded-xl text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-wider text-white">AgentGuard</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-700/50">
                  Control Plane v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Govern every agent. Control every action. Protect every transaction.
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all relative ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30'
                      : item.highlight
                      ? 'text-emerald-400 hover:bg-emerald-950/40 border border-emerald-500/30'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-bold bg-amber-500 text-slate-950 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Area: Theme Selector & Fleet Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeSelector />

            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full border bg-slate-950/70 border-slate-800 text-xs font-mono">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isEmergencyStopped ? 'bg-red-500 animate-ping' : 'bg-emerald-400 animate-pulse'
                }`}
              />
              <span className={isEmergencyStopped ? 'text-red-400 font-semibold' : 'text-slate-300'}>
                {isEmergencyStopped ? 'FAIL-CLOSED ACTIVE' : 'FAIL-CLOSED READY'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
