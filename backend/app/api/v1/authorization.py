import uuid
import datetime
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database.connection import get_db
from app.database.state_store import state_store
from app.schemas.authorization import AuthorizeRequest, AuthorizeResponse
from app.models.transaction import Transaction
from app.services.auth_service import auth_service
from app.services.policy_service import policy_service
from app.services.budget_service import budget_service
from app.services.risk_service import risk_service
from app.services.revocation_service import revocation_service
from app.services.approval_service import approval_service
from app.services.simulator_service import simulator_service
from app.services.audit_service import audit_service
from app.core.config import settings

router = APIRouter()

@router.post("/authorize", response_model=AuthorizeResponse)
def authorize_agent_action(
    req: AuthorizeRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Central governance evaluation pipeline for autonomous financial agents.
    Enforces authentication -> global kill switch -> revocation -> permissions -> budget -> AI risk -> simulator.
    """
    req_dict = req.model_dump()
    tx_id = f"tx_{uuid.uuid4().hex[:12]}"

    # 1. Agent Authentication
    auth_ok, agent, auth_msg = auth_service.authenticate_agent(db, req.agent_id, authorization)
    if not auth_ok:
        audit_service.log_event(
            db=db,
            agent_id=req.agent_id,
            action=req.action,
            decision="DENY",
            reason=auth_msg,
            risk_score=100,
            request_data=req_dict
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"decision": "DENY", "reason": auth_msg, "risk_score": 100}
        )

    # 2. Global Emergency Kill Switch (Fail-Closed)
    if state_store.get_global_stop():
        reason = "Global emergency stop is ACTIVE. All agent operations are blocked."
        audit_service.log_event(
            db=db,
            agent_id=agent.id,
            action=req.action,
            decision="DENY",
            reason=reason,
            risk_score=100,
            request_data=req_dict
        )
        tx = Transaction(
            id=tx_id,
            agent_id=agent.id,
            action=req.action,
            amount=req.amount,
            currency=req.currency,
            recipient=req.recipient,
            risk_score=100,
            risk_level="HIGH",
            decision="DENY",
            status="BLOCKED",
            reason=reason
        )
        db.add(tx)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"decision": "DENY", "reason": reason, "risk_score": 100}
        )

    # 3. Agent Revocation Check
    if revocation_service.is_agent_revoked(agent.id) or agent.status == "REVOKED":
        reason = f"Agent '{agent.id}' is REVOKED. Financial requests rejected."
        audit_service.log_event(
            db=db,
            agent_id=agent.id,
            action=req.action,
            decision="DENY",
            reason=reason,
            risk_score=100,
            request_data=req_dict
        )
        tx = Transaction(
            id=tx_id,
            agent_id=agent.id,
            action=req.action,
            amount=req.amount,
            currency=req.currency,
            recipient=req.recipient,
            risk_score=100,
            risk_level="HIGH",
            decision="DENY",
            status="BLOCKED",
            reason=reason
        )
        db.add(tx)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"decision": "DENY", "reason": reason, "risk_score": 100}
        )

    # 4. Least-Privilege Permission Check (RBAC)
    perm_ok, perm_msg = policy_service.check_permission(db, agent.id, req.action)
    if not perm_ok:
        audit_service.log_event(
            db=db,
            agent_id=agent.id,
            action=req.action,
            decision="DENY",
            reason=perm_msg,
            risk_score=0,
            request_data=req_dict
        )
        tx = Transaction(
            id=tx_id,
            agent_id=agent.id,
            action=req.action,
            amount=req.amount,
            currency=req.currency,
            recipient=req.recipient,
            risk_score=0,
            risk_level="LOW",
            decision="DENY",
            status="BLOCKED",
            reason=perm_msg
        )
        db.add(tx)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"decision": "DENY", "reason": perm_msg, "risk_score": 0}
        )

    # 5. Dynamic Budget Check (Pre-check limit limits)
    spent_today, remaining_today = budget_service.get_budget_status(agent.id, agent.daily_limit, agent.transaction_limit)
    if req.amount > agent.transaction_limit:
        reason = f"Transaction amount ₹{req.amount:,.2f} exceeds per-transaction limit ₹{agent.transaction_limit:,.2f}"
        audit_service.log_event(
            db=db,
            agent_id=agent.id,
            action=req.action,
            decision="DENY",
            reason=reason,
            risk_score=0,
            request_data=req_dict
        )
        tx = Transaction(
            id=tx_id,
            agent_id=agent.id,
            action=req.action,
            amount=req.amount,
            currency=req.currency,
            recipient=req.recipient,
            risk_score=0,
            risk_level="LOW",
            decision="DENY",
            status="BLOCKED",
            reason=reason
        )
        db.add(tx)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"decision": "DENY", "reason": reason, "risk_score": 0}
        )

    if spent_today + req.amount > agent.daily_limit:
        reason = f"Transaction amount ₹{req.amount:,.2f} exceeds remaining daily budget ₹{remaining_today:,.2f} (Limit ₹{agent.daily_limit:,.2f})"
        audit_service.log_event(
            db=db,
            agent_id=agent.id,
            action=req.action,
            decision="DENY",
            reason=reason,
            risk_score=0,
            request_data=req_dict
        )
        tx = Transaction(
            id=tx_id,
            agent_id=agent.id,
            action=req.action,
            amount=req.amount,
            currency=req.currency,
            recipient=req.recipient,
            risk_score=0,
            risk_level="LOW",
            decision="DENY",
            status="BLOCKED",
            reason=reason
        )
        db.add(tx)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"decision": "DENY", "reason": reason, "risk_score": 0}
        )

    # 6. AI Risk Assessment Engine
    risk_res = risk_service.evaluate_risk(
        db=db,
        agent=agent,
        action=req.action,
        amount=req.amount,
        recipient=req.recipient,
        context=req.context or {}
    )

    # 7. Decision Engine
    if risk_res.score >= settings.RISK_HIGH_THRESHOLD:
        # HUMAN APPROVAL REQUIRED
        tx = Transaction(
            id=tx_id,
            agent_id=agent.id,
            action=req.action,
            amount=req.amount,
            currency=req.currency,
            recipient=req.recipient,
            risk_score=risk_res.score,
            risk_level=risk_res.level,
            decision="HUMAN_APPROVAL",
            status="PENDING_APPROVAL",
            reason=risk_res.reason
        )
        db.add(tx)
        db.commit()

        approval = approval_service.create_approval_request(
            db=db,
            transaction=tx,
            risk_score=risk_res.score,
            risk_reasons=risk_res.reason
        )

        audit_service.log_event(
            db=db,
            agent_id=agent.id,
            action=req.action,
            decision="HUMAN_APPROVAL",
            reason=risk_res.reason,
            risk_score=risk_res.score,
            request_data=req_dict
        )

        return AuthorizeResponse(
            decision="HUMAN_APPROVAL",
            risk_score=risk_res.score,
            risk_level=risk_res.level,
            reason=risk_res.reason,
            transaction_id=tx.id,
            approval_id=approval.id,
            risk_factors=risk_res.factors
        )

    # If within safe bounds: Atomically reserve/consume budget and execute simulator
    budget_ok, budget_msg, remaining = budget_service.check_and_reserve(
        agent_id=agent.id,
        amount=req.amount,
        daily_limit=agent.daily_limit,
        transaction_limit=agent.transaction_limit
    )
    if not budget_ok:
        audit_service.log_event(
            db=db,
            agent_id=agent.id,
            action=req.action,
            decision="DENY",
            reason=budget_msg,
            risk_score=risk_res.score,
            request_data=req_dict
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"decision": "DENY", "reason": budget_msg, "risk_score": risk_res.score}
        )

    # Execute via Simulator
    sim_res = simulator_service.execute_financial_action(
        action=req.action,
        amount=req.amount,
        currency=req.currency,
        recipient=req.recipient,
        agent_id=agent.id
    )

    tx = Transaction(
        id=tx_id,
        agent_id=agent.id,
        action=req.action,
        amount=req.amount,
        currency=req.currency,
        recipient=req.recipient,
        risk_score=risk_res.score,
        risk_level=risk_res.level,
        decision="ALLOW",
        status="EXECUTED",
        reason="Permission and budget validated",
        simulated_tx_id=sim_res["simulated_tx_id"]
    )
    db.add(tx)
    db.commit()

    audit_service.log_event(
        db=db,
        agent_id=agent.id,
        action=req.action,
        decision="ALLOW",
        reason="Permission and budget validated",
        risk_score=risk_res.score,
        request_data=req_dict
    )

    return AuthorizeResponse(
        decision="ALLOW",
        risk_score=risk_res.score,
        risk_level=risk_res.level,
        reason="Permission and budget validated",
        transaction_id=tx.id,
        simulated_tx_id=sim_res["simulated_tx_id"],
        remaining_budget=remaining,
        risk_factors=risk_res.factors
    )
