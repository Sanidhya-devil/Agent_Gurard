from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.models.transaction import ApprovalRequest
from app.schemas.approval import ApprovalResponse, ApprovalDecisionRequest
from app.services.approval_service import approval_service

router = APIRouter()

@router.get("", response_model=List[ApprovalResponse])
def get_approvals(
    status: Optional[str] = Query(None, description="PENDING, APPROVED, REJECTED"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(ApprovalRequest)
    if status:
        query = query.filter(ApprovalRequest.status == status)
    return query.order_by(ApprovalRequest.created_at.desc()).limit(limit).all()

@router.post("/{approval_id}/decision", response_model=ApprovalResponse)
def decide_approval(
    approval_id: str,
    payload: ApprovalDecisionRequest,
    db: Session = Depends(get_db)
):
    decision_clean = payload.decision.upper().strip()
    if decision_clean not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Decision must be either 'APPROVED' or 'REJECTED'")

    ok, msg, appr = approval_service.resolve_approval(
        db=db,
        approval_id=approval_id,
        decision=decision_clean,
        operator_notes=payload.operator_notes
    )

    if not ok:
        raise HTTPException(status_code=400, detail=msg)

    return appr
