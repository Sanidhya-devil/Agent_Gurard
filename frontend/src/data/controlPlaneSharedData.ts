// Shared mock data source for Control Plane Overview
// Ensures all KPIs, G1-G7 Pipeline Funnel, Activity Stream Chart, and AI Risk Donut are 100% mathematically consistent.

export interface PipelineGateData {
  num: number;
  title: string;
  short: string;
  inCount: number;
  blockedCount: number;
  passedCount: number;
  latencyMs: number;
  state: 'healthy' | 'degraded' | 'tripped';
  dropOffPct: number;
  dropOffText: string;
  desc: string;
}

export interface ActivityStreamBucket {
  time: string;
  allowed: number;
  blocked: number;
  high_risk: number;
  total: number;
}

export interface RiskTierData {
  name: string;
  value: number;
  color: string;
  patternId: string;
  percentage: number;
}

// Indian Rupee currency formatter (Intl.NumberFormat 'en-IN')
export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getControlPlaneSharedData = (isEmergencyStopped: boolean = false) => {
  // 1. Chained G1-G7 Funnel:
  // Each gate's 'inCount' equals the previous gate's 'passedCount'.
  // Final gate's 'passedCount' equals 'Allowed Actions' KPI.
  // Sum of all blocked equals 'Blocked Actions' KPI.
  const pipelineGates: PipelineGateData[] = [
    {
      num: 1,
      title: 'Identity',
      short: 'API Key Hash',
      inCount: 104,
      blockedCount: 3,
      passedCount: 101, // 104 - 3
      latencyMs: 2.1,
      state: 'healthy',
      dropOffPct: 2.9,
      dropOffText: '-3 (-2.9%)',
      desc: 'Validates cryptographic Bearer token signature, agent identity registry & tenant partition hash.',
    },
    {
      num: 2,
      title: 'Kill Switch',
      short: 'Global Stop',
      inCount: 101, // = G1 passed
      blockedCount: isEmergencyStopped ? 101 : 2,
      passedCount: isEmergencyStopped ? 0 : 99, // 101 - 2
      latencyMs: 0.6,
      state: isEmergencyStopped ? 'tripped' : 'healthy',
      dropOffPct: isEmergencyStopped ? 100.0 : 2.0,
      dropOffText: isEmergencyStopped ? '-101 (-100%)' : '-2 (-2.0%)',
      desc: 'Sub-millisecond atomic state check. Fail-closed shutdown intercepts requests fleet-wide.',
    },
    {
      num: 3,
      title: 'Revocation',
      short: 'Active Check',
      inCount: isEmergencyStopped ? 0 : 99, // = G2 passed
      blockedCount: isEmergencyStopped ? 0 : 4,
      passedCount: isEmergencyStopped ? 0 : 95, // 99 - 4
      latencyMs: 1.2,
      state: 'healthy',
      dropOffPct: 4.0,
      dropOffText: '-4 (-4.0%)',
      desc: 'Checks agent lifecycle state (ACTIVE vs REVOKED). Revoked credentials rejected immediately.',
    },
    {
      num: 4,
      title: 'RBAC Scope',
      short: 'Permissions',
      inCount: isEmergencyStopped ? 0 : 95, // = G3 passed
      blockedCount: isEmergencyStopped ? 0 : 5,
      passedCount: isEmergencyStopped ? 0 : 90, // 95 - 5
      latencyMs: 2.4,
      state: 'healthy',
      dropOffPct: 5.3,
      dropOffText: '-5 (-5.3%)',
      desc: 'Least-privilege capability check against granted scopes (e.g. payment:create, loan:disburse).',
    },
    {
      num: 5,
      title: 'Budget Vault',
      short: 'Atomic Deduct',
      inCount: isEmergencyStopped ? 0 : 90, // = G4 passed
      blockedCount: isEmergencyStopped ? 0 : 6,
      passedCount: isEmergencyStopped ? 0 : 84, // 90 - 6
      latencyMs: 3.8,
      state: 'healthy',
      dropOffPct: 6.7,
      dropOffText: '-6 (-6.7%)',
      desc: 'Atomic concurrency reservation preventing race-condition overspend & per-transaction cap overflow.',
    },
    {
      num: 6,
      title: 'AI Anomaly',
      short: 'Risk Engine',
      inCount: isEmergencyStopped ? 0 : 84, // = G5 passed
      blockedCount: isEmergencyStopped ? 0 : 6, // 6 routed/blocked
      passedCount: isEmergencyStopped ? 0 : 78, // 84 - 6
      latencyMs: 16.5,
      state: 'degraded', // Anomaly engine flagged high-risk items requiring dual-custody routing
      dropOffPct: 7.1,
      dropOffText: '-6 (-7.1%)',
      desc: 'Contextual risk assessment: 15-min burst velocity, nocturnal execution, new beneficiary novelty.',
    },
    {
      num: 7,
      title: 'Settlement',
      short: 'Core Banking',
      inCount: isEmergencyStopped ? 0 : 78, // = G6 passed
      blockedCount: 0,
      passedCount: isEmergencyStopped ? 0 : 78, // EXACTLY equals Allowed Actions KPI!
      latencyMs: 11.2,
      state: 'healthy',
      dropOffPct: 0.0,
      dropOffText: '0 (0%)', // Consistent alignment with G1-G6 (Item 2)
      desc: 'Simulated core banking ledger mutation, unique settlement ID generation, immutable audit hash.',
    },
  ];

  // 2. Activity Stream: 12 discrete 15-minute buckets (10:00 to 12:45)
  // Exact bucket sums:
  // Allowed sum = 78 (matches G7 settled!)
  // Blocked sum = 26 (matches sum of G1-G6 blocked: 3 + 2 + 4 + 5 + 6 + 6 = 26!)
  // High Risk sum = 14 (matches Donut High Risk tier!)
  const activityStream: ActivityStreamBucket[] = [
    { time: '10:00', allowed: 4, blocked: 1, high_risk: 0, total: 5 },
    { time: '10:15', allowed: 5, blocked: 2, high_risk: 1, total: 7 },
    { time: '10:30', allowed: 6, blocked: 1, high_risk: 0, total: 7 },
    { time: '10:45', allowed: 5, blocked: 2, high_risk: 1, total: 7 },
    { time: '11:00', allowed: 7, blocked: 2, high_risk: 1, total: 9 },
    { time: '11:15', allowed: 6, blocked: 3, high_risk: 2, total: 9 },
    { time: '11:30', allowed: 12, blocked: 6, high_risk: 4, total: 18 }, // Realistic burst anomaly spike!
    { time: '11:45', allowed: 9, blocked: 3, high_risk: 2, total: 12 },
    { time: '12:00', allowed: 7, blocked: 2, high_risk: 1, total: 9 },
    { time: '12:15', allowed: 6, blocked: 1, high_risk: 1, total: 7 },
    { time: '12:30', allowed: 6, blocked: 2, high_risk: 1, total: 8 },
    { time: '12:45', allowed: 5, blocked: 1, high_risk: 0, total: 6 },
  ];

  const totalAllowed = activityStream.reduce((acc, b) => acc + b.allowed, 0); // 78
  const totalBlocked = activityStream.reduce((acc, b) => acc + b.blocked, 0); // 26
  const totalHighRisk = activityStream.reduce((acc, b) => acc + b.high_risk, 0); // 14
  const totalSpentToday = 145804; // ₹1,45,804

  // 3. AI Risk Tiers: total scored = 104 (78 allowed + 26 blocked)
  // Low: 68, Med: 22, High: 14 -> 68 + 22 + 14 = 104
  const riskTiers: RiskTierData[] = [
    {
      name: 'Low Risk (<40)',
      value: 68,
      color: '#10B981', // Emerald
      patternId: 'pattern-solid-green',
      percentage: 65,
    },
    {
      name: 'Medium Risk (40-74)',
      value: 22,
      color: '#F59E0B', // Amber
      patternId: 'pattern-dots-amber',
      percentage: 21,
    },
    {
      name: 'High Risk (≥75)',
      value: 14, // Matches totalHighRisk = 14!
      color: '#EF4444', // Red
      patternId: 'pattern-stripes-red',
      percentage: 14,
    },
  ];

  // 4. Policy Gate Outcomes (for bar breakdown)
  const policyOutcomes = [
    { name: 'Allowed', value: totalAllowed, color: '#10B981' },
    { name: 'Blocked', value: totalBlocked, color: '#818CF8' }, // Lightened Indigo for Blocked (WCAG AA > 4.5:1)
    { name: 'Review', value: 3, color: '#F59E0B' },
  ];

  // 5. Sparklines for KPI Cards (meaningful online progression for Active Agents)
  const sparklines = {
    activeAgents: [1, 2, 2, 3, 3, 3, 3, 3], // Progression of agents connecting & operational
    allowed: [4, 5, 6, 5, 7, 6, 12, 9, 7, 6, 6, 5],
    blocked: [1, 2, 1, 2, 2, 3, 6, 3, 2, 1, 2, 1],
    highRisk: [0, 1, 0, 1, 1, 2, 4, 2, 1, 1, 1, 0],
    spent: [12000, 24000, 39000, 52000, 71000, 89000, 118000, 145804],
    pendingReviews: [1, 2, 1, 2, 1, 4, 3, 3],
  };

  // Item 2: Shortened Active Agents health status text (Item 2)
  const degradedGateCount = pipelineGates.filter((g) => g.state === 'degraded').length;
  const trippedGateCount = pipelineGates.filter((g) => g.state === 'tripped').length;
  let activeAgentsHealthText = '3/3 online · all healthy';
  let activeAgentsIsPositive = true;

  if (trippedGateCount > 0) {
    activeAgentsHealthText = `3/3 online · ${trippedGateCount} tripped`;
    activeAgentsIsPositive = false;
  } else if (degradedGateCount > 0) {
    activeAgentsHealthText = `3/3 online · ${degradedGateCount} degraded`;
    activeAgentsIsPositive = false;
  }

  // Dev-time consistency assertions
  const sumBlockedGates = pipelineGates.reduce((acc, g) => acc + g.blockedCount, 0);
  const sumAllowedGates = pipelineGates[6].passedCount;
  const totalInflow = pipelineGates[0].inCount;
  const donutTotal = riskTiers.reduce((acc, r) => acc + r.value, 0);

  if (sumBlockedGates !== totalBlocked) {
    console.warn(
      `[AgentGuard Consistency Warning] Sum of blocked gates (${sumBlockedGates}) != Blocked KPI (${totalBlocked})`
    );
  }
  if (sumAllowedGates + sumBlockedGates !== totalInflow) {
    console.warn(
      `[AgentGuard Consistency Warning] Allowed (${sumAllowedGates}) + Blocked (${sumBlockedGates}) != Total Inflow (${totalInflow})`
    );
  }
  if (donutTotal !== totalInflow) {
    console.warn(
      `[AgentGuard Consistency Warning] Donut Total (${donutTotal}) != Total Inflow (${totalInflow})`
    );
  }

  return {
    kpis: {
      activeAgents: '3/3',
      activeAgentsSubtitle: 'Fleet status',
      activeAgentsDelta: { text: activeAgentsHealthText, isPositive: activeAgentsIsPositive },

      allowedActions: totalAllowed, // 78
      allowedSubtext: 'Cleared all 7 gates',
      allowedDelta: { text: '▲ 12% vs last hour', isPositive: true },

      blockedActions: totalBlocked, // 26
      blockedSubtext: 'Fail-closed blocked',
      blockedDelta: { text: '▼ 4% vs last hour', isPositive: false },

      highRiskActions: totalHighRisk, // 14
      highRiskSubtext: 'Anomaly score ≥ 75',
      highRiskDelta: { text: '▲ 8% vs last hour', isPositive: false },

      spentToday: totalSpentToday,
      spentTodayFormatted: formatINR(totalSpentToday), // ₹1,45,804
      spentTodaySubtext: 'Settled transactions',
      spentTodayDelta: { text: '▲ 15% vs last hour', isPositive: true },

      pendingReviews: 3,
      pendingReviewsSubtext: 'Dual-custody queue',
      pendingReviewsDelta: { text: '▲ 1 vs last hour', isPositive: false },
    },
    pipelineGates,
    activityStream,
    riskTiers,
    totalScored: 104,
    policyOutcomes,
    sparklines,
  };
};
