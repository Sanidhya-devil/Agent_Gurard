export interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'ACTIVE' | 'REVOKED' | 'SUSPENDED';
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  daily_limit: number;
  transaction_limit: number;
  api_key: string;
  description?: string;
  created_at: string;
  updated_at: string;
  permissions: string[];
  spent_today: number;
  remaining_today: number;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
}

export interface Transaction {
  id: string;
  agent_id: string;
  action: string;
  amount: number;
  currency: string;
  recipient: string;
  risk_score: number;
  risk_level: string;
  decision: 'ALLOW' | 'DENY' | 'HUMAN_APPROVAL';
  status: 'EXECUTED' | 'BLOCKED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  reason?: string;
  simulated_tx_id?: string;
  created_at: string;
}

export interface ApprovalRequest {
  id: string;
  transaction_id: string;
  agent_id: string;
  action: string;
  amount: number;
  currency: string;
  recipient: string;
  risk_score: number;
  risk_reasons: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  operator_notes?: string;
  created_at: string;
  decided_at?: string;
}

export interface AuditLog {
  id: string;
  event_id: string;
  agent_id: string;
  action: string;
  resource: string;
  request_data: string;
  decision: string;
  reason: string;
  risk_score: number;
  timestamp: string;
}

export interface DashboardStats {
  total_agents: number;
  active_agents: number;
  revoked_agents: number;
  allowed_actions: number;
  blocked_actions: number;
  high_risk_actions: number;
  pending_approvals: number;
  total_spent_today: number;
  global_stop: boolean;
}

export interface EmergencyStatus {
  global_stop: boolean;
  status: 'NORMAL' | 'STOPPED';
  message: string;
}

export interface ChartItem {
  name: string;
  value: number;
  color: string;
}

export interface AgentBudgetItem {
  name: string;
  agent_id: string;
  daily_limit: number;
  spent: number;
  remaining: number;
  utilization_pct: number;
}

export interface TimelinePoint {
  time: string;
  allowed: number;
  blocked: number;
  high_risk: number;
}

export interface AnalyticsData {
  decisions: ChartItem[];
  risk_tiers: ChartItem[];
  agent_budgets: AgentBudgetItem[];
  timeline: TimelinePoint[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  account_number: string;
  account_type: 'SAVINGS' | 'CURRENT' | 'WEALTH' | 'OFFSHORE' | string;
  balance: number;
  initial_balance: number;
  kyc_status: 'VERIFIED' | 'PENDING' | 'FLAGGED';
  risk_tier: 'LOW' | 'MEDIUM' | 'HIGH';
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerCreateInput {
  name: string;
  email: string;
  account_number?: string;
  account_type: string;
  balance: number;
  kyc_status: string;
  risk_tier: string;
  currency: string;
}

export interface CustomerSimulateResult {
  success: boolean;
  decision: 'ALLOW' | 'DENY' | 'HUMAN_APPROVAL';
  customer_id: string;
  customer_name: string;
  account_number: string;
  previous_balance: number;
  new_balance: number;
  balance_delta: number;
  action: string;
  amount: number;
  currency: string;
  settled: boolean;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  risk_factors: string[];
  simulated_tx_id?: string;
  approval_id?: string;
  message: string;
}

