from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogResponse

router = APIRouter()

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    agent_id: Optional[str] = Query(None),
    decision: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)

    if agent_id:
        query = query.filter(AuditLog.agent_id == agent_id)
    if decision:
        query = query.filter(AuditLog.decision == decision)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()
    return logs
