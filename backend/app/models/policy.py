from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime
from app.database.connection import Base

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(String(64), primary_key=True, index=True) # e.g. "payment:create"
    name = Column(String(128), nullable=False)
    description = Column(String(256), nullable=True)

class AgentPermission(Base):
    __tablename__ = "agent_permissions"

    id = Column(String(64), primary_key=True)
    agent_id = Column(String(64), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    permission_id = Column(String(64), ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    agent = relationship("Agent", back_populates="permissions")
    permission = relationship("Permission")
