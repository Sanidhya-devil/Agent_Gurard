"""
AgentGuard Decorators
Fail-closed interception wrapper for Python functions and tool calls.
"""
import functools
import inspect
from typing import Optional, Callable, Any, Dict

from agentguard.client import AgentGuard
from agentguard.models import AuthorizeResult

def protect(
    action: str,
    amount_arg: str = "amount",
    recipient_arg: str = "recipient",
    currency: str = "INR",
    agent_id: Optional[str] = None,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    inject_receipt: bool = False,
):
    """
    Decorator that protects an autonomous function or agent tool call with AgentGuard.
    
    The decorated function will NEVER execute unless all 7 governance gates pass.
    If denied or if Kill Switch is active, an exception is raised fail-closed.
    
    Example:
        @protect(action="payment:create", amount_arg="amount", recipient_arg="recipient")
        def execute_vendor_payout(recipient: str, amount: float):
            # This function ONLY executes if approved!
            return bank_api.send_wire(recipient, amount)
    """
    def decorator(fn: Callable[..., Any]):
        sig = inspect.signature(fn)

        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            # Bind arguments to parameter names
            bound_args = sig.bind(*args, **kwargs)
            bound_args.apply_defaults()
            all_args = bound_args.arguments

            # Extract amount and recipient
            amount = float(all_args.get(amount_arg, 0.0))
            recipient = str(all_args.get(recipient_arg, "unknown_recipient"))
            
            # Extract optional context
            context: Dict[str, Any] = {}
            if "context" in all_args and isinstance(all_args["context"], dict):
                context = all_args["context"]
            elif "memo" in all_args and isinstance(all_args["memo"], str):
                context["memo"] = all_args["memo"]

            # Initialize client
            guard = AgentGuard(
                agent_id=agent_id,
                api_key=api_key,
                base_url=base_url
            )

            # Enforce 7-stage governance authorization (raises on deny/approval/killswitch)
            receipt: AuthorizeResult = guard.authorize(
                action=action,
                amount=amount,
                recipient=recipient,
                currency=currency,
                context=context
            )

            # If inject_receipt is requested and function accepts it
            if inject_receipt and "_guard_receipt" in sig.parameters:
                kwargs["_guard_receipt"] = receipt
                return fn(*args, **kwargs)

            # Execute the protected function safely
            result = fn(*args, **kwargs)

            # If result is a dict, attach governance audit receipt
            if isinstance(result, dict) and "agentguard_receipt" not in result:
                result["agentguard_receipt"] = {
                    "decision": receipt.decision,
                    "risk_score": receipt.risk_score,
                    "simulated_tx_id": receipt.simulated_tx_id,
                    "remaining_budget": receipt.remaining_budget
                }

            return result

        return wrapper
    return decorator
