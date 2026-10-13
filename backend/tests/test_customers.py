import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.state_store import state_store

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_teardown():
    state_store.set_global_stop(False)
    # Reset all customer balances before each test
    client.post("/api/v1/customers/reset-all")
    yield

def test_get_customers_seeded():
    response = client.get("/api/v1/customers")
    assert response.status_code == 200
    customers = response.json()
    assert len(customers) >= 4
    ids = [c["id"] for c in customers]
    assert "cust_arjun_01" in ids
    assert "cust_priya_02" in ids
    assert "cust_vikram_03" in ids
    assert "cust_neha_04" in ids

def test_simulate_normal_customer_payment():
    payload = {
        "customer_id": "cust_arjun_01",
        "agent_id": "agent_payment_01",
        "action": "payment:create",
        "amount": 5000.0,
        "recipient": "verified_merchant_switch",
        "context": {"time": "14:00", "frequency": 1}
    }
    response = client.post("/api/v1/customers/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] == "ALLOW"
    assert data["settled"] is True
    assert data["previous_balance"] == 75000.0
    assert data["new_balance"] == 70000.0
    assert data["balance_delta"] == -5000.0

def test_simulate_loan_disbursement_credit():
    payload = {
        "customer_id": "cust_priya_02",
        "agent_id": "agent_loan_02",
        "action": "loan:disburse",
        "amount": 15000.0,
        "context": {"time": "14:00", "frequency": 1}
    }
    response = client.post("/api/v1/customers/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] == "ALLOW"
    assert data["settled"] is True
    assert data["previous_balance"] == 120000.0
    assert data["new_balance"] == 135000.0
    assert data["balance_delta"] == 15000.0

def test_simulate_flagged_kyc_customer_triggers_human_approval():
    payload = {
        "customer_id": "cust_vikram_03",
        "agent_id": "agent_payment_01",
        "action": "payment:create",
        "amount": 6000.0,
        "recipient": "unverified_crypto_corp",
        "context": {"time": "14:00"}
    }
    response = client.post("/api/v1/customers/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Customer has FLAGGED KYC and HIGH risk tier, plus unverified recipient
    assert data["decision"] == "HUMAN_APPROVAL"
    assert data["risk_score"] >= 75
    assert data["settled"] is False
    assert data["new_balance"] == 450000.0  # Balance not deducted pending review

def test_simulate_insufficient_funds_overdraft_block():
    payload = {
        "customer_id": "cust_neha_04",
        "agent_id": "agent_payment_01",
        "action": "payment:create",
        "amount": 5000.0,  # Neha has only 1500
        "recipient": "verified_merchant_switch"
    }
    response = client.post("/api/v1/customers/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] == "DENY"
    assert data["settled"] is False
    assert "insufficient" in data["reason"].lower()
    assert data["new_balance"] == 1500.0

def test_reset_customer_balance():
    # Make a payment first
    payload = {
        "customer_id": "cust_arjun_01",
        "agent_id": "agent_payment_01",
        "action": "payment:create",
        "amount": 5000.0
    }
    client.post("/api/v1/customers/simulate", json=payload)
    
    # Check balance changed
    c_res = client.get("/api/v1/customers/cust_arjun_01")
    assert c_res.json()["balance"] == 70000.0
    
    # Reset
    reset_res = client.post("/api/v1/customers/cust_arjun_01/reset")
    assert reset_res.status_code == 200
    assert reset_res.json()["balance"] == 75000.0
