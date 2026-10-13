import uuid
import json
import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog

class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        agent_id: str,
        action: str,
        decision: str,
        reason: str,
        risk_score: int,
        request_data: Dict[str, Any],
        resource: str = "financial_system:core_banking"
    ) -> AuditLog:
        """
        Emits an immutable audit log entry for every governance evaluation.
        """
        event_id = f"evt_{uuid.uuid4().hex[:12]}"
        
        audit_entry = AuditLog(
            id=str(uuid.uuid4()),
            event_id=event_id,
            agent_id=agent_id,
            action=action,
            resource=resource,
            request_data=json.dumps(request_data, default=str),
            decision=decision,
            reason=reason,
            risk_score=risk_score,
            timestamp=datetime.datetime.utcnow()
        )
        
        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)
        return audit_entry

audit_service = AuditService()
