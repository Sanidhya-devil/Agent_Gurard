"""
AgentGuard Client
Turnkey Python client for connecting autonomous agents to the AgentGuard Governance Platform.
"""
import os
import requests
from typing import Dict, Any, Optional

from agentguard.models import AuthorizeResult
from agentguard.exceptions import (
    AgentGuardException,
    PolicyDeniedException,
    HumanApprovalRequiredException,
    KillSwitchActiveException,
    AuthenticationFailedException,
)

class AgentGuard:
    """
    Client for AgentGuard AI Governance Control Plane.
    
    Usage:
        guard = AgentGuard(
            agent_id="agent_payment_01",
            api_key="agent_key_payment_sec_001",
            base_url="http://127.0.0.1:8000"
        )
        receipt = guard.authorize(action="payment:create", amount=1500.0, recipient="aws_billing")
    """
    def __init__(
        self,
        agent_id: Optional[str] = None,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: float = 5.0,
        fail_closed: bool = True
    ):
        self.agent_id = agent_id or os.getenv("AGENTGUARD_AGENT_ID", "agent_payment_01")
        self.api_key = api_key or os.getenv("AGENTGUARD_API_KEY", "agent_key_payment_sec_001")
        self.base_url = (base_url or os.getenv("AGENTGUARD_BASE_URL", "http://127.0.0.1:8000")).rstrip("/")
        self.timeout = timeout
        self.fail_closed = fail_closed
        self.session = requests.Session()

    def _get_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def check_health(self) -> bool:
        """Verifies connection to AgentGuard governance backend."""
        try:
            res = self.session.get(f"{self.base_url}/health", timeout=self.timeout)
            return res.status_code == 200
        except Exception:
            return False

    def is_killswitch_active(self) -> bool:
        """Returns True if the Global Emergency Kill Switch is currently engaged."""
        try:
            res = self.session.get(f"{self.base_url}/api/v1/admin/emergency-stop", timeout=self.timeout)
            if res.status_code == 200:
                return res.json().get("global_stop", False)
            return True if self.fail_closed else False
        except Exception:
            return True if self.fail_closed else False

    def get_remaining_budget(self) -> float:
        """Returns the current remaining budget allocation for this agent."""
        try:
            res = self.session.get(f"{self.base_url}/api/v1/budget/{self.agent_id}", timeout=self.timeout)
            if res.status_code == 200:
                data = res.json()
                return data.get("remaining_daily", 0.0)
            return 0.0
        except Exception:
            return 0.0

    def authorize(
        self,
        action: str,
        amount: float,
        recipient: str,
        currency: str = "INR",
        context: Optional[Dict[str, Any]] = None,
        raise_on_deny: bool = True,
        raise_on_approval: bool = True,
    ) -> AuthorizeResult:
        """
        Submits an agent's intended action through AgentGuard's 7-stage fail-closed pipeline.
        
        Evaluates:
          Gate 1: Input & Injection Sanitization
          Gate 2: Schema & Type Validation
          Gate 3: RBAC & Permissions Policy
          Gate 4: Single-Transaction & Daily Fleet Budget Caps
          Gate 5: Concurrent Rate & Replay Guard
          Gate 6: AI Anomaly & Velocity Detector
          Gate 7: Dual-Custody Human-in-the-Loop Sign-off
        """
        payload = {
            "agent_id": self.agent_id,
            "action": action,
            "amount": float(amount),
            "currency": currency,
            "recipient": recipient,
            "context": context or {}
        }

        try:
            res = self.session.post(
                f"{self.base_url}/api/v1/authorize",
                json=payload,
                headers=self._get_headers(),
                timeout=self.timeout
            )
        except Exception as e:
            if self.fail_closed:
                raise PolicyDeniedException(
                    reason=f"AgentGuard fail-closed intercept: Connection to governance plane timed out ({str(e)})",
                    risk_score=100
                )
            raise AgentGuardException(f"Connection error: {str(e)}")

        # Handle 403 / Error responses
        if res.status_code != 200:
            err_data = {}
            try:
                err_data = res.json().get("detail", {})
            except Exception:
                pass

            reason = err_data.get("reason", f"HTTP {res.status_code}")
            risk_score = err_data.get("risk_score", 100)

            # Check if kill switch is the reason
            if "emergency stop is ACTIVE" in reason or "Kill switch active" in reason:
                raise KillSwitchActiveException(reason=reason, details=err_data)

            # Check if auth failed
            if "Authentication failed" in reason or "Invalid or missing" in reason:
                raise AuthenticationFailedException(reason=reason, details=err_data)

            # General policy denial
            if raise_on_deny:
                raise PolicyDeniedException(reason=reason, risk_score=risk_score, details=err_data)

            return AuthorizeResult(
                decision="DENY",
                risk_score=risk_score,
                risk_level="HIGH",
                reason=reason,
                raw_response=err_data
            )

        data = res.json()
        result = AuthorizeResult(
            decision=data.get("decision", "DENY"),
            risk_score=data.get("risk_score", 0),
            risk_level=data.get("risk_level", "LOW"),
            reason=data.get("reason", ""),
            transaction_id=data.get("transaction_id"),
            simulated_tx_id=data.get("simulated_tx_id"),
            remaining_budget=data.get("remaining_budget"),
            risk_factors=data.get("risk_factors", []),
            approval_id=data.get("approval_id"),
            raw_response=data
        )

        if result.decision == "DENY" and raise_on_deny:
            raise PolicyDeniedException(
                reason=result.reason,
                risk_score=result.risk_score,
                details=data
            )

        if result.decision == "HUMAN_APPROVAL" and raise_on_approval:
            raise HumanApprovalRequiredException(
                approval_id=result.approval_id or "appr_pending",
                reason=result.reason,
                risk_score=result.risk_score,
                risk_factors=result.risk_factors,
                details=data
            )

        return result
