import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  CreditCard,
  RotateCcw,
  Plus,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { api } from '../services/api';
import { Agent, Customer, CustomerSimulateResult } from '../types';

interface CustomerSimulatorProps {
  agents: Agent[];
  onRefreshAll: () => Promise<void>;
  setActiveTab: (tab: string) => void;
}

export const CustomerSimulator: React.FC<CustomerSimulatorProps> = ({
  agents,
  onRefreshAll,
  setActiveTab,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent_payment_01');
  const [action, setAction] = useState<string>('payment:create');
  const [amount, setAmount] = useState<number>(5000);
  const [recipient, setRecipient] = useState<string>('verified_merchant_switch');
  const [isOffHours, setIsOffHours] = useState<boolean>(false);
  const [burstFrequency, setBurstFrequency] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(true);
  const [result, setResult] = useState<CustomerSimulateResult | null>(null);

  // Add customer modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustType, setNewCustType] = useState('SAVINGS');
  const [newCustBalance, setNewCustBalance] = useState(50000);
  const [newCustKyc, setNewCustKyc] = useState('VERIFIED');
  const [newCustRisk, setNewCustRisk] = useState('LOW');
  const [addingCustomer, setAddingCustomer] = useState(false);

  const fetchCustomers = async () => {
    try {
      setFetching(true);
      const data = await api.getCustomers();
      setCustomers(data);
      if (data.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;

    setLoading(true);
    setResult(null);

    const context: Record<string, any> = {
      frequency: burstFrequency,
    };
    if (isOffHours) {
      context.time = '03:15';
    } else {
      context.time = '14:30';
    }

    try {
      const res = await api.simulateCustomerTransaction({
        customer_id: selectedCustomerId,
        agent_id: selectedAgentId,
        action,
        amount,
        recipient: action === 'payment:create' ? recipient : undefined,
        context,
      });
      setResult(res);
      // Refresh customer list and global app stats
      await fetchCustomers();
      await onRefreshAll();
    } catch (err: any) {
      setResult({
        success: false,
        decision: 'DENY',
        customer_id: selectedCustomerId,
        customer_name: selectedCustomer?.name || 'Customer',
        account_number: selectedCustomer?.account_number || '',
        previous_balance: selectedCustomer?.balance || 0,
        new_balance: selectedCustomer?.balance || 0,
        balance_delta: 0,
        action,
        amount,
        currency: 'INR',
        settled: false,
        risk_score: 100,
        risk_level: 'HIGH',
        reason: err.message,
        risk_factors: [err.message],
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetCustomer = async (id: string) => {
    try {
      await api.resetCustomer(id);
      await fetchCustomers();
      await onRefreshAll();
    } catch (err) {
      console.error('Failed to reset customer balance:', err);
    }
  };

  const handleResetAll = async () => {
    try {
      await api.resetAllCustomers();
      await fetchCustomers();
      await onRefreshAll();
    } catch (err) {
      console.error('Failed to reset all customer balances:', err);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingCustomer(true);
    try {
      await api.createCustomer({
        name: newCustName,
        email: newCustEmail,
        account_type: newCustType,
        balance: newCustBalance,
        kyc_status: newCustKyc,
        risk_tier: newCustRisk,
        currency: 'INR',
      });
      setShowAddModal(false);
      setNewCustName('');
      setNewCustEmail('');
      await fetchCustomers();
    } catch (err) {
      console.error('Failed to create customer:', err);
    } finally {
      setAddingCustomer(false);
    }
  };

  const totalSimulatedBalance = customers.reduce((acc, c) => acc + c.balance, 0);
  const verifiedCount = customers.filter((c) => c.kyc_status === 'VERIFIED').length;
  const flaggedCount = customers.filter((c) => c.kyc_status === 'FLAGGED').length;

  return (
    <div className="space-y-8 font-sans">
      {/* Top Banner / Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
              Fake Customer Simulator & Accounts
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/80">
              CORE BANKING MOCK
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Simulate autonomous AI agents executing debits, loan disbursements, and dispute refunds against realistic customer profiles with real-time KYC, risk score calculation, and balance settlement.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition"
            title="Reset all customer balances to their starting baselines"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Balances</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-zinc-850 bg-[#121215] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
              Total Simulated Customers
            </div>
            <div className="text-2xl font-bold text-zinc-100 font-mono mt-1">
              {customers.length}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Pre-seeded realistic profiles</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-850 bg-[#121215] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
              Total Account Liquidity
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              ₹{totalSimulatedBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Live aggregated mock balances</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-850 bg-[#121215] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
              KYC Status Distribution
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-emerald-400 font-mono">{verifiedCount} Verified</span>
              <span className="text-xs text-zinc-600">/</span>
              <span className="text-sm font-bold text-red-400 font-mono">{flaggedCount} Flagged</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">AML watchlists active</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-850 bg-[#121215] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
              Active Fleet Agents
            </div>
            <div className="text-2xl font-bold text-indigo-400 font-mono mt-1">
              {agents.filter((a) => a.status === 'ACTIVE').length} / {agents.length}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Ready for simulation</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Customer Directory Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-zinc-300 tracking-wider uppercase font-mono">
            Simulated Customer Directory (Click to Target)
          </div>
          <span className="text-[11px] text-zinc-500">
            Selected: <strong className="text-zinc-200">{selectedCustomer?.name || 'None'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {customers.map((c) => {
            const isSelected = c.id === selectedCustomerId;
            const isDebitPossible = c.balance >= amount;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCustomerId(c.id)}
                className={`p-4 rounded-xl border transition cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-950/15 shadow-sm shadow-emerald-950'
                    : 'border-zinc-850 bg-[#121215] hover:border-zinc-700'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}

                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm text-zinc-100 flex items-center gap-1.5">
                        {c.name}
                      </h3>
                      <p className="text-[11px] text-zinc-500 font-mono truncate">{c.email}</p>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase font-medium bg-zinc-900 border-zinc-750 text-zinc-400">
                      {c.account_type}
                    </span>
                  </div>

                  <div className="mt-4 p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-850">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span>Account No:</span>
                      <span className="text-zinc-200">{c.account_number}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] font-mono">
                      <span className="text-zinc-400">Current Balance:</span>
                      <span className="text-sm font-bold text-emerald-400">
                        ₹{c.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {/* KYC Badge */}
                    {c.kyc_status === 'VERIFIED' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border bg-emerald-950/60 border-emerald-800 text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" /> VERIFIED
                      </span>
                    )}
                    {c.kyc_status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border bg-amber-950/60 border-amber-800 text-amber-300">
                        <Clock className="w-3 h-3" /> PENDING KYC
                      </span>
                    )}
                    {c.kyc_status === 'FLAGGED' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border bg-red-950/60 border-red-800 text-red-300">
                        <AlertTriangle className="w-3 h-3" /> FLAGGED AML
                      </span>
                    )}

                    {/* Risk Tier */}
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        c.risk_tier === 'HIGH'
                          ? 'bg-red-950/50 border-red-800 text-red-300'
                          : c.risk_tier === 'MEDIUM'
                          ? 'bg-amber-950/50 border-amber-800 text-amber-300'
                          : 'bg-zinc-900 border-zinc-750 text-zinc-400'
                      }`}
                    >
                      {c.risk_tier} RISK
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-850 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Baseline: ₹{c.initial_balance.toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResetCustomer(c.id);
                    }}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 underline font-mono"
                  >
                    Reset Balance
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Simulation Panel & Output Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Transaction Configuration */}
        <div className="lg:col-span-6 p-5 rounded-xl border border-zinc-850 bg-[#121215]">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                Dispatch Autonomous Agent Action on Customer
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Target account: <span className="text-emerald-400 font-medium">{selectedCustomer?.name}</span> ({selectedCustomer?.account_number})
              </p>
            </div>
          </div>

          <form onSubmit={handleSimulate} className="space-y-4">
            {/* Target Customer Selector */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Target Customer Account
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.account_type} (Balance: ₹{c.balance.toLocaleString('en-IN')}) [{c.kyc_status} KYC]
                  </option>
                ))}
              </select>
            </div>

            {/* AI Agent Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Autonomous Fleet Agent
                </label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type}) [{a.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Action Type
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="payment:create">payment:create (Debit Customer Balance)</option>
                  <option value="loan:disburse">loan:disburse (Credit Loan to Customer)</option>
                  <option value="payment:refund">payment:refund (Credit Refund to Customer)</option>
                </select>
              </div>
            </div>

            {/* Amount input & quick chips */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-zinc-300">
                  Transaction Amount (₹)
                </label>
                <span className="text-[11px] font-mono text-zinc-500">
                  Customer Balance: ₹{selectedCustomer?.balance.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="number"
                min="1"
                step="any"
                value={amount === 0 ? '' : amount}
                onChange={(e) => setAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
                required
              />

              <div className="flex items-center gap-1.5 mt-2">
                {[1000, 5000, 15000, 50000].map((quickAmt) => (
                  <button
                    type="button"
                    key={quickAmt}
                    onClick={() => setAmount(quickAmt)}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded border transition ${
                      amount === quickAmt
                        ? 'border-indigo-500 bg-indigo-950/60 text-indigo-300'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    ₹{quickAmt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Counterparty if Debit */}
            {action === 'payment:create' && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Recipient Merchant / Counterparty
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. verified_merchant_switch, unverified_crypto_corp"
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setRecipient('verified_merchant_switch')}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 underline font-mono"
                  >
                    Verified Merchant (Low Risk)
                  </button>
                  <span className="text-zinc-600">•</span>
                  <button
                    type="button"
                    onClick={() => setRecipient('unverified_crypto_corp')}
                    className="text-[10px] text-red-400 hover:text-red-300 underline font-mono"
                  >
                    Unverified Crypto Wallet (High Risk)
                  </button>
                </div>
              </div>
            )}

            {/* Anomaly Stress Test Toggles */}
            <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 space-y-2.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
                Contextual AI Anomaly Injectors
              </span>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={isOffHours}
                    onChange={(e) => setIsOffHours(e.target.checked)}
                    className="rounded bg-zinc-900 border-zinc-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Nocturnal Execution (03:15 AM)</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Burst Velocity:</span>
                  <select
                    value={burstFrequency}
                    onChange={(e) => setBurstFrequency(Number(e.target.value))}
                    className="bg-zinc-900 border border-zinc-750 rounded px-2 py-0.5 text-xs text-zinc-200 font-mono"
                  >
                    <option value={1}>1 tx (Normal)</option>
                    <option value={5}>5 txs (Moderate)</option>
                    <option value={9}>9 txs (Burst Alert)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Execute Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating through AgentGuard 7-Stage Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Execute Agent Transaction with AgentGuard Governance</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Real-time Evaluation Result & Settlement Trace */}
        <div className="lg:col-span-6 p-5 rounded-xl border border-zinc-850 bg-[#121215] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                AgentGuard Zero-Trust Governance Decision
              </h2>
              {result && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                    result.decision === 'ALLOW'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : result.decision === 'HUMAN_APPROVAL'
                      ? 'bg-amber-950 text-amber-300 border-amber-700'
                      : 'bg-red-950 text-red-300 border-red-700'
                  }`}
                >
                  {result.decision}
                </span>
              )}
            </div>

            {!result && (
              <div className="py-20 text-center text-zinc-500 text-xs">
                <p>No simulated transaction executed yet.</p>
                <p className="mt-1 text-[11px] text-zinc-600">
                  Select a customer profile on the left and dispatch an action to test AgentGuard's policy evaluation and real-time ledger settlement.
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Result Hero Banner */}
                <div
                  className={`p-4 rounded-xl border ${
                    result.decision === 'ALLOW'
                      ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                      : result.decision === 'HUMAN_APPROVAL'
                      ? 'bg-amber-950/30 border-amber-800/80 text-amber-200'
                      : 'bg-red-950/30 border-red-800/80 text-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.decision === 'ALLOW' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    {result.decision === 'HUMAN_APPROVAL' && (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                    {result.decision === 'DENY' && (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                    )}
                    <span className="font-semibold text-sm">{result.message}</span>
                  </div>
                </div>

                {/* Balance Delta Display */}
                <div className="p-4 rounded-lg bg-zinc-950/80 border border-zinc-800">
                  <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
                    Customer Account Balance Impact
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center text-center">
                    <div>
                      <div className="text-[10px] text-zinc-500 font-mono">Previous Balance</div>
                      <div className="text-sm font-bold text-zinc-200 font-mono mt-0.5">
                        ₹{result.previous_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="text-[10px] font-mono text-zinc-500">
                        {result.balance_delta < 0 ? 'Debit' : result.balance_delta > 0 ? 'Credit' : 'Hold / Zero'}
                      </div>
                      <div
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded mt-0.5 ${
                          result.balance_delta < 0
                            ? 'text-red-400 bg-red-950/60'
                            : result.balance_delta > 0
                            ? 'text-emerald-400 bg-emerald-950/60'
                            : 'text-zinc-400 bg-zinc-900'
                        }`}
                      >
                        {result.balance_delta > 0 ? '+' : ''}
                        ₹{result.balance_delta.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-zinc-500 font-mono">New Balance</div>
                      <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                        ₹{result.new_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Score & Rationale */}
                <div className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-850 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-mono">AgentGuard AI Risk Score:</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded border text-xs ${
                        result.risk_level === 'HIGH'
                          ? 'bg-red-950 border-red-800 text-red-300'
                          : result.risk_level === 'MEDIUM'
                          ? 'bg-amber-950 border-amber-800 text-amber-300'
                          : 'bg-emerald-950 border-emerald-800 text-emerald-300'
                      }`}
                    >
                      {result.risk_score} / 100 ({result.risk_level})
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 italic">
                    "{result.reason}"
                  </p>

                  {result.risk_factors && result.risk_factors.length > 0 && (
                    <div className="pt-2 border-t border-zinc-850">
                      <span className="text-[10px] text-zinc-500 uppercase font-mono block mb-1">
                        Triggered Risk Factors:
                      </span>
                      <ul className="space-y-1">
                        {result.risk_factors.map((factor, idx) => (
                          <li
                            key={idx}
                            className="text-[11px] text-zinc-300 flex items-center gap-1.5 font-mono"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Core Banking Settlement Metadata */}
                <div className="text-[11px] font-mono text-zinc-500 space-y-1 bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">
                  <div className="flex justify-between">
                    <span>Settlement Status:</span>
                    <span className={result.settled ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>
                      {result.settled ? 'SETTLED (Core Banking Switch)' : 'UNSETTLED'}
                    </span>
                  </div>
                  {result.simulated_tx_id && (
                    <div className="flex justify-between">
                      <span>Simulated Core TX ID:</span>
                      <span className="text-zinc-300">{result.simulated_tx_id}</span>
                    </div>
                  )}
                  {result.approval_id && (
                    <div className="flex justify-between">
                      <span>Operator Approval ID:</span>
                      <span className="text-amber-400">{result.approval_id}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {result && (
            <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-mono">View in telemetry:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="px-2.5 py-1 rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-[11px]"
                >
                  Live Transactions &rarr;
                </button>
                {result.decision === 'HUMAN_APPROVAL' && (
                  <button
                    onClick={() => setActiveTab('approvals')}
                    className="px-2.5 py-1 rounded border border-amber-800 bg-amber-950/60 hover:bg-amber-900 text-amber-300 font-mono text-[11px]"
                  >
                    Review in Queue &rarr;
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('audit')}
                  className="px-2.5 py-1 rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-[11px]"
                >
                  Audit Trail &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Fake Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121215] border border-zinc-750 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Add New Fake Customer Profile
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Siddharth Verma"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. siddharth@sample.in"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Account Type</label>
                  <select
                    value={newCustType}
                    onChange={(e) => setNewCustType(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="SAVINGS">SAVINGS</option>
                    <option value="CURRENT">CURRENT</option>
                    <option value="WEALTH">WEALTH</option>
                    <option value="OFFSHORE">OFFSHORE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Initial Balance (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newCustBalance === 0 ? '' : newCustBalance}
                    onChange={(e) => setNewCustBalance(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">KYC Status</label>
                  <select
                    value={newCustKyc}
                    onChange={(e) => setNewCustKyc(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="FLAGGED">FLAGGED (AML Alert)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Risk Tier</label>
                  <select
                    value={newCustRisk}
                    onChange={(e) => setNewCustRisk(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingCustomer}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  {addingCustomer ? 'Creating...' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
