from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.database.connection import get_db
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogResponse
from app.services.audit_service import audit_service

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
    # Ensure columns and hashes are initialized
    audit_service.ensure_schema(db)
    
    query = db.query(AuditLog)

    if agent_id:
        query = query.filter(AuditLog.agent_id == agent_id)
    if decision:
        query = query.filter(AuditLog.decision == decision)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()
    return logs

@router.get("/verify-chain")
def verify_audit_ledger_chain(db: Session = Depends(get_db)):
    """
    Audits every link in the cryptographic SHA-256 hash chain from genesis to tip.
    Guarantees tamper-evidence and regulatory compliance.
    """
    return audit_service.verify_chain(db)

@router.get("/compliance-report")
def get_regulatory_compliance_report(db: Session = Depends(get_db)):
    """
    Generates a full compliance audit dossier formatted for RBI Cyber Security & Basel III review.
    """
    return audit_service.generate_compliance_report(db)

@router.get("/export/csv")
def export_audit_csv(db: Session = Depends(get_db)):
    """
    Direct CSV download of the complete cryptographically hashed audit ledger.
    """
    report = audit_service.generate_compliance_report(db)
    return Response(
        content=report["csv_export"],
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=agentguard_audit_ledger.csv"}
    )

@router.post("/backfill-hashes")
def backfill_audit_hashes(db: Session = Depends(get_db)):
    """
    Backfills and calculates cryptographic hashes for any historical records.
    """
    count = audit_service.backfill_hashes(db)
    return {
        "status": "SUCCESS",
        "backfilled_records": count,
        "verification": audit_service.verify_chain(db)
    }

@router.post("/simulate-tamper")
def simulate_ledger_tampering(event_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    DEMO TOOL: Intentionally alters an audit record directly in the DB
    to demonstrate real-time cryptographic tamper detection.
    """
    return audit_service.simulate_tamper(db, target_event_id=event_id)

@router.post("/repair-chain")
def repair_audit_chain(db: Session = Depends(get_db)):
    """
    Heals and re-anchors the hash chain after a demonstration tamper test.
    """
    count = audit_service.backfill_hashes(db)
    return {
        "status": "REPAIRED",
        "recomputed_records": count,
        "verification": audit_service.verify_chain(db)
    }
