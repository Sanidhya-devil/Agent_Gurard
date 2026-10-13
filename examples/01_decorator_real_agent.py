"""
AgentGuard Real Agent SDK Demo: @protect Decorator
Demonstrates wrapping autonomous banking functions with turnkey governance.
"""
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import requests
from agentguard import (
    AgentGuard,
    protect,
    PolicyDeniedException,
    HumanApprovalRequiredException,
    KillSwitchActiveException,
)

BASE_URL = "http://127.0.0.1:8000"

# Reset baseline state before running demo
requests.post(f"{BASE_URL}/api/v1/admin/emergency-stop/release")
requests.post(f"{BASE_URL}/api/v1/budget/reset-all")

print("=" * 75)
print("  AGENTGUARD PYTHON SDK: @protect DECORATOR INTERCEPTION DEMO")
print("=" * 75)

# =============================================================================
# DEFINING THE AGENT'S TOOLS WRAPPED WITH @protect
# =============================================================================

# Tool 1: Autonomous vendor payment tool (Protected by Gate 1-7)
@protect(
    action="payment:create",
    amount_arg="amount",
    recipient_arg="recipient",
    agent_id="agent_payment_01",
    api_key="agent_key_payment_sec_001",
    base_url=BASE_URL,
)
def send_vendor_payout(recipient: str, amount: float, memo: str = ""):
    """
    CRITICAL SENSITIVE FUNCTION:
    This code communicates directly with the core banking ledger.
    It will NEVER execute unless AgentGuard validates all 7 policy gates!
    """
    print(f"      [BANKING LEDGER EXECUTING]: Transferring ₹{amount:,.2f} to '{recipient}'...")
    return {
        "status": "DISBURSED",
        "beneficiary": recipient,
        "amount": amount,
        "wire_ref": f"WIRE-{recipient[:6].upper()}-990"
    }

# Tool 2: Loan disbursement tool (Restricted to LoanAgent, forbidden for PaymentAgent)
@protect(
    action="loan:disburse",
    amount_arg="amount",
    recipient_arg="recipient",
    agent_id="agent_payment_01",  # PaymentAgent trying to disburse a loan!
    api_key="agent_key_payment_sec_001",
    base_url=BASE_URL,
)
def disburse_retail_loan(recipient: str, amount: float):
    print(f"      [LOAN CORE EXECUTING]: Disbursing retail loan ₹{amount:,.2f} to '{recipient}'...")
    return {"status": "LOAN_RELEASED", "borrower": recipient, "amount": amount}


# =============================================================================
# SCENARIO EXECUTION
# =============================================================================

def test_scenario(number: int, title: str, func):
    print(f"\n▶ SCENARIO {number}: {title}")
    try:
        result = func()
        print(f"  🛡️ [AUTHORIZED & EXECUTED]: Function ran safely!")
        print(f"     • Result: {result}")
    except KillSwitchActiveException as e:
        print(f"  🚨 [KILL SWITCH INTERCEPTED]: {e.reason}")
        print(f"     • Function execution: 100% BLOCKED FAIL-CLOSED")
    except PolicyDeniedException as e:
        print(f"  🚫 [POLICY DENIED FAIL-CLOSED]: {e.reason}")
        print(f"     • Risk Score: {e.risk_score}/100")
        print(f"     • Function execution: 100% PREVENTED (Zero financial loss)")
    except HumanApprovalRequiredException as e:
        print(f"  ⏳ [HUMAN DUAL-CUSTODY REQUIRED]: Flagged as High Risk")
        print(f"     • Approval ID: {e.approval_id}")
        print(f"     • Risk Score: {e.risk_score}/100")
        print(f"     • Reason: {e.reason}")
        print(f"     • Function execution: PAUSED pending operator sign-off in Dashboard")
    except Exception as e:
        print(f"  ❌ [UNEXPECTED ERROR]: {e}")

# Scenario 1: Legitimate routine payment
test_scenario(
    1,
    "Routine Vendor Payout (₹1,500 to AWS Billing)",
    lambda: send_vendor_payout("aws_cloud_invoicing", 1500.0, "Monthly server hosting bill")
)

# Scenario 2: Single-transaction budget limit violation
test_scenario(
    2,
    "Budget Limit Violation (₹25,000 exceeds ₹10,000 transaction limit)",
    lambda: send_vendor_payout("office_furniture_bulk_corp", 25000.0, "Office renovations")
)

# Scenario 3: Privilege escalation attack
test_scenario(
    3,
    "Privilege Escalation (PaymentAgent attempts loan:disburse)",
    lambda: disburse_retail_loan("unauthorized_borrower_99", 5000.0)
)

# Scenario 4: High risk anomaly requiring Human Approval
test_scenario(
    4,
    "Suspicious Off-Hours Transaction (₹9,800 to offshore crypto wallet)",
    lambda: send_vendor_payout(
        "cayman_offshore_mixer_01",
        9800.0,
        "URGENT: Disburse before audit starts"
    )
)

# Scenario 5: Engaging Emergency Kill Switch
print("\n🚨 Operator trips Emergency Kill Switch via Control Plane...")
requests.post(f"{BASE_URL}/api/v1/admin/emergency-stop")

test_scenario(
    5,
    "Attempting Routine Payment Under Active Kill Switch (₹500 to AWS)",
    lambda: send_vendor_payout("aws_cloud_invoicing", 500.0, "Routine test payment")
)

# Scenario 6: Releasing Kill Switch and restoring fleet
print("\n🟢 Operator verifies incident resolved and disengages Kill Switch...")
requests.post(f"{BASE_URL}/api/v1/admin/emergency-stop/release")

test_scenario(
    6,
    "Routine Payment After Incident Cleared (₹500 to AWS)",
    lambda: send_vendor_payout("aws_cloud_invoicing", 500.0, "Routine test payment")
)

print("\n" + "=" * 75)
print("  ✅ @protect DECORATOR INTERCEPTION DEMO COMPLETE")
print("=" * 75)
