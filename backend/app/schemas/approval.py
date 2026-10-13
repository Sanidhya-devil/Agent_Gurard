from pydantic import BaseModel, ConfigDict
from typing import Optional
import datetime

class ApprovalDecisionRequest(BaseModel):
    decision: str # "APPROVED" or "REJECTED"
    operator_notes: Optional[str] = "Operator review"

class ApprovalResponse(BaseModel):
    id: str
    transaction_id: str
    agent_id: str
    action: str
    amount: float
    currency: str
    recipient: str
    risk_score: int
    risk_reasons: str
    status: str
    operator_notes: Optional[str] = None
    created_at: datetime.datetime
    decided_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)
