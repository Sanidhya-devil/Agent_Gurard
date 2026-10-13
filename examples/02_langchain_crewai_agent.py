"""
AgentGuard Framework Adapter Demo: LangChain & CrewAI Tool Governance
Shows how to wrap tools in multi-agent frameworks to enforce fail-closed governance.
"""
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import requests
from agentguard import (
    AgentGuard,
    AgentGuardTool,
    PolicyDeniedException,
    HumanApprovalRequiredException,
)

BASE_URL = "http://127.0.0.1:8000"

# Reset baseline state
requests.post(f"{BASE_URL}/api/v1/admin/emergency-stop/release")
requests.post(f"{BASE_URL}/api/v1/budget/reset-all")

print("=" * 75)
print("  AGENTGUARD FRAMEWORK ADAPTER: LANGCHAIN & CREWAI TOOL GOVERNANCE")
print("=" * 75)

# 1. Define raw agent capability functions
def execute_bank_wire(recipient: str, amount: float):
    return f"Bank Wire sent: ₹{amount:,.2f} disbursed to {recipient}"

def issue_customer_refund(recipient: str, amount: float):
    return f"Refund Credit: ₹{amount:,.2f} refunded to customer {recipient}"

# 2. Instantiate AgentGuard client
guard_payment = AgentGuard(
    agent_id="agent_payment_01",
    api_key="agent_key_payment_sec_001",
    base_url=BASE_URL
)

guard_refund = AgentGuard(
    agent_id="agent_refund_03",
    api_key="agent_key_refund_sec_003",
    base_url=BASE_URL
)

# 3. Wrap functions with AgentGuardTool (compatible with LangChain BaseTool and CrewAI Tool)
payment_tool = AgentGuardTool(
    name="WireTransferTool",
    description="Disburses automated vendor and contractor payments",
    action="payment:create",
    func=execute_bank_wire,
    guard=guard_payment,
    amount_key="amount",
    recipient_key="recipient"
)

refund_tool = AgentGuardTool(
    name="CustomerRefundTool",
    description="Issues authorized dispute resolution refunds to customer cards",
    action="payment:refund",
    func=issue_customer_refund,
    guard=guard_refund,
    amount_key="amount",
    recipient_key="recipient"
)

# 4. Simulate LangChain/CrewAI Agent Tool Invocations
print("\n▶ [Simulating CrewAI PaymentAgent executing authorized tool call...]")
try:
    res = payment_tool.run(recipient="supplier_hardware_ltd", amount=4500.0)
    print("  🛡️ Tool executed successfully:")
    print(f"     • Output: {res['output']}")
    print(f"     • Governance Receipt: {res['governance_receipt']}")
except Exception as e:
    print(f"  ❌ Error: {e}")

print("\n▶ [Simulating Rogue LLM Agent attempting overdraft via Tool Call (₹15,000)...]")
try:
    res = payment_tool.run(recipient="crypto_offshore_mixer", amount=15000.0)
    print("  ❌ UNEXPECTED: Tool should have been blocked!")
except PolicyDeniedException as e:
    print(f"  🛡️ [FAIL-CLOSED BLOCKED]: Tool call intercepted by AgentGuard!")
    print(f"     • Reason: {e.reason}")
    print(f"     • Risk Score: {e.risk_score}/100")
    print(f"     • Action execution prevented before touching payment rails.")

print("\n▶ [Simulating RefundAgent executing authorized refund within policy caps...]")
try:
    res = refund_tool.run(recipient="customer_priya_sharma", amount=1200.0)
    print("  🛡️ Tool executed successfully:")
    print(f"     • Output: {res['output']}")
    print(f"     • Governance Receipt: {res['governance_receipt']}")
except Exception as e:
    print(f"  ❌ Error: {e}")

print("\n" + "=" * 75)
print("  ✅ FRAMEWORK TOOL WRAPPER VERIFICATION COMPLETE")
print("=" * 75)
