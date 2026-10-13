from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import datetime

from app.database.connection import get_db
from app.database.state_store import state_store
from app.models.agent import Agent
from app.models.transaction import Transaction, ApprovalRequest
from app.models.audit import AuditLog
from app.services.audit_service import audit_service

router = APIRouter()

@router.get("/emergency-stop")
def get_emergency_stop_status():
    is_stopped = state_store.get_global_stop()
    return {
        "global_stop": is_stopped,
        "status": "STOPPED" if is_stopped else "NORMAL",
        "message": "EMERGENCY STOP IS ACTIVE! All autonomous agents are blocked." if is_stopped else "Fleet operations normal."
    }

@router.post("/emergency-stop")
def trigger_emergency_stop(db: Session = Depends(get_db)):
    state_store.set_global_stop(True)
    audit_service.log_event(
        db=db,
        agent_id="SYSTEM:ADMIN",
        action="admin:emergency_stop",
        decision="EMERGENCY_STOP",
        reason="Security Operator engaged global emergency kill switch. Fleet fail-closed stop active.",
        risk_score=100,
        request_data={"global_stop": True}
    )
    return {
        "status": "STOPPED",
        "global_stop": True,
        "message": "Global emergency kill switch engaged. All agent requests will be denied fail-closed."
    }

@router.post("/emergency-stop/release")
def release_emergency_stop(db: Session = Depends(get_db)):
    state_store.set_global_stop(False)
    audit_service.log_event(
        db=db,
        agent_id="SYSTEM:ADMIN",
        action="admin:emergency_release",
        decision="EMERGENCY_RELEASE",
        reason="Security Operator disengaged global emergency kill switch. Normal operations resumed.",
        risk_score=0,
        request_data={"global_stop": False}
    )
    return {
        "status": "NORMAL",
        "global_stop": False,
        "message": "Global emergency stop released. Fleet operations resumed."
    }

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_agents = db.query(Agent).count()
    active_agents = db.query(Agent).filter(Agent.status == "ACTIVE").count()
    revoked_agents = db.query(Agent).filter(Agent.status == "REVOKED").count()
    
    allowed_actions = db.query(Transaction).filter(Transaction.decision == "ALLOW").count()
    blocked_actions = db.query(Transaction).filter(Transaction.decision == "DENY").count()
    high_risk_actions = db.query(Transaction).filter(Transaction.risk_level == "HIGH").count()
    pending_approvals = db.query(ApprovalRequest).filter(ApprovalRequest.status == "PENDING").count()

    # Sum of spent today from allowed transactions
    today_start = datetime.datetime.combine(datetime.date.today(), datetime.time.min)
    total_spent_today = db.query(func.sum(Transaction.amount)).filter(
        Transaction.decision == "ALLOW",
        Transaction.created_at >= today_start
    ).scalar() or 0.0

    return {
        "total_agents": total_agents,
        "active_agents": active_agents,
        "revoked_agents": revoked_agents,
        "allowed_actions": allowed_actions,
        "blocked_actions": blocked_actions,
        "high_risk_actions": high_risk_actions,
        "pending_approvals": pending_approvals,
        "total_spent_today": float(total_spent_today),
        "global_stop": state_store.get_global_stop()
    }

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    # 1. Decision Breakdown
    allowed = db.query(Transaction).filter(Transaction.decision == "ALLOW").count()
    denied = db.query(Transaction).filter(Transaction.decision == "DENY").count()
    human = db.query(Transaction).filter(Transaction.decision == "HUMAN_APPROVAL").count()

    # 2. Risk Distribution
    low_risk = db.query(Transaction).filter(Transaction.risk_level == "LOW").count()
    med_risk = db.query(Transaction).filter(Transaction.risk_level == "MEDIUM").count()
    high_risk = db.query(Transaction).filter(Transaction.risk_level == "HIGH").count()

    # 3. Agent Budget Utilization
    agents = db.query(Agent).all()
    agent_budgets = []
    for a in agents:
        spent = state_store.get_spent_today(a.id)
        agent_budgets.append({
            "name": a.name,
            "agent_id": a.id,
            "daily_limit": a.daily_limit,
            "spent": spent,
            "remaining": max(0.0, a.daily_limit - spent),
            "utilization_pct": round((spent / a.daily_limit * 100), 1) if a.daily_limit > 0 else 0
        })

    # 4. Hourly / Sequence Activity Timeline (last 8 points)
    # Generate interactive timeline series from recent transactions
    recent_txs = db.query(Transaction).order_by(Transaction.created_at.desc()).limit(30).all()
    recent_txs.reverse()

    # Group into sequential intervals or display points
    timeline = []
    if recent_txs:
        # Create rolling window points
        step = max(1, len(recent_txs) // 6)
        for i in range(0, len(recent_txs), step):
            chunk = recent_txs[i:i+step]
            time_label = chunk[-1].created_at.strftime("%H:%M:%S")
            allow_cnt = sum(1 for t in chunk if t.decision == "ALLOW")
            deny_cnt = sum(1 for t in chunk if t.decision == "DENY")
            high_cnt = sum(1 for t in chunk if t.risk_level == "HIGH")
            timeline.append({
                "time": time_label,
                "allowed": allow_cnt,
                "blocked": deny_cnt,
                "high_risk": high_cnt
            })
    else:
        # Initial empty state template
        for t in ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00"]:
            timeline.append({"time": t, "allowed": 0, "blocked": 0, "high_risk": 0})

    return {
        "decisions": [
            {"name": "Allowed", "value": allowed, "color": "#10B981"},
            {"name": "Blocked", "value": denied, "color": "#EF4444"},
            {"name": "Human Approval", "value": human, "color": "#F59E0B"}
        ],
        "risk_tiers": [
            {"name": "Low Risk (0-39)", "value": low_risk, "color": "#10B981"},
            {"name": "Medium Risk (40-74)", "value": med_risk, "color": "#F59E0B"},
            {"name": "High Risk (75-100)", "value": high_risk, "color": "#EF4444"}
        ],
        "agent_budgets": agent_budgets,
        "timeline": timeline
    }
