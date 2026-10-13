import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  FileText,
  Code2,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  XCircle,
  X,
  Link2,
  Download,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Copy,
  Check,
  FileSpreadsheet,
  Lock,
  Flame,
} from 'lucide-react';
import { AuditLog, ChainVerificationResult, ComplianceReport } from '../types';
import { api } from '../services/api';

interface AuditLogViewerProps {
  logs: AuditLog[];
  onRefresh: () => Promise<void>;
  initialFilter?: string;
  initialSearch?: string;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  logs,
  onRefresh,
  initialFilter = 'ALL',
  initialSearch = '',
}) => {
  const [search, setSearch] = useState(initialSearch);
  const [filterDecision, setFilterDecision] = useState(initialFilter);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Cryptographic Ledger Verification state
  const [verification, setVerification] = useState<ChainVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTampering, setIsTampering] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Compliance Report Modal state
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    if (initialFilter) setFilterDecision(initialFilter);
    if (initialSearch !== undefined) setSearch(initialSearch);
  }, [initialFilter, initialSearch]);

  const loadVerification = async () => {
    setIsVerifying(true);
    try {
      const res = await api.verifyAuditChain();
      setVerification(res);
    } catch (err: any) {
      console.error('Failed to verify audit chain:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    loadVerification();
  }, [logs.length]);

  const handleVerify = async () => {
    await loadVerification();
    setActionNotice('Cryptographic chain verified against SHA-256 genesis anchor.');
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleSimulateTamper = async () => {
    setIsTampering(true);
    try {
      const res = await api.simulateAuditTamper();
      await onRefresh();
      const verRes = await api.verifyAuditChain();
      setVerification(verRes);
      setActionNotice(`Tampering injected into event ${res.tampered_event_id}. Cryptographic auditor detected broken signature!`);
    } catch (err: any) {
      console.error('Tamper simulation error:', err);
    } finally {
      setIsTampering(false);
    }
  };

  const handleRepairChain = async () => {
    setIsRepairing(true);
    try {
      const res = await api.repairAuditChain();
      await onRefresh();
      setVerification(res.verification);
      setActionNotice(`Ledger healed! Re-anchored ${res.recomputed_records} record hash signatures.`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      console.error('Repair chain error:', err);
    } finally {
      setIsRepairing(false);
    }
  };

  const handleOpenCompliance = async () => {
    setIsLoadingReport(true);
    try {
      const rep = await api.getComplianceReport();
      setComplianceReport(rep);
      setShowComplianceModal(true);
    } catch (err: any) {
      console.error('Failed to fetch compliance dossier:', err);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filtered = logs.filter((log) => {
    if (filterDecision !== 'ALL' && log.decision !== filterDecision) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.agent_id.toLowerCase().includes(q) ||
        log.event_id.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.reason.toLowerCase().includes(q) ||
        (log.current_hash && log.current_hash.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Cryptographic Ledger Health Banner */}
      <div className={`border rounded-2xl p-4 sm:p-5 transition-all shadow-lg backdrop-blur-md ${
        verification?.is_valid === false
          ? 'bg-red-950/40 border-red-800/80 shadow-red-950/20'
          : 'bg-slate-900/90 border-slate-800 shadow-slate-950/40'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`p-3 rounded-xl border flex-shrink-0 ${
              verification?.is_valid === false
                ? 'bg-red-900/40 text-red-400 border-red-700/60 animate-pulse'
                : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
            }`}>
              {verification?.is_valid === false ? (
                <ShieldAlert className="w-6 h-6 text-red-400" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Cryptographic Hash Chain Ledger
                </h3>
                <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  verification?.is_valid === false
                    ? 'bg-red-900/60 text-red-300 border-red-700'
                    : 'bg-emerald-900/60 text-emerald-300 border-emerald-700'
                }`}>
                  {verification?.status === 'TAMPER_DETECTED'
                    ? 'TAMPER DETECTED'
                    : verification?.is_valid
                    ? '100% IMMUTABLE & VERIFIED'
                    : 'CHECKING CHAIN...'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Algorithm: SHA-256 Recursive Chain
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                {verification?.message ||
                  'Each audit entry anchors to its predecessor block hash. Any unauthorized DB mutation immediately breaks chain integrity.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium border border-slate-700 transition"
              title="Audit full ledger from Genesis block to Tip"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              Verify Chain
            </button>

            {verification?.is_valid === false ? (
              <button
                onClick={handleRepairChain}
                disabled={isRepairing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-900/40 transition"
                title="Re-anchor cryptographic hashes and restore ledger integrity"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRepairing ? 'animate-spin' : ''}`} />
                {isRepairing ? 'Healing...' : 'Heal & Repair Ledger'}
              </button>
            ) : (
              <button
                onClick={handleSimulateTamper}
                disabled={isTampering}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 border border-amber-800/80 rounded-lg text-xs font-medium transition"
                title="Demo security test: alter database record directly to trigger tamper detection"
              >
                <Flame className={`w-3.5 h-3.5 ${isTampering ? 'animate-spin' : ''}`} />
                Simulate Tamper Attack
              </button>
            )}

            <button
              onClick={handleOpenCompliance}
              disabled={isLoadingReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-900/30 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              RBI / Basel III Dossier
            </button>

            <button
              onClick={api.downloadAuditCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition"
              title="Download raw audit ledger with hashes as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>
        </div>

        {/* Genesis & Tip Hash Metadata Bar */}
        {verification && verification.is_valid && verification.tip_hash && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Genesis:</span>
              <span className="text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                00000000...0000 (Root Anchor)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Tip Hash:</span>
              <span
                onClick={() => copyToClipboard(verification.tip_hash!, 'tip')}
                className="text-blue-400 hover:text-blue-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 cursor-pointer flex items-center gap-1"
                title="Click to copy SHA-256 Tip Hash"
              >
                {verification.tip_hash.slice(0, 16)}...{verification.tip_hash.slice(-10)}
                {copiedHash === 'tip' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Verified Chain Depth:</span>
              <span className="text-emerald-400 font-bold">{verification.total_records} blocks</span>
            </div>
          </div>
        )}

        {/* Action Notice feedback banner */}
        {actionNotice && (
          <div className="mt-3 p-2.5 rounded-lg bg-blue-950/70 border border-blue-800/60 text-blue-200 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}
      </div>

      {/* Main Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Immutable Governance Trail</h2>
          <p className="text-xs text-slate-400">
            Append-only record capturing agent actions, 7-gate deterministic decisions, and cryptographic proofs
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search agent, hash, event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-52"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            {['ALL', 'ALLOW', 'DENY', 'HUMAN_APPROVAL'].map((dec) => (
              <button
                key={dec}
                onClick={() => setFilterDecision(dec)}
                className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold transition ${
                  filterDecision === dec
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {dec}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Agent</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4">Cryptographic Hash</th>
                <th className="py-3 px-4">Evaluation Rationale</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-medium text-blue-400 text-[11px] whitespace-nowrap">
                    {log.event_id}
                  </td>
                  <td className="py-3 px-4 font-mono text-white font-semibold whitespace-nowrap">{log.agent_id}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-mono text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                        log.decision === 'ALLOW'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : log.decision === 'DENY'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {log.decision}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300 text-xs">
                    {log.risk_score}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {log.current_hash ? (
                      <span
                        onClick={() => copyToClipboard(log.current_hash!, log.event_id)}
                        className="text-slate-400 hover:text-blue-400 cursor-pointer flex items-center gap-1 group"
                        title={`Click to copy SHA-256 hash:\n${log.current_hash}`}
                      >
                        <Lock className="w-3 h-3 text-emerald-500/80 flex-shrink-0" />
                        <span>{log.current_hash.slice(0, 8)}...{log.current_hash.slice(-6)}</span>
                        {copiedHash === log.event_id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition" />
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-600 italic">legacy/pending</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-300 text-xs max-w-xs truncate" title={log.reason}>
                    {log.reason}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono transition"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No audit records found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Cryptographic Audit Event Inspector</h3>
                <span className="text-xs text-blue-400 font-mono">{selectedLog.event_id}</span>
              </div>
            </div>

            {/* Cryptographic Hash Verification Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 mb-4 text-xs font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  SHA-256 Block Signature
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                  AUTHENTICATED
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Previous Hash (Parent Block):</span>
                <span className="text-slate-300 break-all select-all text-[11px] bg-slate-900 px-2 py-1 rounded block mt-0.5 border border-slate-800/60">
                  {selectedLog.previous_hash || '0000000000000000000000000000000000000000000000000000000000000000 (Genesis)'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Current Hash (Cryptographic Seal):</span>
                <span className="text-blue-300 break-all select-all text-[11px] bg-slate-900 px-2 py-1 rounded block mt-0.5 border border-slate-800/60">
                  {selectedLog.current_hash || 'N/A'}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Agent ID:</span>
                  <span className="text-white font-semibold">{selectedLog.agent_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Action:</span>
                  <span className="text-blue-300 font-semibold">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Decision:</span>
                  <span className="text-emerald-400 font-semibold">{selectedLog.decision}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Risk Score:</span>
                  <span className="text-amber-400 font-semibold">{selectedLog.risk_score}/100</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 font-sans text-xs font-semibold">
                  Policy Evaluation Decision Reason:
                </span>
                <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 font-sans leading-relaxed text-xs">
                  {selectedLog.reason}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 font-sans text-xs font-semibold">
                  Raw Request Payload:
                </span>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 text-[11px] overflow-x-auto max-h-48">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedLog.request_data), null, 2);
                    } catch {
                      return selectedLog.request_data;
                    }
                  })()}
                </pre>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Dossier Modal (RBI & Basel III) */}
      {showComplianceModal && complianceReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-3xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowComplianceModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{complianceReport.title}</h3>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                  <span className="text-blue-400 font-mono font-semibold">{complianceReport.report_id}</span>
                  <span>•</span>
                  <span>Standard: {complianceReport.standard}</span>
                </div>
              </div>
            </div>

            {/* Executive Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 font-mono text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Total Events</span>
                <span className="text-lg font-bold text-white">
                  {complianceReport.executive_summary.total_events_evaluated}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Authorized (Allowed)</span>
                <span className="text-lg font-bold text-emerald-400">
                  {complianceReport.executive_summary.authorized_allowed_count}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Fail-Closed Denied</span>
                <span className="text-lg font-bold text-red-400">
                  {complianceReport.executive_summary.denied_fail_closed_count}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Dual-Custody HITL</span>
                <span className="text-lg font-bold text-amber-400">
                  {complianceReport.executive_summary.human_approval_escalated_count}
                </span>
              </div>
            </div>

            {/* Ledger Integrity Card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-5 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Cryptographic Ledger Integrity Attestation
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-mono">
                  {complianceReport.ledger_integrity.status}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {complianceReport.compliance_attestation}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px] font-mono text-slate-400">
                <div>
                  <span className="text-slate-500">Genesis Hash: </span>
                  <span className="text-slate-300">{complianceReport.ledger_integrity.genesis_hash}</span>
                </div>
                <div>
                  <span className="text-slate-500">Enforcement Rate: </span>
                  <span className="text-emerald-400 font-bold">
                    {complianceReport.executive_summary.enforcement_rate}
                  </span>
                </div>
              </div>
            </div>

            {/* Denial Breakdown */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-5 text-xs">
              <span className="font-semibold text-white block mb-2">
                Operational Risk Intervention Classification
              </span>
              <div className="space-y-2">
                {Object.entries(complianceReport.denial_breakdown).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between py-1 border-b border-slate-900 font-mono text-xs">
                    <span className="text-slate-300">{category}</span>
                    <span className="text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded border border-red-900">
                      {count} incidents
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={api.downloadAuditCsv}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export Official Audit CSV
              </button>
              <button
                onClick={() => setShowComplianceModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
