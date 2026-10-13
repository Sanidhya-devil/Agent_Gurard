from sqlalchemy import Column, String, Integer, DateTime, Text
import datetime
from app.database.connection import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True, index=True)
    event_id = Column(String(64), unique=True, index=True, nullable=False) # e.g. "evt_123..."
    agent_id = Column(String(64), index=True, nullable=False)
    action = Column(String(64), nullable=False)
    resource = Column(String(128), default="financial_system", nullable=False)
    request_data = Column(Text, nullable=False) # JSON string representation
    decision = Column(String(32), nullable=False) # ALLOW, DENY, HUMAN_APPROVAL
    reason = Column(Text, nullable=False)
    risk_score = Column(Integer, default=0, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
