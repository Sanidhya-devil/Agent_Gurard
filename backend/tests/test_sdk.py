import pytest
from agentguard import (
    AgentGuard,
    protect,
    PolicyDeniedException,
    HumanApprovalRequiredException,
    KillSwitchActiveException
)

def test_sdk_client_initialization():
    client = AgentGuard(agent_id="test_agent", api_key="test_key", base_url="http://127.0.0.1:8000")
    assert client.agent_id == "test_agent"
    assert client.api_key == "test_key"
    assert client.base_url == "http://127.0.0.1:8000"

def test_sdk_protect_decorator_execution():
    @protect(
        action="payment:create",
        amount_arg="amount",
        recipient_arg="recipient",
        agent_id="agent_payment_01",
        api_key="agent_key_payment_sec_001",
        base_url="http://127.0.0.1:8000"
    )
    def my_payment_action(recipient: str, amount: float):
        return {"status": "SUCCESS", "to": recipient, "val": amount}

    # Test allowed transaction
    res = my_payment_action("verified_vendor", 500.0)
    assert res["status"] == "SUCCESS"
    assert "agentguard_receipt" in res
    assert res["agentguard_receipt"]["decision"] == "ALLOW"

def test_sdk_protect_decorator_denial():
    @protect(
        action="payment:create",
        amount_arg="amount",
        recipient_arg="recipient",
        agent_id="agent_payment_01",
        api_key="agent_key_payment_sec_001",
        base_url="http://127.0.0.1:8000"
    )
    def my_payment_action(recipient: str, amount: float):
        return {"status": "SUCCESS"}

    # Test over-budget transaction (violates single-tx limit of 10,000)
    with pytest.raises(PolicyDeniedException) as excinfo:
        my_payment_action("unauthorized_merchant", 99999.0)
    
    assert "exceeds" in excinfo.value.reason or "budget" in excinfo.value.reason.lower()
