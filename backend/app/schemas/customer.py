from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
import datetime

class CustomerBase(BaseModel):
    name: str
    email: str
    account_number: str
    account_type: str = "SAVINGS"
    balance: float = 50000.0
    initial_balance: float = 50000.0
    kyc_status: str = "VERIFIED"  # VERIFIED, PENDING, FLAGGED
    risk_tier: str = "LOW"        # LOW, MEDIUM, HIGH
    currency: str = "INR"

class CustomerCreate(BaseModel):
    name: str
    email: str
    account_number: Optional[str] = None
    account_type: str = "SAVINGS"
    balance: float = Field(default=50000.0, ge=0)
    kyc_status: str = "VERIFIED"
    risk_tier: str = "LOW"
    currency: str = "INR"

class CustomerResponse(CustomerBase):
    id: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)


class CustomerSimulateRequest(BaseModel):
    customer_id: str
    agent_id: str = "agent_payment_01"
    action: str = Field(default="payment:create", description="e.g. payment:create, loan:disburse, payment:refund")
    amount: float = Field(default=5000.0, gt=0)
    recipient: Optional[str] = Field(default=None, description="Merchant or destination counterparty")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)

class CustomerSimulateResponse(BaseModel):
    success: bool
    decision: str  # ALLOW, DENY, HUMAN_APPROVAL
    customer_id: str
    customer_name: str
    account_number: str
    previous_balance: float
    new_balance: float
    balance_delta: float
    action: str
    amount: float
    currency: str
    settled: bool
    risk_score: int
    risk_level: str
    reason: str
    risk_factors: List[str] = []
    simulated_tx_id: Optional[str] = None
    approval_id: Optional[str] = None
    message: str
