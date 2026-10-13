"""
AgentGuard Data Models
Telemetry, receipts, and decision structures returned by AgentGuard.
"""
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

@dataclass
class AuthorizeResult:
    decision: str  # ALLOW, DENY, HUMAN_APPROVAL
    risk_score: int
    risk_level: str  # LOW, MEDIUM, HIGH
    reason: str
    transaction_id: Optional[str] = None
    simulated_tx_id: Optional[str] = None
    remaining_budget: Optional[float] = None
    risk_factors: List[str] = field(default_factory=list)
    approval_id: Optional[str] = None
    raw_response: Dict[str, Any] = field(default_factory=dict)

    @property
    def is_allowed(self) -> bool:
        return self.decision == "ALLOW"

    @property
    def is_denied(self) -> bool:
        return self.decision == "DENY"

    @property
    def requires_approval(self) -> bool:
        return self.decision == "HUMAN_APPROVAL"
