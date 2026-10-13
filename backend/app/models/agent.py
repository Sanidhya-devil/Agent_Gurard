from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.orm import relationship
import datetime
from app.database.connection import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    type = Column(String(64), nullable=False)  # PAYMENT, LOAN, REFUND, SUPPORT
    status = Column(String(32), default="ACTIVE", nullable=False)  # ACTIVE, REVOKED, SUSPENDED
    risk_level = Column(String(32), default="LOW", nullable=False)  # LOW, MEDIUM, HIGH
    daily_limit = Column(Float, default=50000.0, nullable=False)
    transaction_limit = Column(Float, default=10000.0, nullable=False)
    api_key = Column(String(128), unique=True, index=True, nullable=False)
    description = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    permissions = relationship("AgentPermission", back_populates="agent", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="agent", cascade="all, delete-orphan")
