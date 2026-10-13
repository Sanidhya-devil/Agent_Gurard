"""
AgentGuard Framework Adapters
Turnkey wrappers for LangChain, CrewAI, and OpenAI tool calls.
"""
from typing import Any, Callable, Dict, Optional
from agentguard.client import AgentGuard

class AgentGuardTool:
    """
    Wraps any standard Python function or LangChain BaseTool with AgentGuard governance.
    
    Usage:
        protected_payment_tool = AgentGuardTool(
            name="send_vendor_payment",
            description="Transfers funds to a supplier account",
            action="payment:create",
            func=raw_payment_function,
            guard=guard
        )
    """
    def __init__(
        self,
        name: str,
        description: str,
        action: str,
        func: Callable[..., Any],
        guard: Optional[AgentGuard] = None,
        amount_key: str = "amount",
        recipient_key: str = "recipient",
    ):
        self.name = name
        self.description = description
        self.action = action
        self.func = func
        self.guard = guard or AgentGuard()
        self.amount_key = amount_key
        self.recipient_key = recipient_key

    def __call__(self, *args, **kwargs):
        return self.run(*args, **kwargs)

    def run(self, *args, **kwargs):
        # Extract parameters
        amount = 0.0
        recipient = "unknown"
        
        if len(args) >= 2:
            recipient = str(args[0])
            amount = float(args[1])
        elif len(args) == 1 and isinstance(args[0], dict):
            recipient = str(args[0].get(self.recipient_key, "unknown"))
            amount = float(args[0].get(self.amount_key, 0.0))
        else:
            amount = float(kwargs.get(self.amount_key, 0.0))
            recipient = str(kwargs.get(self.recipient_key, "unknown"))

        # Authorize via AgentGuard (raises on DENY / APPROVAL / KILLSWITCH)
        receipt = self.guard.authorize(
            action=self.action,
            amount=amount,
            recipient=recipient,
            context={"tool_name": self.name}
        )

        # Execute wrapped tool
        result = self.func(*args, **kwargs)
        return {
            "output": result,
            "governance_receipt": {
                "decision": receipt.decision,
                "risk_score": receipt.risk_score,
                "simulated_tx_id": receipt.simulated_tx_id
            }
        }
