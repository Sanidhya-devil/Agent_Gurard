from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.agent import Agent
from app.schemas.budget import BudgetResponse, BudgetUpdate
from app.services.budget_service import budget_service
from app.services.audit_service import audit_service

router = APIRouter()

@router.get("/agents/{agent_id}/budget", response_model=BudgetResponse)
def get_agent_budget(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    spent, remaining = budget_service.get_budget_status(agent.id, agent.daily_limit, agent.transaction_limit)
    return BudgetResponse(
        agent_id=agent.id,
        daily_limit=agent.daily_limit,
        transaction_limit=agent.transaction_limit,
        spent_today=spent,
        remaining_today=remaining
    )

@router.put("/agents/{agent_id}/budget", response_model=BudgetResponse)
def update_agent_budget(agent_id: str, data: BudgetUpdate, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent.daily_limit = data.daily_limit
    agent.transaction_limit = data.transaction_limit
    db.commit()
    db.refresh(agent)

    audit_service.log_event(
        db=db,
        agent_id=agent.id,
        action="budget:update",
        decision="ALLOW",
        reason=f"Updated budget limits: Daily limit ₹{data.daily_limit:,.2f}, Per-Tx limit ₹{data.transaction_limit:,.2f}",
        risk_score=0,
        request_data={"agent_id": agent.id, "daily_limit": data.daily_limit, "transaction_limit": data.transaction_limit}
    )

    spent, remaining = budget_service.get_budget_status(agent.id, agent.daily_limit, agent.transaction_limit)
    return BudgetResponse(
        agent_id=agent.id,
        daily_limit=agent.daily_limit,
        transaction_limit=agent.transaction_limit,
        spent_today=spent,
        remaining_today=remaining
    )
