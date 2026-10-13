import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  Users,
  ArrowRightLeft,
  ListCheck,
  FileText,
  PlaySquare,
  UserCheck,
  AlertOctagon,
  Shield,
  Zap,
  Lock,
  Radio,
  Cpu,
  Flame,
  CheckCircle2,
  X,
  CornerDownLeft,
} from 'lucide-react';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, filter?: string, search?: string) => void;
  onTriggerKillSwitch?: () => void;
  isEmergencyStopped?: boolean;
}

interface CommandItem {
  id: string;
  category: 'PAGES' | 'QUICK ACTIONS' | 'POLICY GATES';
  title: string;
  subtitle?: string;
  icon: any;
  shortcut?: string;
  action: () => void;
  badge?: string;
  badgeColor?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onTriggerKillSwitch,
  isEmergencyStopped = false,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // All actionable commands
  const commands: CommandItem[] = [
    // Pages / Tabs
    {
      id: 'page-dashboard',
      category: 'PAGES',
      title: 'Control Plane Overview',
      subtitle: 'Real-time telemetry, G1-G7 funnel, spend velocity',
      icon: LayoutDashboard,
      shortcut: 'G D',
      action: () => onNavigate('dashboard'),
    },
    {
      id: 'page-agents',
      category: 'PAGES',
      title: 'Autonomous Fleet Agents',
      subtitle: 'Manage agent credentials, permissions & daily budget limits',
      icon: Users,
      shortcut: 'G A',
      action: () => onNavigate('agents'),
    },
    {
      id: 'page-transactions',
      category: 'PAGES',
      title: 'Live Financial Action Feed',
      subtitle: 'Real-time streaming ledger of all evaluated operations',
      icon: ArrowRightLeft,
      shortcut: 'G T',
      action: () => onNavigate('transactions'),
    },
    {
      id: 'page-approvals',
      category: 'PAGES',
      title: 'Dual-Custody Approvals Queue',
      subtitle: 'Review high-risk transactions requiring human sign-off',
      icon: ListCheck,
      shortcut: 'G Q',
      action: () => onNavigate('approvals'),
    },
    {
      id: 'page-audit',
      category: 'PAGES',
      title: 'Immutable Audit Ledger',
      subtitle: 'Cryptographic append-only trail of all policy decisions',
      icon: FileText,
      shortcut: 'G L',
      action: () => onNavigate('audit'),
    },
    {
      id: 'page-sandbox',
      category: 'PAGES',
      title: 'Scenario Demo Sandbox',
      subtitle: 'Execute pre-configured PRD scenarios (Budget, AI Risk, Kill Switch)',
      icon: PlaySquare,
      shortcut: 'G S',
      action: () => onNavigate('sandbox'),
    },
    {
      id: 'page-customers',
      category: 'PAGES',
      title: 'Test Data & Simulator',
      subtitle: 'Simulate accounts (Arjun, Priya, Vikram AML, Neha Overdraft)',
      icon: UserCheck,
      shortcut: 'G C',
      action: () => onNavigate('customers'),
    },
    {
      id: 'page-redteam',
      category: 'PAGES',
      title: 'Adversarial Red Team Battery',
      subtitle: 'Automated 6-vector attack assault & Kill Switch tripwire testing',
      icon: Flame,
      shortcut: 'G R',
      action: () => onNavigate('redteam'),
    },

    // Quick Actions
    {
      id: 'action-blocked',
      category: 'QUICK ACTIONS',
      title: 'View Blocked (DENY) Transactions',
      subtitle: 'Audit trail filtered by fail-closed policy denials',
      icon: FileText,
      badge: 'DENY',
      badgeColor: 'text-indigo-400 bg-indigo-950/60 border-indigo-800',
      action: () => onNavigate('audit', 'DENY'),
    },
    {
      id: 'action-high-risk',
      category: 'QUICK ACTIONS',
      title: 'View High Risk Anomalies',
      subtitle: 'Audit trail filtered by AI risk score ≥ 75',
      icon: Flame,
      badge: 'HIGH RISK',
      badgeColor: 'text-rose-400 bg-rose-950/60 border-rose-800',
      action: () => onNavigate('audit', 'ALL', 'Risk'),
    },
    {
      id: 'action-kill-switch',
      category: 'QUICK ACTIONS',
      title: isEmergencyStopped ? 'Disengage Emergency Stop' : 'Trip Global Emergency Kill Switch',
      subtitle: isEmergencyStopped ? 'Restore normal operations' : 'Lock down fleet fail-closed',
      icon: AlertOctagon,
      badge: isEmergencyStopped ? 'RESUME' : 'FAIL-CLOSED',
      badgeColor: isEmergencyStopped ? 'text-emerald-400 bg-emerald-950 border-emerald-800' : 'text-rose-400 bg-rose-950 border-rose-800',
      action: () => {
        if (onTriggerKillSwitch) onTriggerKillSwitch();
      },
    },

    // Policy Gates Direct Jump
    {
      id: 'gate-1',
      category: 'POLICY GATES',
      title: 'Gate 1: Identity & API Key Hash',
      subtitle: 'Cryptographic token validation & identity partition hash',
      icon: Lock,
      action: () => onNavigate('audit', 'ALL', 'Identity'),
    },
    {
      id: 'gate-2',
      category: 'POLICY GATES',
      title: 'Gate 2: Global Kill Switch',
      subtitle: 'Sub-millisecond fail-closed atomic tripwire inspection',
      icon: Radio,
      action: () => onNavigate('audit', 'ALL', 'Kill Switch'),
    },
    {
      id: 'gate-4',
      category: 'POLICY GATES',
      title: 'Gate 4: Least-Privilege RBAC Scope',
      subtitle: 'Capability scope enforcement (payment:create, loan:disburse)',
      icon: Cpu,
      action: () => onNavigate('audit', 'ALL', 'RBAC'),
    },
    {
      id: 'gate-6',
      category: 'POLICY GATES',
      title: 'Gate 6: Contextual AI Risk Engine',
      subtitle: '15-min burst frequency, nocturnal execution, recipient novelty',
      icon: Flame,
      action: () => onNavigate('audit', 'ALL', 'Anomaly'),
    },
  ];

