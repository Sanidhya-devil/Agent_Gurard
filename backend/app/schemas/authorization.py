from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class AuthorizeRequest(BaseModel):
    agent_id: str
    action: str = Field(description="e.g. payment:create, loan:disburse, payment:refund")
    amount: float = Field(default=0.0, ge=0)
    currency: str = "INR"
    recipient: str = Field(description="Recipient identifier, merchant, or account")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Contextual flags like frequency, timestamp, etc.")

class AuthorizeResponse(BaseModel):
    decision: str  # ALLOW, DENY, HUMAN_APPROVAL
    risk_score: int
    risk_level: str  # LOW, MEDIUM, HIGH
    reason: str
    transaction_id: Optional[str] = None
    simulated_tx_id: Optional[str] = None
    remaining_budget: Optional[float] = None
    risk_factors: List[str] = []
    approval_id: Optional[str] = None
