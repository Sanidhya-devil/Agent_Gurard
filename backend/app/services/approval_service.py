import uuid
import datetime
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.transaction import Transaction, ApprovalRequest
from app.services.budget_service import budget_service
from app.services.simulator_service import simulator_service
from app.services.audit_service import audit_service
from app.models.agent import Agent

class ApprovalService:
    @staticmethod
    def create_approval_request(
        db: Session,
        transaction: Transaction,
        risk_score: int,
        risk_reasons: str
    ) -> ApprovalRequest:
        approval = ApprovalRequest(
            id=f"appr_{uuid.uuid4().hex[:12]}",
            transaction_id=transaction.id,
            agent_id=transaction.agent_id,
            action=transaction.action,
            amount=transaction.amount,
            currency=transaction.currency,
            recipient=transaction.recipient,
            risk_score=risk_score,
            risk_reasons=risk_reasons,
            status="PENDING",
            created_at=datetime.datetime.utcnow()
        )
        db.add(approval)
        db.commit()
        db.refresh(approval)
        return approval

    @staticmethod
    def resolve_approval(
        db: Session,
        approval_id: str,
        decision: str, # "APPROVED" or "REJECTED"
        operator_notes: Optional[str] = None
    ) -> Tuple[bool, str, Optional[ApprovalRequest]]:
        approval = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_id).first()
        if not approval:
            return False, f"Approval request '{approval_id}' not found", None
        
        if approval.status != "PENDING":
            return False, f"Approval request '{approval_id}' has already been resolved ({approval.status})", approval

        transaction = db.query(Transaction).filter(Transaction.id == approval.transaction_id).first()
        if not transaction:
            return False, "Linked transaction not found", None

        agent = db.query(Agent).filter(Agent.id == approval.agent_id).first()
        if not agent:
            return False, "Agent not found", None

        approval.status = decision
        approval.operator_notes = operator_notes or f"Manual operator {decision.lower()}"
        approval.decided_at = datetime.datetime.utcnow()

        if decision == "APPROVED":
            # Consume budget now
            budget_ok, budget_msg, _ = budget_service.check_and_reserve(
                agent_id=agent.id,
                amount=transaction.amount,
                daily_limit=agent.daily_limit,
                transaction_limit=agent.transaction_limit
            )
            if not budget_ok:
                approval.status = "REJECTED"
                approval.operator_notes = f"Approval aborted: {budget_msg}"
                transaction.status = "BLOCKED"
                transaction.reason = budget_msg
                db.commit()
                return False, f"Cannot approve: {budget_msg}", approval

            # Execute via simulator
            sim_result = simulator_service.execute_financial_action(
                action=transaction.action,
                amount=transaction.amount,
                currency=transaction.currency,
                recipient=transaction.recipient,
                agent_id=agent.id
            )
            transaction.status = "EXECUTED"
            transaction.simulated_tx_id = sim_result["simulated_tx_id"]
            transaction.decision = "ALLOW"
            transaction.reason = f"Approved by operator: {approval.operator_notes}"
            
            audit_service.log_event(
                db=db,
                agent_id=agent.id,
                action=transaction.action,
                decision="ALLOW",
                reason=f"Human operator approved high-risk request: {operator_notes}",
                risk_score=approval.risk_score,
                request_data={"approval_id": approval.id, "transaction_id": transaction.id, "amount": transaction.amount}
            )
        else: # REJECTED
            transaction.status = "REJECTED"
            transaction.decision = "DENY"
            transaction.reason = f"Rejected by human operator: {operator_notes}"
            
            audit_service.log_event(
                db=db,
                agent_id=agent.id,
                action=transaction.action,
                decision="DENY",
                reason=f"Human operator rejected transaction: {operator_notes}",
                risk_score=approval.risk_score,
                request_data={"approval_id": approval.id, "transaction_id": transaction.id, "amount": transaction.amount}
            )

        db.commit()
        db.refresh(approval)
        return True, f"Approval request {decision.lower()} successfully", approval

approval_service = ApprovalService()
