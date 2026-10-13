import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.policy import Permission, AgentPermission
from app.models.agent import Agent
from app.schemas.agent import PermissionResponse
from app.services.audit_service import audit_service

router = APIRouter()

@router.get("", response_model=List[PermissionResponse])
def get_all_permissions(db: Session = Depends(get_db)):
    return db.query(Permission).all()

@router.post("/agents/{agent_id}/permissions")
def assign_permission(agent_id: str, payload: dict, db: Session = Depends(get_db)):
    permission_id = payload.get("permission_id")
    if not permission_id:
        raise HTTPException(status_code=400, detail="permission_id is required")

    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    perm = db.query(Permission).filter(Permission.id == permission_id).first()
    if not perm:
        # Create permission if dynamic
        perm = Permission(id=permission_id, name=permission_id, description=f"Dynamic permission {permission_id}")
        db.add(perm)
        db.commit()

    existing = db.query(AgentPermission).filter(
        AgentPermission.agent_id == agent_id,
        AgentPermission.permission_id == permission_id
    ).first()

    if not existing:
        ap = AgentPermission(
            id=str(uuid.uuid4()),
            agent_id=agent_id,
            permission_id=permission_id
        )
        db.add(ap)
        db.commit()

    audit_service.log_event(
        db=db,
        agent_id=agent_id,
        action="permission:grant",
        decision="ALLOW",
        reason=f"Granted permission '{permission_id}' to agent '{agent_id}'",
        risk_score=0,
        request_data={"agent_id": agent_id, "permission_id": permission_id}
    )

    return {"status": "SUCCESS", "message": f"Permission '{permission_id}' granted to '{agent_id}'"}

@router.delete("/agents/{agent_id}/permissions/{permission_id}")
def revoke_permission(agent_id: str, permission_id: str, db: Session = Depends(get_db)):
    existing = db.query(AgentPermission).filter(
        AgentPermission.agent_id == agent_id,
        AgentPermission.permission_id == permission_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()

    audit_service.log_event(
        db=db,
        agent_id=agent_id,
        action="permission:revoke",
        decision="ALLOW",
        reason=f"Revoked permission '{permission_id}' from agent '{agent_id}'",
        risk_score=0,
        request_data={"agent_id": agent_id, "permission_id": permission_id}
    )

    return {"status": "SUCCESS", "message": f"Permission '{permission_id}' revoked from '{agent_id}'"}
