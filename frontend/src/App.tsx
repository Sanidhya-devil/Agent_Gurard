import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardOverview } from './pages/DashboardOverview';
import { AgentManagement } from './pages/AgentManagement';
import { TransactionFeed } from './pages/TransactionFeed';
import { ApprovalQueue } from './pages/ApprovalQueue';
import { AuditLogViewer } from './pages/AuditLogViewer';
import { DemoSandbox } from './pages/DemoSandbox';
import { CustomerSimulator } from './pages/CustomerSimulator';
import { RedTeamTesting } from './pages/RedTeamTesting';
import { CommandPalette } from './components/CommandPalette';
import { AlertOctagon } from 'lucide-react';
import { api } from './services/api';
import {
  Agent,
  Permission,
  Transaction,
  ApprovalRequest,
  AuditLog,
  DashboardStats,
  EmergencyStatus,
  AnalyticsData,
} from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [emergencyStatus, setEmergencyStatus] = useState<EmergencyStatus>({
    global_stop: false,
    status: 'NORMAL',
    message: '',
  });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditFilter, setAuditFilter] = useState<string>('ALL');
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  // Global Keyboard Shortcut: ⌘K or Ctrl+K to toggle Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigateTab = (tab: string, filter?: string, search?: string) => {
    if (tab === 'audit') {
      if (filter) setAuditFilter(filter);
      if (search !== undefined) setAuditSearch(search);
    }
    setActiveTab(tab);
  };

  const fetchAllData = async () => {
    try {
      const [
        statsData,
        analyticsData,
        emData,
        agentsData,
        permsData,
        txsData,
        apprsData,
        logsData,
      ] = await Promise.all([
        api.getStats().catch(() => null),
        api.getAnalytics().catch(() => null),
        api.getEmergencyStatus().catch(() => ({ global_stop: false, status: 'NORMAL', message: '' })),
        api.getAgents().catch(() => []),
        api.getPermissions().catch(() => []),
        api.getTransactions().catch(() => []),
        api.getApprovals().catch(() => []),
        api.getAuditLogs().catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      if (analyticsData) setAnalytics(analyticsData);
      setEmergencyStatus(emData as EmergencyStatus);
      setAgents(agentsData);
      setPermissions(permsData);
      setTransactions(txsData);
      setApprovals(apprsData);
      setAuditLogs(logsData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // Live polling every 4 seconds for real-time dashboard updates
    const interval = setInterval(fetchAllData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerEmergencyStop = async () => {
    await api.triggerEmergencyStop();
    await fetchAllData();
  };

  const handleReleaseEmergencyStop = async () => {
    await api.releaseEmergencyStop();
    await fetchAllData();
  };

  const handleToggleEmergencyStop = async () => {
    if (emergencyStatus.global_stop) {
      await handleReleaseEmergencyStop();
    } else {
      await handleTriggerEmergencyStop();
    }
  };

  const handleRegisterAgent = async (agentData: any) => {
    await api.registerAgent(agentData);
    await fetchAllData();
  };

  const handleRevokeAgent = async (agentId: string) => {
    await api.revokeAgent(agentId);
    await fetchAllData();
  };

  const handleActivateAgent = async (agentId: string) => {
    await api.activateAgent(agentId);
    await fetchAllData();
  };

  const handleUpdateBudget = async (agentId: string, dailyLimit: number, txLimit: number) => {
    await api.updateBudget(agentId, dailyLimit, txLimit);
    await fetchAllData();
  };

  const handleDecideApproval = async (
    approvalId: string,
    decision: 'APPROVED' | 'REJECTED',
    notes?: string
  ) => {
    await api.decideApproval(approvalId, decision, notes);
    await fetchAllData();
  };

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex font-sans antialiased">
      {/* Left Sleek Linear Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        pendingApprovalsCount={pendingApprovalsCount}
        isEmergencyStopped={emergencyStatus.global_stop}
        onToggleEmergencyStop={handleToggleEmergencyStop}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Right Content Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Minimalist Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isEmergencyStopped={emergencyStatus.global_stop}
          onToggleEmergencyStop={handleToggleEmergencyStop}
          pendingApprovalsCount={pendingApprovalsCount}
        />

        {/* Global Emergency Status Warning Pill */}
        {emergencyStatus.global_stop && (
          <div className="bg-red-950/80 border-b border-red-800 text-red-200 px-6 py-2.5 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 font-bold">
              <AlertOctagon className="w-4 h-4 text-red-400 animate-pulse" />
              <span>GLOBAL KILL SWITCH ENGAGED: ALL FLEET TRANSACTIONS BLOCKED FAIL-CLOSED</span>
            </div>
            <button
              onClick={handleReleaseEmergencyStop}
              className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-sans text-xs font-bold transition"
            >
              Release Stop
            </button>
          </div>
        )}

        {/* Canvas Area */}
        <main className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
          {loading && (
            <div className="flex items-center justify-center py-20 text-zinc-500 text-xs font-mono">
              Connecting to AgentGuard Control Plane...
            </div>
          )}

          {!loading && (
            <>
              {activeTab === 'dashboard' && (
                <DashboardOverview
                  stats={stats}
                  analytics={analytics}
                  agents={agents}
                  transactions={transactions}
                  setActiveTab={handleNavigateTab}
                  isEmergencyStopped={emergencyStatus.global_stop}
                  onToggleEmergencyStop={handleToggleEmergencyStop}
                />
              )}

              {activeTab === 'agents' && (
                <AgentManagement
                  agents={agents}
                  permissions={permissions}
                  onRefresh={fetchAllData}
                  onRegisterAgent={handleRegisterAgent}
                  onRevokeAgent={handleRevokeAgent}
                  onActivateAgent={handleActivateAgent}
                  onUpdateBudget={handleUpdateBudget}
                />
              )}

              {activeTab === 'transactions' && (
                <TransactionFeed
                  transactions={transactions}
                  onRefresh={fetchAllData}
                />
              )}

              {activeTab === 'approvals' && (
                <ApprovalQueue
                  approvals={approvals}
                  onDecideApproval={handleDecideApproval}
                  onRefresh={fetchAllData}
                />
              )}

              {activeTab === 'audit' && (
                <AuditLogViewer
                  logs={auditLogs}
                  onRefresh={fetchAllData}
                  initialFilter={auditFilter}
                  initialSearch={auditSearch}
                />
              )}

              {activeTab === 'sandbox' && (
                <DemoSandbox
                  agents={agents}
                  permissions={permissions}
                  onRefreshAll={fetchAllData}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'customers' && (
                <CustomerSimulator
                  agents={agents}
                  onRefreshAll={fetchAllData}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'redteam' && (
                <RedTeamTesting
                  onRefreshAll={fetchAllData}
                  setActiveTab={setActiveTab}
                />
              )}
            </>
          )}
        </main>

        {/* Minimalist Footer */}
        <footer className="border-t border-zinc-850 bg-[#09090B] py-3 px-8 text-center text-[11px] text-zinc-500 font-mono">
          AgentGuard • Autonomous Financial AI Governance Control Plane • Fail-Closed Policy Engine
        </footer>
      </div>

      {/* Quick Navigation Command Palette (⌘K / Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigateTab}
        onTriggerKillSwitch={handleToggleEmergencyStop}
        isEmergencyStopped={emergencyStatus.global_stop}
      />
    </div>
  );
};

export default App;
