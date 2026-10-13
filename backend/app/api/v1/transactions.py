from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.models.transaction import Transaction

router = APIRouter()

@router.get("")
def get_transactions(
    agent_id: Optional[str] = Query(None),
    decision: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)
    if agent_id:
        query = query.filter(Transaction.agent_id == agent_id)
    if decision:
        query = query.filter(Transaction.decision == decision)
    if status:
        query = query.filter(Transaction.status == status)

    txs = query.order_by(Transaction.created_at.desc()).limit(limit).all()
    return [
        {
            "id": t.id,
            "agent_id": t.agent_id,
            "action": t.action,
            "amount": t.amount,
            "currency": t.currency,
            "recipient": t.recipient,
            "risk_score": t.risk_score,
            "risk_level": t.risk_level,
            "decision": t.decision,
            "status": t.status,
            "reason": t.reason,
            "simulated_tx_id": t.simulated_tx_id,
            "created_at": t.created_at
        }
        for t in txs
    ]