  // Filter commands by query
  const filteredCommands = commands.filter((cmd) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.subtitle?.toLowerCase().includes(q)
    );
  });

  // Handle keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Quick navigation command palette"
    >
      <div
        className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-zinc-100 font-sans"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800 bg-zinc-900/50">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a page, command, or gate name to jump..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="text-zinc-500 hover:text-zinc-300 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 && (
            <div className="py-8 text-center text-xs font-mono text-zinc-500">
              No matching pages or commands found for "{query}".
            </div>
          )}

          {filteredCommands.map((cmd, idx) => {
            const Icon = cmd.icon;
            const isSelected = idx === selectedIndex;

            return (
              <div
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition select-none ${
                  isSelected
                    ? 'bg-indigo-600/20 text-white border border-indigo-500/40'
                    : 'text-zinc-300 hover:bg-zinc-850/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{cmd.title}</span>
                      {cmd.badge && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold border ${cmd.badgeColor}`}
                        >
                          {cmd.badge}
                        </span>
                      )}
                    </div>
                    {cmd.subtitle && (
                      <div className="text-[11px] text-zinc-400 truncate mt-0.5">{cmd.subtitle}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {cmd.shortcut && (
                    <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700">
                      {cmd.shortcut}
                    </kbd>
                  )}
                  {isSelected && (
                    <CornerDownLeft className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Navigation Help */}
        <div className="px-4 py-2 bg-zinc-950/80 border-t border-zinc-850 flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <div className="flex items-center gap-3">
            <span>↑ ↓ to navigate</span>
            <span>↵ to select</span>
            <span>esc to close</span>
          </div>
          <span>AgentGuard Quick Nav</span>
        </div>
      </div>
    </div>
  );
};
