from pydantic import BaseModel, Field

class BudgetUpdate(BaseModel):
    daily_limit: float = Field(..., ge=0)
    transaction_limit: float = Field(..., ge=0)

class BudgetResponse(BaseModel):
    agent_id: str
    daily_limit: float
    transaction_limit: float
    spent_today: float
    remaining_today: float
