import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.agent import Agent
from app.models.policy import AgentPermission, Permission
from app.schemas.agent import AgentCreate, AgentUpdate, AgentResponse
from app.services.revocation_service import revocation_service
from app.services.budget_service import budget_service
from app.services.audit_service import audit_service

router = APIRouter()

def _serialize_agent(db: Session, agent: Agent) -> AgentResponse:
    perms = [p.permission_id for p in agent.permissions]
    spent, remaining = budget_service.get_budget_status(agent.id, agent.daily_limit, agent.transaction_limit)
    return AgentResponse(
        id=agent.id,
        name=agent.name,
        type=agent.type,
        status=agent.status,
        risk_level=agent.risk_level,
        daily_limit=agent.daily_limit,
        transaction_limit=agent.transaction_limit,
        api_key=agent.api_key,
        description=agent.description,
        created_at=agent.created_at,
        updated_at=agent.updated_at,
        permissions=perms,
        spent_today=spent,
        remaining_today=remaining
    )

@router.get("", response_model=List[AgentResponse])
def get_agents(db: Session = Depends(get_db)):
    agents = db.query(Agent).order_by(Agent.created_at.desc()).all()
    return [_serialize_agent(db, a) for a in agents]

@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
def register_agent(data: AgentCreate, db: Session = Depends(get_db)):
    existing = db.query(Agent).filter(Agent.id == data.id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Agent ID '{data.id}' already exists")

    api_key = f"agent_key_{data.id}_{uuid.uuid4().hex[:8]}"
    agent = Agent(
        id=data.id,
        name=data.name,
        type=data.type,
        status="ACTIVE",
        risk_level=data.risk_level,
        daily_limit=data.daily_limit,
        transaction_limit=data.transaction_limit,
        api_key=api_key,
        description=data.description
    )
    db.add(agent)
    db.commit()

    # Add permissions
    for perm_id in data.permissions:
        ap = AgentPermission(
            id=str(uuid.uuid4()),
            agent_id=agent.id,
            permission_id=perm_id
        )
        db.add(ap)
    db.commit()
    db.refresh(agent)

    audit_service.log_event(
        db=db,
        agent_id=agent.id,
        action="agent:register",
        decision="ALLOW",
        reason=f"Registered autonomous agent '{agent.name}' ({agent.id})",
        risk_score=0,
        request_data={"agent_id": agent.id, "type": agent.type, "limits": [agent.daily_limit, agent.transaction_limit]}
    )

    return _serialize_agent(db, agent)

@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return _serialize_agent(db, agent)

@router.put("/{agent_id}", response_model=AgentResponse)
def update_agent(agent_id: str, data: AgentUpdate, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if data.name is not None:
        agent.name = data.name
    if data.daily_limit is not None:
        agent.daily_limit = data.daily_limit
    if data.transaction_limit is not None:
        agent.transaction_limit = data.transaction_limit
    if data.description is not None:
        agent.description = data.description
    if data.risk_level is not None:
        agent.risk_level = data.risk_level

    db.commit()
    db.refresh(agent)
    return _serialize_agent(db, agent)

@router.post("/{agent_id}/revoke")
def revoke_agent(agent_id: str, db: Session = Depends(get_db)):
    ok = revocation_service.revoke_agent(db, agent_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    audit_service.log_event(
        db=db,
        agent_id=agent_id,
        action="agent:revoke",
        decision="REVOKED",
        reason=f"Security admin revoked agent '{agent_id}' in real-time",
        risk_score=100,
        request_data={"agent_id": agent_id, "status": "REVOKED"}
    )
    return {"status": "SUCCESS", "message": f"Agent '{agent_id}' has been REVOKED", "agent_id": agent_id}

@router.post("/{agent_id}/activate")
def activate_agent(agent_id: str, db: Session = Depends(get_db)):
    ok = revocation_service.activate_agent(db, agent_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Agent not found")

    audit_service.log_event(
        db=db,
        agent_id=agent_id,
        action="agent:activate",
        decision="ACTIVATED",
        reason=f"Security admin reactivated agent '{agent_id}'",
        risk_score=0,
        request_data={"agent_id": agent_id, "status": "ACTIVE"}
    )
    return {"status": "SUCCESS", "message": f"Agent '{agent_id}' has been ACTIVATED", "agent_id": agent_id}
