# AgentGuard Python SDK (`agentguard`)

> **Govern every agent. Control every action. Protect every transaction.**

`agentguard` is the official Python SDK for integrating autonomous AI agents (LangChain, CrewAI, AutoGen, LlamaIndex, OpenAI, Anthropic, Gemini) with the **AgentGuard AI Governance Control Plane**.

---

## ⚡ Quickstart in 30 Seconds

### 1. Installation

```bash
pip install agentguard
# or for local development:
pip install -e sdk/
```

### 2. Protect Any Function with `@protect`

```python
from agentguard import protect, PolicyDeniedException, HumanApprovalRequiredException

@protect(
    action="payment:create",
    amount_arg="amount",
    recipient_arg="recipient",
    agent_id="agent_payment_01",
    api_key="agent_key_payment_sec_001",
    base_url="http://127.0.0.1:8000"
)
def execute_wire_transfer(recipient: str, amount: float):
    # This core banking code ONLY runs if AgentGuard authorizes it!
    return bank_api.send_wire(recipient=recipient, amount=amount)

# Routine transfer (Authorized -> Executes)
result = execute_wire_transfer("aws_billing", 1500.0)

# Over-budget transfer (Blocked fail-closed -> Raises PolicyDeniedException)
try:
    execute_wire_transfer("bulk_supplier", 25000.0)
except PolicyDeniedException as e:
    print(f"Blocked by AgentGuard: {e.reason}")
```

---

## 🛡️ Fail-Closed Security Hierarchy

AgentGuard guarantees that uninspected actions **never** reach payment rails or sensitive endpoints:

| Exception | Cause | Agent Action |
|---|---|---|
| [`PolicyDeniedException`](#) | Policy/RBAC denial, budget cap overflow, sanitization violation | Function never executes. Zero financial loss. |
| [`HumanApprovalRequiredException`](#) | High-risk score ($\ge 75$), anomaly spike, unusual time | Paused pending dual-custody approval in Dashboard. |
| [`KillSwitchActiveException`](#) | Emergency Kill Switch engaged by operator or circuit breaker | All actions frozen immediately fail-closed. |
| [`AuthenticationFailedException`](#) | Revoked or invalid agent credentials | Access denied. |

---

## 🧩 Framework Integrations

### LangChain & CrewAI Tool Governance

```python
from agentguard import AgentGuard, AgentGuardTool

guard = AgentGuard(
    agent_id="agent_payment_01",
    api_key="agent_key_payment_sec_001"
)

# Wrap any tool
protected_tool = AgentGuardTool(
    name="WireTransferTool",
    description="Disburses automated vendor payments",
    action="payment:create",
    func=raw_payment_function,
    guard=guard,
    amount_key="amount",
    recipient_key="recipient"
)

# Pass protected_tool into your LangChain or CrewAI agent
tools = [protected_tool]
```

### Direct Programmatic Verification

```python
from agentguard import AgentGuard

guard = AgentGuard(agent_id="agent_payment_01")

# Check remaining budget
budget = guard.get_remaining_budget()
print(f"Remaining daily budget: ₹{budget:,.2f}")

# Check Kill Switch status
if guard.is_killswitch_active():
    print("Emergency stop active!")

# Manual authorization evaluation
receipt = guard.authorize(
    action="payment:create",
    amount=1500.0,
    recipient="aws_billing",
    context={"frequency": 1}
)

if receipt.is_allowed:
    print(f"Authorized! TxID: {receipt.simulated_tx_id}")
```

---

## 🏃 Running the Runnable Examples

```bash
# 1. @protect Decorator Demo
python examples/01_decorator_real_agent.py

# 2. LangChain & CrewAI Tool Governance
python examples/02_langchain_crewai_agent.py

# 3. Autonomous LLM Financial Assistant
python examples/03_llm_financial_assistant.py
```
