from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import datetime
from app.database.connection import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(64), primary_key=True, index=True) # e.g. "tx_01abc..."
    agent_id = Column(String(64), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(64), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(8), default="INR", nullable=False)
    recipient = Column(String(128), nullable=False)
    risk_score = Column(Integer, default=0, nullable=False)
    risk_level = Column(String(32), default="LOW", nullable=False) # LOW, MEDIUM, HIGH
    decision = Column(String(32), nullable=False) # ALLOW, DENY, HUMAN_APPROVAL
    status = Column(String(32), default="PENDING", nullable=False) # EXECUTED, BLOCKED, PENDING_APPROVAL, APPROVED, REJECTED
    reason = Column(Text, nullable=True)
    simulated_tx_id = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    agent = relationship("Agent", back_populates="transactions")
    approval_request = relationship("ApprovalRequest", back_populates="transaction", uselist=False, cascade="all, delete-orphan")

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(String(64), primary_key=True, index=True) # e.g. "appr_01abc..."
    transaction_id = Column(String(64), ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, unique=True)
    agent_id = Column(String(64), nullable=False, index=True)
    action = Column(String(64), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(8), default="INR", nullable=False)
    recipient = Column(String(128), nullable=False)
    risk_score = Column(Integer, default=0, nullable=False)
    risk_reasons = Column(Text, nullable=False)
    status = Column(String(32), default="PENDING", nullable=False) # PENDING, APPROVED, REJECTED
    operator_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    decided_at = Column(DateTime, nullable=True)

    transaction = relationship("Transaction", back_populates="approval_request")
