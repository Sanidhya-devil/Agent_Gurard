"""
AgentGuard SDK Exceptions
Fail-closed security error hierarchy for autonomous agents.
"""

class AgentGuardException(Exception):
    """Base exception for all AgentGuard governance errors."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}

class PolicyDeniedException(AgentGuardException):
    """
    Raised when an agent action is strictly DENIED fail-closed by policy,
    RBAC permissions, single/daily budget cap, or security sanitization.
    """
    def __init__(self, reason: str, risk_score: int = 100, gate_failure: str = None, details: dict = None):
        super().__init__(f"AgentGuard Policy DENIED: {reason} (Risk: {risk_score})", details)
        self.reason = reason
        self.risk_score = risk_score
        self.gate_failure = gate_failure

class HumanApprovalRequiredException(AgentGuardException):
    """
    Raised when an action is flagged as HIGH RISK and requires human dual-custody approval
    in the AgentGuard Approval Queue before execution can proceed.
    """
    def __init__(self, approval_id: str, reason: str, risk_score: int, risk_factors: list = None, details: dict = None):
        super().__init__(
            f"AgentGuard Escalation: Human approval required (Approval ID: {approval_id}, Risk: {risk_score}). Reason: {reason}",
            details
        )
        self.approval_id = approval_id
        self.reason = reason
        self.risk_score = risk_score
        self.risk_factors = risk_factors or []

class KillSwitchActiveException(AgentGuardException):
    """
    Raised when the global emergency Kill Switch has been tripped or engaged by an operator.
    All autonomous agent actions are unconditionally frozen fail-closed.
    """
    def __init__(self, reason: str = "Global emergency stop is ACTIVE. All agent operations are blocked.", details: dict = None):
        super().__init__(f"AgentGuard KILL SWITCH ACTIVE: {reason}", details)
        self.reason = reason

class AuthenticationFailedException(AgentGuardException):
    """Raised when agent credentials or API key validation fails."""
    def __init__(self, reason: str = "Invalid agent credentials or inactive agent account.", details: dict = None):
        super().__init__(f"AgentGuard Authentication Failed: {reason}", details)
        self.reason = reason
