import datetime
from sqlalchemy import Column, String, Float, DateTime
from app.database.connection import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    account_number = Column(String(50), unique=True, nullable=False)
    account_type = Column(String(30), default="SAVINGS")  # SAVINGS, CURRENT, WEALTH, OFFSHORE
    balance = Column(Float, default=50000.0)
    initial_balance = Column(Float, default=50000.0)
    kyc_status = Column(String(30), default="VERIFIED")   # VERIFIED, PENDING, FLAGGED
    risk_tier = Column(String(30), default="LOW")         # LOW, MEDIUM, HIGH
    currency = Column(String(10), default="INR")
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), onupdate=lambda: datetime.datetime.now(datetime.timezone.utc))

