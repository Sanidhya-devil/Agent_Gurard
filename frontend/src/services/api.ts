import {
  Agent,
  Permission,
  Transaction,
  ApprovalRequest,
  AuditLog,
  DashboardStats,
  EmergencyStatus,
  AnalyticsData,
  Customer,
  CustomerCreateInput,
  CustomerSimulateResult,
  ChainVerificationResult,
  ComplianceReport,
} from '../types';

const API_BASE = '/api/v1';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail?.reason || errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // Admin & Emergency
  getStats: async (): Promise<DashboardStats> => {
    const res = await fetch(`${API_BASE}/admin/stats`);
    return handleResponse<DashboardStats>(res);
  },

  getAnalytics: async (): Promise<AnalyticsData> => {
    const res = await fetch(`${API_BASE}/admin/analytics`);
    return handleResponse<AnalyticsData>(res);
  },

  getEmergencyStatus: async (): Promise<EmergencyStatus> => {
    const res = await fetch(`${API_BASE}/admin/emergency-stop`);
    return handleResponse<EmergencyStatus>(res);
  },

  triggerEmergencyStop: async (): Promise<{ status: string; message: string }> => {
    const res = await fetch(`${API_BASE}/admin/emergency-stop`, { method: 'POST' });
    return handleResponse(res);
  },

  releaseEmergencyStop: async (): Promise<{ status: string; message: string }> => {
    const res = await fetch(`${API_BASE}/admin/emergency-stop/release`, { method: 'POST' });
    return handleResponse(res);
  },

  // Agents
  getAgents: async (): Promise<Agent[]> => {
    const res = await fetch(`${API_BASE}/agents`);
    return handleResponse<Agent[]>(res);
  },

  registerAgent: async (agent: Partial<Agent> & { permissions?: string[] }): Promise<Agent> => {
    const res = await fetch(`${API_BASE}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent)
    });
    return handleResponse<Agent>(res);
  },

  revokeAgent: async (agentId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/agents/${agentId}/revoke`, { method: 'POST' });
    return handleResponse(res);
  },

  activateAgent: async (agentId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/agents/${agentId}/activate`, { method: 'POST' });
    return handleResponse(res);
  },

  updateBudget: async (agentId: string, dailyLimit: number, transactionLimit: number): Promise<any> => {
    const res = await fetch(`${API_BASE}/agents/${agentId}/budget`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ daily_limit: dailyLimit, transaction_limit: transactionLimit })
    });
    return handleResponse(res);
  },

  // Permissions
  getPermissions: async (): Promise<Permission[]> => {
    const res = await fetch(`${API_BASE}/permissions`);
    return handleResponse<Permission[]>(res);
  },

  assignPermission: async (agentId: string, permissionId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/permissions/agents/${agentId}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permission_id: permissionId })
    });
    return handleResponse(res);
  },

  revokePermission: async (agentId: string, permissionId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/permissions/agents/${agentId}/permissions/${permissionId}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  // Transactions
  getTransactions: async (limit = 50): Promise<Transaction[]> => {
    const res = await fetch(`${API_BASE}/transactions?limit=${limit}`);
    return handleResponse<Transaction[]>(res);
  },

  // Approvals
  getApprovals: async (status?: string): Promise<ApprovalRequest[]> => {
    const url = status ? `${API_BASE}/approvals?status=${status}` : `${API_BASE}/approvals`;
    const res = await fetch(url);
    return handleResponse<ApprovalRequest[]>(res);
  },

  decideApproval: async (approvalId: string, decision: 'APPROVED' | 'REJECTED', notes?: string): Promise<ApprovalRequest> => {
    const res = await fetch(`${API_BASE}/approvals/${approvalId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, operator_notes: notes })
    });
    return handleResponse<ApprovalRequest>(res);
  },

  // Audit Logs
  getAuditLogs: async (filters: { agent_id?: string; decision?: string; action?: string; limit?: number } = {}): Promise<AuditLog[]> => {
    const params = new URLSearchParams();
    if (filters.agent_id) params.append('agent_id', filters.agent_id);
    if (filters.decision) params.append('decision', filters.decision);
    if (filters.action) params.append('action', filters.action);
    if (filters.limit) params.append('limit', filters.limit.toString());
    const res = await fetch(`${API_BASE}/audit?${params.toString()}`);
    return handleResponse<AuditLog[]>(res);
  },

  verifyAuditChain: async (): Promise<ChainVerificationResult> => {
    const res = await fetch(`${API_BASE}/audit/verify-chain`);
    return handleResponse<ChainVerificationResult>(res);
  },

  getComplianceReport: async (): Promise<ComplianceReport> => {
    const res = await fetch(`${API_BASE}/audit/compliance-report`);
    return handleResponse<ComplianceReport>(res);
  },

  simulateAuditTamper: async (eventId?: string): Promise<{
    status: string;
    tampered_event_id: string;
    previous_reason: string;
    new_reason: string;
    message: string;
  }> => {
    const url = eventId
      ? `${API_BASE}/audit/simulate-tamper?event_id=${encodeURIComponent(eventId)}`
      : `${API_BASE}/audit/simulate-tamper`;
    const res = await fetch(url, { method: 'POST' });
    return handleResponse(res);
  },

  repairAuditChain: async (): Promise<{
    status: string;
    recomputed_records: number;
    verification: ChainVerificationResult;
  }> => {
    const res = await fetch(`${API_BASE}/audit/repair-chain`, { method: 'POST' });
    return handleResponse(res);
  },

  downloadAuditCsv: () => {
    window.open(`${API_BASE}/audit/export/csv`, '_blank');
  },

  // Sandbox Demo Scenarios
  runDemoScenario: async (scenarioId: number): Promise<any> => {
    const res = await fetch(`${API_BASE}/simulator/demo-scenario/${scenarioId}`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  // Direct Authorization Simulation
  authorizeAction: async (payload: {
    agent_id: string;
    action: string;
    amount: number;
    currency: string;
    recipient: string;
    context?: any;
  }, apiKey?: string): Promise<any> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    const res = await fetch(`${API_BASE}/authorize`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  // Fake Customer Management & Transaction Simulation
  getCustomers: async (): Promise<Customer[]> => {
    const res = await fetch(`${API_BASE}/customers`);
    return handleResponse<Customer[]>(res);
  },

  getCustomer: async (customerId: string): Promise<Customer> => {
    const res = await fetch(`${API_BASE}/customers/${customerId}`);
    return handleResponse<Customer>(res);
  },

  createCustomer: async (data: CustomerCreateInput): Promise<Customer> => {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<Customer>(res);
  },

  resetCustomer: async (customerId: string): Promise<Customer> => {
    const res = await fetch(`${API_BASE}/customers/${customerId}/reset`, {
      method: 'POST'
    });
    return handleResponse<Customer>(res);
  },

  resetAllCustomers: async (): Promise<Customer[]> => {
    const res = await fetch(`${API_BASE}/customers/reset-all`, {
      method: 'POST'
    });
    return handleResponse<Customer[]>(res);
  },

  simulateCustomerTransaction: async (payload: {
    customer_id: string;
    agent_id: string;
    action: string;
    amount: number;
    recipient?: string;
    context?: any;
  }): Promise<CustomerSimulateResult> => {
    const res = await fetch(`${API_BASE}/customers/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<CustomerSimulateResult>(res);
  },

  // Red Team Attack Battery
  getRedTeamVectors: async (): Promise<{ status: string; vectors: any[] }> => {
    const res = await fetch(`${API_BASE}/redteam/vectors`);
    return handleResponse(res);
  },

  executeRedTeamVector: async (vectorId: string, customMemo?: string): Promise<{ status: string; vector_id: string; result: any }> => {
    const res = await fetch(`${API_BASE}/redteam/execute/${vectorId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_memo: customMemo }),
    });
    return handleResponse(res);
  },

  runRedTeamBattery: async (): Promise<{ status: string; report: any }> => {
    const res = await fetch(`${API_BASE}/redteam/run-battery`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  resetRedTeamFleet: async (): Promise<{ status: string; fleet: any }> => {
    const res = await fetch(`${API_BASE}/redteam/reset`, {
      method: 'POST',
    });
    return handleResponse(res);
  }
};


