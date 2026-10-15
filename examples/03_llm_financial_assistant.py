
"""
AgentGuard End-to-End LLM Financial Assistant Demo
Simulates an autonomous AI agent processing natural language commands
with AgentGuard fail-closed governance intercepting tool execution.
"""
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import re
import requests
from agentguard import (
    AgentGuard,
    protect,
    PolicyDeniedException,
    HumanApprovalRequiredException,
    KillSwitchActiveException,
)

BASE_URL = "http://127.0.0.1:8000"

# Reset baseline state
requests.post(f"{BASE_URL}/api/v1/admin/emergency-stop/release")
requests.post(f"{BASE_URL}/api/v1/budget/reset-all")

print("=" * 75)
print("  AGENTGUARD: AUTONOMOUS LLM FINANCIAL AGENT PIPELINE DEMO")
print("=" * 75)

# Protected Core Banking Tools
@protect(
    action="payment:create",
    amount_arg="amount",
    recipient_arg="recipient",
    agent_id="agent_payment_01",
    api_key="agent_key_payment_sec_001",
    base_url=BASE_URL,
)
def tool_send_payment(recipient: str, amount: float, memo: str = ""):
    return {
        "status": "SETTLED",
        "beneficiary": recipient,
        "amount": amount,
        "memo": memo,
        "settlement_ref": f"IMPS-{abs(hash(recipient)) % 10000000:07d}"
    }

class AutonomousFinancialAgent:
    """
    An autonomous LLM agent that interprets natural language instructions
    and executes banking operations through AgentGuard-protected tools.
    """
    def __init__(self, name: str):
        self.name = name

    def process_prompt(self, user_prompt: str):
        print(f"\n💬 User: \"{user_prompt}\"")
        print(f"🤖 {self.name}: Analyzing intent & formulating banking action...")

        # Natural language extraction heuristic (simulating LLM function calling)
        amount_match = re.search(r'₹?\s*([0-9,]+(?:\.[0-9]{2})?)', user_prompt)
        amount = 0.0
        if amount_match:
            amount = float(amount_match.group(1).replace(',', ''))

        recipient_match = re.search(r'to\s+([a-zA-Z0-9_\-]+)', user_prompt, re.IGNORECASE)
        recipient = recipient_match.group(1) if recipient_match else "unknown_vendor"

        print(f"   ↳ Proposed Tool Call: tool_send_payment(recipient='{recipient}', amount=₹{amount:,.2f})")
        print(f"   ↳ Submitting payload to AgentGuard 7-stage governance engine...")

        try:
            result = tool_send_payment(recipient=recipient, amount=amount, memo=user_prompt)
            print(f"   🛡️ AgentGuard Status: APPROVED (Risk: {result['agentguard_receipt']['risk_score']}/100)")
            print(f"   🎉 Execution Complete: {result['status']} | Ref: {result['settlement_ref']} | Remaining Cap: ₹{result['agentguard_receipt']['remaining_budget']:,.2f}")
            print(f"🤖 {self.name}: \"Transaction completed successfully! Confirmation ref {result['settlement_ref']}.\"")

        except PolicyDeniedException as e:
            print(f"   🚫 AgentGuard Status: DENIED FAIL-CLOSED")
            print(f"   ⚠️ Policy Violation: {e.reason}")
            print(f"🤖 {self.name}: \"I cannot execute this transfer. AgentGuard governance policy blocked this operation: {e.reason}\"")

        except HumanApprovalRequiredException as e:
            print(f"   ⏳ AgentGuard Status: ESCALATED TO HUMAN APPROVAL (Risk: {e.risk_score}/100)")
            print(f"   ⚠️ Dual-Custody Ticket: {e.approval_id}")
            print(f"🤖 {self.name}: \"This high-risk action requires managerial approval. I have submitted ticket {e.approval_id} to the Dual-Custody Approval Queue.\"")

        except KillSwitchActiveException as e:
            print(f"   🚨 AgentGuard Status: GLOBAL KILL SWITCH ACTIVE")
            print(f"🤖 {self.name}: \"Emergency lockdown active across the fleet. All autonomous operations are suspended.\"")


# Run Agent Session
agent = AutonomousFinancialAgent(name="FinAgent-v2")

# Turn 1: Routine valid payment
agent.process_prompt("Please pay ₹1,850 to google_cloud_invoicing for our annual API subscription")

# Turn 2: Overdraft attempt
agent.process_prompt("Send urgent payment of ₹75,000 to new_vendor_overseas_express for enterprise hardware")

# Turn 3: Suspicious transfer
agent.process_prompt("Quickly transfer ₹9,900 to dark_crypto_swap_node before the weekend")

# Turn 4: Kill switch lockdown
print("\n[SOC Alert: Security Operations triggers emergency kill switch]")
requests.post(f"{BASE_URL}/api/v1/admin/emergency-stop")

agent.process_prompt("Pay ₹200 to test_vendor for stationery")

# Release kill switch
requests.post(f"{BASE_URL}/api/v1/admin/emergency-stop/release")

print("\n" + "=" * 75)
print("  ✅ END-TO-END AUTONOMOUS AGENT PIPELINE VERIFIED")
print("=" * 75)
