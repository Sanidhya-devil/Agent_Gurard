from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import datetime

class PermissionBase(BaseModel):
    id: str
    name: str
    description: Optional[str] = None

class PermissionResponse(PermissionBase):
    model_config = ConfigDict(from_attributes=True)

class AgentBase(BaseModel):
    name: str
    type: str = "PAYMENT"
    risk_level: str = "LOW"
    daily_limit: float = Field(default=50000.0, ge=0)
    transaction_limit: float = Field(default=10000.0, ge=0)
    description: Optional[str] = None

class AgentCreate(AgentBase):
    id: str
    permissions: List[str] = []

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    daily_limit: Optional[float] = None
    transaction_limit: Optional[float] = None
    description: Optional[str] = None
    risk_level: Optional[str] = None

class AgentResponse(AgentBase):
    id: str
    status: str
    api_key: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    permissions: List[str] = []
    spent_today: float = 0.0
    remaining_today: float = 0.0

    model_config = ConfigDict(from_attributes=True)
