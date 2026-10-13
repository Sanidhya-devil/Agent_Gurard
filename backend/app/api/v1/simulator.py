from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.authorization import AuthorizeRequest
from app.api.v1.authorization import authorize_agent_action
from app.database.state_store import state_store
from app.services.revocation_service import revocation_service

router = APIRouter()

@router.post("/demo-scenario/{scenario_id}")
def trigger_demo_scenario(scenario_id: int, db: Session = Depends(get_db)):
    """
    Directly executes the 4 official demo scenarios specified in PRD Section 18:
    1: Normal Payment (₹5,000 -> ALLOW)
    2: Budget Violation (₹15,000 vs ₹10,000 limit -> BLOCK)
    3: Suspicious AI Activity (Anomaly frequency & unverified recipient -> Risk 85+ -> HUMAN APPROVAL)
    4: Emergency Stop (Fail-closed block for all agents)
    5: Revoked Agent Attempt (Instant 403)
    """
    if scenario_id == 1:
        # Reset state to normal if needed
        state_store.set_global_stop(False)
        revocation_service.activate_agent(db, "agent_payment_01")
        
        req = AuthorizeRequest(
            agent_id="agent_payment_01",
            action="payment:create",
            amount=5000.0,
            currency="INR",
            recipient="verified_vendor_corp",
            context={"frequency": 1, "time": "14:30"}
        )
        res = authorize_agent_action(req=req, authorization="Bearer agent_key_payment_sec_001", db=db)
        return {
            "scenario": 1,
            "title": "Normal Authorized Transaction",
            "description": "Standard ₹5,000 payment with valid permissions and low risk score",
            "request": req.model_dump(),
            "response": res.model_dump(),
            "expected_outcome": "ALLOW"
        }

    elif scenario_id == 2:
        # Budget violation: amount 15000 exceeds transaction limit of 10000
        req = AuthorizeRequest(
            agent_id="agent_payment_01",
            action="payment:create",
            amount=15000.0,
            currency="INR",
            recipient="vendor_corp",
            context={"frequency": 1, "time": "15:00"}
        )
        try:
            authorize_agent_action(req=req, authorization="Bearer agent_key_payment_sec_001", db=db)
            return {"scenario": 2, "unexpected": "Should have been blocked"}
        except HTTPException as e:
            return {
                "scenario": 2,
                "title": "Budget Limit Violation",
                "description": "₹15,000 transaction exceeds PaymentAgent's ₹10,000 per-transaction limit",
                "request": req.model_dump(),
                "status_code": e.status_code,
                "detail": e.detail,
                "expected_outcome": "DENY / BLOCK"
            }

    elif scenario_id == 3:
        # Suspicious AI activity: High velocity burst, unverified recipient, nocturnal hour
        state_store.set_global_stop(False)
        revocation_service.activate_agent(db, "agent_payment_01")

        req = AuthorizeRequest(
            agent_id="agent_payment_01",
            action="payment:create",
            amount=8500.0,
            currency="INR",
            recipient="crypto_unverified_temp_wallet",
            context={"frequency": 9, "time": "03:15"}
        )
        res = authorize_agent_action(req=req, authorization="Bearer agent_key_payment_sec_001", db=db)
        return {
            "scenario": 3,
            "title": "Suspicious AI Activity Detected",
            "description": "Burst velocity (9 rapid actions) + unverified recipient + nocturnal hour triggers High Risk AI scoring",
            "request": req.model_dump(),
            "response": res.model_dump(),
            "expected_outcome": "HUMAN_APPROVAL"
        }

    elif scenario_id == 4:
        # Trigger emergency stop, then test request
        state_store.set_global_stop(True)
        req = AuthorizeRequest(
            agent_id="agent_payment_01",
            action="payment:create",
            amount=1000.0,
            currency="INR",
            recipient="safe_vendor",
            context={"frequency": 1}
        )
        try:
            authorize_agent_action(req=req, authorization="Bearer agent_key_payment_sec_001", db=db)
            return {"scenario": 4, "unexpected": "Should have been blocked"}
        except HTTPException as e:
            return {
                "scenario": 4,
                "title": "Fleet Emergency Shutdown",
                "description": "Global fail-closed kill switch blocks all agent actions unconditionally",
                "request": req.model_dump(),
                "status_code": e.status_code,
                "detail": e.detail,
                "expected_outcome": "BLOCKED (FAIL-CLOSED)"
            }

    elif scenario_id == 5:
        # Revoke agent, test request
        state_store.set_global_stop(False)
        revocation_service.revoke_agent(db, "agent_payment_01")
        req = AuthorizeRequest(
            agent_id="agent_payment_01",
            action="payment:create",
            amount=500.0,
            currency="INR",
            recipient="regular_vendor",
            context={}
        )
        try:
            authorize_agent_action(req=req, authorization="Bearer agent_key_payment_sec_001", db=db)
            return {"scenario": 5, "unexpected": "Should have been blocked"}
        except HTTPException as e:
            return {
                "scenario": 5,
                "title": "Real-Time Revocation Test",
                "description": "Revoked agent request immediately denied with 403 AGENT_REVOKED",
                "request": req.model_dump(),
                "status_code": e.status_code,
                "detail": e.detail,
                "expected_outcome": "DENY (AGENT_REVOKED)"
            }

    else:
        raise HTTPException(status_code=400, detail="Scenario ID must be between 1 and 5")
