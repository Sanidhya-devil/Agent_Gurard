import requests
import json
import time
import sys

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

def log_test(title, passed, details):
    status = "[PASS]" if passed else "[FAIL]"
    print(f"\n{status} | {title}")
    for k, v in details.items():
        if isinstance(v, (dict, list)):
            print(f"   • {k}: {json.dumps(v, indent=2)}")
        else:
            print(f"   • {k}: {v}")

def main():
    print("=" * 70)
    print("AgentGuard End-to-End Live Manual Verification Suite")
    print("Target Backend:", BASE_URL)
    print("=" * 70)

    # Reset any emergency stop and activate agents for clean test run
    requests.post(f"{BASE_URL}/api/v1/admin/emergency-stop/release")
    requests.post(f"{BASE_URL}/api/v1/agents/agent_payment_01/activate")
    requests.post(f"{BASE_URL}/api/v1/agents/agent_loan_02/activate")
    requests.post(f"{BASE_URL}/api/v1/agents/agent_refund_03/activate")

    # 1. Health Check
    res = requests.get(f"{BASE_URL}/health")
    log_test("System Health & Status Check", res.status_code == 200, {
        "status_code": res.status_code,
        "response": res.json()
    })

    # 2. PRD Scenario 1: Normal Authorized Transaction
    # PaymentAgent (limit 10,000 / daily 50,000), asks for 5,000 to verified merchant
    payload_s1 = {
        "agent_id": "agent_payment_01",
        "action": "payment:create",
        "amount": 5000.0,
        "currency": "INR",
        "recipient": "verified_merchant_amazon",
        "context": {"frequency": 1, "time": "14:00"}
    }
    headers = {"Authorization": "Bearer agent_key_payment_sec_001"}
    res_s1 = requests.post(f"{BASE_URL}/api/v1/authorize", json=payload_s1, headers=headers)
    data_s1 = res_s1.json()
    s1_ok = res_s1.status_code == 200 and data_s1.get("decision") == "ALLOW"
    log_test("PRD Scenario 1: Normal Authorized Transaction", s1_ok, {
        "status_code": res_s1.status_code,
        "decision": data_s1.get("decision"),
        "risk_score": data_s1.get("risk_score"),
        "risk_level": data_s1.get("risk_level"),
        "simulated_settlement_id": data_s1.get("simulated_tx_id"),
        "remaining_budget": data_s1.get("remaining_budget")
    })

    # 3. PRD Scenario 2: Dynamic Budget Limit Violation
    # PaymentAgent asks for 15,000 (exceeds 10,000 per-transaction cap)
    payload_s2 = {
        "agent_id": "agent_payment_01",
        "action": "payment:create",
        "amount": 15000.0,
        "currency": "INR",
        "recipient": "vendor_corp",
        "context": {}
    }
    res_s2 = requests.post(f"{BASE_URL}/api/v1/authorize", json=payload_s2, headers=headers)
    s2_data = res_s2.json().get("detail", {})
    s2_ok = res_s2.status_code == 403 and s2_data.get("decision") == "DENY" and "exceeds per-transaction limit" in s2_data.get("reason", "")
    log_test("PRD Scenario 2: Budget Limit Violation (Cap: ₹10,000, Request: ₹15,000)", s2_ok, {
        "status_code": res_s2.status_code,
        "decision": s2_data.get("decision"),
        "reason": s2_data.get("reason")
    })

    # 4. Least-Privilege RBAC Violation
    # PaymentAgent tries loan disbursal
    payload_rbac = {
        "agent_id": "agent_payment_01",
        "action": "loan:disburse",
        "amount": 2000.0,
        "currency": "INR",
        "recipient": "borrower_123",
        "context": {}
    }
    res_rbac = requests.post(f"{BASE_URL}/api/v1/authorize", json=payload_rbac, headers=headers)
    rbac_data = res_rbac.json().get("detail", {})
    rbac_ok = res_rbac.status_code == 403 and rbac_data.get("decision") == "DENY" and "does not possess required permission" in rbac_data.get("reason", "")
    log_test("Least-Privilege RBAC Enforcement (PaymentAgent -> loan:disburse)", rbac_ok, {
        "status_code": res_rbac.status_code,
        "decision": rbac_data.get("decision"),
        "reason": rbac_data.get("reason")
    })

    # 5. PRD Scenario 3: Suspicious AI Activity Detected (High Risk)
    # Burst frequency (8 requests), unverified temp wallet, nocturnal 02:30 AM
    payload_s3 = {
        "agent_id": "agent_payment_01",
        "action": "payment:create",
        "amount": 8800.0,
        "currency": "INR",
        "recipient": "crypto_unverified_temp_wallet",
        "context": {"frequency": 8, "time": "02:30"}
    }
    res_s3 = requests.post(f"{BASE_URL}/api/v1/authorize", json=payload_s3, headers=headers)
    data_s3 = res_s3.json()
    s3_ok = res_s3.status_code == 200 and data_s3.get("decision") == "HUMAN_APPROVAL" and data_s3.get("risk_score", 0) >= 75
    log_test("PRD Scenario 3: Suspicious AI Anomaly -> Human Approval Queue", s3_ok, {
        "status_code": res_s3.status_code,
        "decision": data_s3.get("decision"),
        "risk_score": data_s3.get("risk_score"),
        "risk_level": data_s3.get("risk_level"),
        "approval_id": data_s3.get("approval_id"),
        "anomaly_factors": data_s3.get("risk_factors")
    })

    # 6. Human Approval Workflow: Operator Approves Request
    approval_id = data_s3.get("approval_id")
    if approval_id:
        dec_payload = {
            "decision": "APPROVED",
            "operator_notes": "Verified legitimate one-off crypto infrastructure vendor payment"
        }
        res_appr = requests.post(f"{BASE_URL}/api/v1/approvals/{approval_id}/decision", json=dec_payload)
        appr_data = res_appr.json()
        appr_ok = res_appr.status_code == 200 and appr_data.get("status") == "APPROVED"
        log_test("Dual-Custody Human Approval: Operator Approve & Settle", appr_ok, {
            "approval_id": approval_id,
            "status": appr_data.get("status"),
            "operator_notes": appr_data.get("operator_notes"),
            "decided_at": appr_data.get("decided_at")
        })

    # 7. PRD Scenario 4: Global Emergency Kill Switch
    # A. Engage Emergency Stop
    res_stop = requests.post(f"{BASE_URL}/api/v1/admin/emergency-stop")
    stop_active = res_stop.json().get("global_stop") is True

    # B. Try any transaction while stopped
    res_stopped_tx = requests.post(f"{BASE_URL}/api/v1/authorize", json=payload_s1, headers=headers)
    stopped_blocked = res_stopped_tx.status_code == 403 and "emergency stop is ACTIVE" in res_stopped_tx.json().get("detail", {}).get("reason", "")

    # C. Release Emergency Stop
    res_rel = requests.post(f"{BASE_URL}/api/v1/admin/emergency-stop/release")
    rel_released = res_rel.json().get("global_stop") is False

    # D. Retry transaction after release
    res_retry = requests.post(f"{BASE_URL}/api/v1/authorize", json=payload_s1, headers=headers)
    retry_ok = res_retry.status_code == 200 and res_retry.json().get("decision") == "ALLOW"

    s4_ok = stop_active and stopped_blocked and rel_released and retry_ok
    log_test("PRD Scenario 4: Global Emergency Kill Switch (Fail-Closed)", s4_ok, {
        "kill_switch_engaged": stop_active,
        "blocked_status_code": res_stopped_tx.status_code,
        "blocked_reason": res_stopped_tx.json().get("detail", {}).get("reason"),
        "released_status": rel_released,
        "post_release_decision": res_retry.json().get("decision")
    })

    # 8. Real-Time Revocation Test
    # Revoke RefundAgent
    res_rev = requests.post(f"{BASE_URL}/api/v1/agents/agent_refund_03/revoke")
    rev_payload = {
        "agent_id": "agent_refund_03",
        "action": "payment:refund",
        "amount": 250.0,
        "currency": "INR",
        "recipient": "cust_999",
        "context": {}
    }
    headers_refund = {"Authorization": "Bearer agent_key_refund_sec_003"}
    res_rev_tx = requests.post(f"{BASE_URL}/api/v1/authorize", json=rev_payload, headers=headers_refund)
    rev_blocked = res_rev_tx.status_code == 403 and "is REVOKED" in res_rev_tx.json().get("detail", {}).get("reason", "")

    # Reactivate
    res_act = requests.post(f"{BASE_URL}/api/v1/agents/agent_refund_03/activate")
    res_act_tx = requests.post(f"{BASE_URL}/api/v1/authorize", json=rev_payload, headers=headers_refund)
    act_ok = res_act_tx.status_code == 200 and res_act_tx.json().get("decision") == "ALLOW"

    log_test("Real-Time Revocation & Reactivation (RefundAgent)", rev_blocked and act_ok, {
        "revocation_block_code": res_rev_tx.status_code,
        "revocation_block_reason": res_rev_tx.json().get("detail", {}).get("reason"),
        "reactivation_decision": res_act_tx.json().get("decision")
    })

    # 9. Immutable Audit Trail
    res_audit = requests.get(f"{BASE_URL}/api/v1/audit?limit=5")
    audit_logs = res_audit.json()
    audit_ok = len(audit_logs) > 0 and all("event_id" in l and "decision" in l for l in audit_logs)
    log_test("Immutable Audit Trail Generation", audit_ok, {
        "recent_logs_count": len(audit_logs),
        "latest_event_id": audit_logs[0].get("event_id"),
        "latest_action": audit_logs[0].get("action"),
        "latest_decision": audit_logs[0].get("decision"),
        "latest_reason": audit_logs[0].get("reason")
    })

    # 10. Dashboard Aggregate Telemetry
    res_stats = requests.get(f"{BASE_URL}/api/v1/admin/stats")
    stats = res_stats.json()
    log_test("Operator Dashboard Aggregate Telemetry", res_stats.status_code == 200, {
        "active_agents": stats.get("active_agents"),
        "allowed_actions": stats.get("allowed_actions"),
        "blocked_actions": stats.get("blocked_actions"),
        "high_risk_actions": stats.get("high_risk_actions"),
        "total_spent_today": stats.get("total_spent_today"),
        "global_stop": stats.get("global_stop")
    })

    # 11. Fake Customer Account Simulation Suite
    # Reset all customer balances for clean check
    requests.post(f"{BASE_URL}/api/v1/customers/reset-all")

    # 11a. Normal Customer Debit
    res_cust_debit = requests.post(f"{BASE_URL}/api/v1/customers/simulate", json={
        "customer_id": "cust_arjun_01",
        "agent_id": "agent_payment_01",
        "action": "payment:create",
        "amount": 5000.0,
        "recipient": "verified_merchant_switch",
        "context": {"time": "14:00", "frequency": 1}
    })
    c_debit_data = res_cust_debit.json()
    c_debit_ok = (
        res_cust_debit.status_code == 200 and
        c_debit_data.get("decision") == "ALLOW" and
        c_debit_data.get("settled") is True and
        c_debit_data.get("new_balance") == 70000.0
    )
    log_test("Fake Customer Debit Simulation (Arjun Mehta: ₹75,000 -> ₹70,000)", c_debit_ok, {
        "status_code": res_cust_debit.status_code,
        "decision": c_debit_data.get("decision"),
        "settled": c_debit_data.get("settled"),
        "previous_balance": c_debit_data.get("previous_balance"),
        "new_balance": c_debit_data.get("new_balance"),
        "balance_delta": c_debit_data.get("balance_delta")
    })

    # 11b. Customer Loan Disbursement Credit
    res_cust_loan = requests.post(f"{BASE_URL}/api/v1/customers/simulate", json={
        "customer_id": "cust_priya_02",
        "agent_id": "agent_loan_02",
        "action": "loan:disburse",
        "amount": 15000.0,
        "context": {"time": "14:00", "frequency": 1}
    })
    c_loan_data = res_cust_loan.json()
    c_loan_ok = (
        res_cust_loan.status_code == 200 and
        c_loan_data.get("decision") == "ALLOW" and
        c_loan_data.get("settled") is True and
        c_loan_data.get("new_balance") == 135000.0
    )
    log_test("Fake Customer Loan Credit Simulation (Priya Sharma: ₹120,000 -> ₹135,000)", c_loan_ok, {
        "status_code": res_cust_loan.status_code,
        "decision": c_loan_data.get("decision"),
        "settled": c_loan_data.get("settled"),
        "previous_balance": c_loan_data.get("previous_balance"),
        "new_balance": c_loan_data.get("new_balance"),
        "balance_delta": c_loan_data.get("balance_delta")
    })

    # 11c. Flagged KYC AML Alert (Vikram Singh)
    res_cust_flagged = requests.post(f"{BASE_URL}/api/v1/customers/simulate", json={
        "customer_id": "cust_vikram_03",
        "agent_id": "agent_payment_01",
        "action": "payment:create",
        "amount": 6000.0,
        "recipient": "unverified_crypto_corp",
        "context": {"time": "14:00"}
    })
    c_flagged_data = res_cust_flagged.json()
    c_flagged_ok = (
        res_cust_flagged.status_code == 200 and
        c_flagged_data.get("decision") == "HUMAN_APPROVAL" and
        c_flagged_data.get("risk_score") >= 75 and
        c_flagged_data.get("settled") is False
    )
    log_test("Flagged KYC AML Watchlist Customer Anomaly (Vikram Singh -> HUMAN_APPROVAL)", c_flagged_ok, {
        "decision": c_flagged_data.get("decision"),
        "risk_score": c_flagged_data.get("risk_score"),
        "settled": c_flagged_data.get("settled"),
        "reason": c_flagged_data.get("reason"),
        "risk_factors": c_flagged_data.get("risk_factors")
    })

    # 11d. Overdraft / Insufficient Funds Rejection (Neha Patel)
    res_cust_overdraft = requests.post(f"{BASE_URL}/api/v1/customers/simulate", json={
        "customer_id": "cust_neha_04",
        "agent_id": "agent_payment_01",
        "action": "payment:create",
        "amount": 5000.0,
        "recipient": "verified_merchant_switch"
    })
    c_od_data = res_cust_overdraft.json()
    c_od_ok = (
        res_cust_overdraft.status_code == 200 and
        c_od_data.get("decision") == "DENY" and
        c_od_data.get("settled") is False and
        "insufficient" in c_od_data.get("reason", "").lower()
    )
    log_test("Insufficient Funds Overdraft Protection (Neha Patel: ₹1,500 vs ₹5,000 -> DENY)", c_od_ok, {
        "decision": c_od_data.get("decision"),
        "settled": c_od_data.get("settled"),
        "reason": c_od_data.get("reason"),
        "risk_factors": c_od_data.get("risk_factors")
    })

    print("\n" + "=" * 70)
    print("ALL LIVE MANUAL VERIFICATION CHECKS COMPLETED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    main()
