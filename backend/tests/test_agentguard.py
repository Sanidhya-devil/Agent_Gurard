import pytest
from app.database.state_store import state_store

def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_scenario_1_normal_authorized_transaction(client):
    """PRD Scenario 1: Normal authorized payment within budget and permissions"""
    payload = {
        "agent_id": "agent_payment_01",
        "action": "payment:create",
        "amount": 5000.0,
        "currency": "INR",
        "recipient": "verified_merchant_amazon",
        "context": {"frequency": 1, "time": "14:00"}
    }
    headers = {"Authorization": "Bearer agent_key_payment_sec_001"}
    res = client.post("/api/v1/authorize", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["decision"] == "ALLOW"
    assert data["risk_level"] in ["LOW", "MEDIUM"]
    assert data["simulated_tx_id"] is not None
    assert data["remaining_budget"] is not None

def test_scenario_2_budget_limit_violation(client):
    """PRD Scenario 2: Payment exceeds transaction limit (₹15,000 > ₹10,000)"""
    payload = {
        "agent_id": "agent_payment_01",
        "action": "payment:create",
        "amount": 15000.0,
        "currency": "INR",
        "recipient": "vendor_corp",
        "context": {}
    }
    headers = {"Authorization": "Bearer agent_key_payment_sec_001"}
    res = client.post("/api/v1/authorize", json=payload, headers=headers)
    assert res.status_code == 403
    data = res.json()["detail"]
    assert data["decision"] == "DENY"
    assert "exceeds per-transaction limit" in data["reason"]

def test_unauthorized_permission_denial(client):
    """PaymentAgent attempts to disburse loan (least-privilege RBAC violation)"""
    payload = {
        "agent_id": "agent_payment_01",
        "action": "loan:disburse",
        "amount": 2000.0,
        "currency": "INR",
        "recipient": "borrower_123",
        "context": {}
    }
    headers = {"Authorization": "Bearer agent_key_payment_sec_001"}
    res = client.post("/api/v1/authorize", json=payload, headers=headers)
    assert res.status_code == 403
    data = res.json()["detail"]
    assert data["decision"] == "DENY"
    assert "does not possess required permission" in data["reason"]

def test_scenario_3_suspicious_ai_activity_human_approval(client):
    """PRD Scenario 3: Contextual anomaly triggers High Risk and routes to human approval"""
    payload = {
        "agent_id": "agent_payment_01",
        "action": "payment:create",
        "amount": 9000.0,
        "currency": "INR",
        "recipient": "crypto_unverified_temp_wallet",
        "context": {"frequency": 8, "time": "02:30"}
    }
    headers = {"Authorization": "Bearer agent_key_payment_sec_001"}
    res = client.post("/api/v1/authorize", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["decision"] == "HUMAN_APPROVAL"
    assert data["risk_score"] >= 75
    assert data["risk_level"] == "HIGH"
    assert data["approval_id"] is not None

    # Verify approval exists in queue
    appr_res = client.get("/api/v1/approvals")
    assert appr_res.status_code == 200
    approvals = appr_res.json()
    found = [a for a in approvals if a["id"] == data["approval_id"]]
    assert len(found) == 1

def test_scenario_4_emergency_kill_switch(client):
    """PRD Scenario 4: Emergency stop engages fail-closed shutdown across all agents"""
    # Trigger emergency stop
    stop_res = client.post("/api/v1/admin/emergency-stop")
    assert stop_res.status_code == 200
    assert stop_res.json()["global_stop"] is True

    # Any agent request must now fail immediately
    payload = {
        "agent_id": "agent_payment_01",
        "action": "payment:create",
        "amount": 100.0,
        "currency": "INR",
        "recipient": "merchant_normal",
        "context": {}
    }
    headers = {"Authorization": "Bearer agent_key_payment_sec_001"}
    res = client.post("/api/v1/authorize", json=payload, headers=headers)
    assert res.status_code == 403
    assert res.json()["detail"]["decision"] == "DENY"
    assert "emergency stop is ACTIVE" in res.json()["detail"]["reason"]

    # Release emergency stop
    rel_res = client.post("/api/v1/admin/emergency-stop/release")
    assert rel_res.status_code == 200
    assert rel_res.json()["global_stop"] is False

    # Now requests can succeed again
    res2 = client.post("/api/v1/authorize", json=payload, headers=headers)
    assert res2.status_code == 200
    assert res2.json()["decision"] == "ALLOW"

def test_real_time_revocation(client):
    """PRD Goal G4: Revoking an agent immediately blocks future requests"""
    agent_id = "agent_refund_03"
    payload = {
        "agent_id": agent_id,
        "action": "payment:refund",
        "amount": 500.0,
        "currency": "INR",
        "recipient": "customer_456",
        "context": {}
    }
    headers = {"Authorization": "Bearer agent_key_refund_sec_003"}

    # Initially works
    res1 = client.post("/api/v1/authorize", json=payload, headers=headers)
    assert res1.status_code == 200
    assert res1.json()["decision"] == "ALLOW"

    # Revoke agent
    rev_res = client.post(f"/api/v1/agents/{agent_id}/revoke")
    assert rev_res.status_code == 200

    # Subsequent request is blocked
    res2 = client.post("/api/v1/authorize", json=payload, headers=headers)
    assert res2.status_code == 403
    assert res2.json()["detail"]["decision"] == "DENY"
    assert "is REVOKED" in res2.json()["detail"]["reason"]

    # Reactivate agent
    act_res = client.post(f"/api/v1/agents/{agent_id}/activate")
    assert act_res.status_code == 200

    # Works again
    res3 = client.post("/api/v1/authorize", json=payload, headers=headers)
    assert res3.status_code == 200
    assert res3.json()["decision"] == "ALLOW"

def test_audit_logs_recorded(client):
    """PRD Goal G6: Every action generates an immutable audit log"""
    audit_res = client.get("/api/v1/audit")
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) > 0
    first_log = logs[0]
    assert "event_id" in first_log
    assert "agent_id" in first_log
    assert "decision" in first_log
    assert "timestamp" in first_log

def test_simulator_demo_endpoint(client):
    """Tests the built-in demo scenarios 1 to 5 via simulator endpoint"""
    for s_id in [1, 2, 3, 4, 5]:
        res = client.post(f"/api/v1/simulator/demo-scenario/{s_id}")
        assert res.status_code == 200
        assert res.json()["scenario"] == s_id

def test_analytics_endpoint(client):
    """Verifies analytics endpoint delivers decision, risk, budget and timeline telemetry"""
    res = client.get("/api/v1/admin/analytics")
    assert res.status_code == 200
    data = res.json()
    assert "decisions" in data
    assert "risk_tiers" in data
    assert "agent_budgets" in data
    assert "timeline" in data
    assert len(data["decisions"]) == 3
    assert len(data["risk_tiers"]) == 3
