from pydantic import BaseModel, ConfigDict
from typing import Optional
import datetime

class AuditLogResponse(BaseModel):
    id: str
    event_id: str
    agent_id: str
    action: str
    resource: str
    request_data: str
    decision: str
    reason: str
    risk_score: int
    timestamp: datetime.datetime
    previous_hash: Optional[str] = None
    current_hash: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

