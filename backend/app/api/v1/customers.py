import uuid
import datetime
import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.models.customer import Customer
from app.models.agent import Agent
from app.schemas.customer import (
    CustomerCreate,
    CustomerResponse,
    CustomerSimulateRequest,
    CustomerSimulateResponse,
)
from app.schemas.authorization import AuthorizeRequest, AuthorizeResponse
from app.api.v1.authorization import authorize_agent_action

router = APIRouter()

@router.get("", response_model=List[CustomerResponse])
def get_customers(db: Session = Depends(get_db)):
    """List all fake customer accounts and profiles"""
    return db.query(Customer).order_by(Customer.created_at.asc()).all()

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: str, db: Session = Depends(get_db)):
    """Fetch details of a specific fake customer"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    """Create a new simulated customer account"""
    cust_id = f"cust_{uuid.uuid4().hex[:8]}"
    acc_num = payload.account_number or f"AC-{random.randint(10000000, 99999999)}"

    # Check unique account number
    existing = db.query(Customer).filter(Customer.account_number == acc_num).first()
    if existing:
        acc_num = f"AC-{random.randint(10000000, 99999999)}"

    customer = Customer(
        id=cust_id,
        name=payload.name,
        email=payload.email,
        account_number=acc_num,
        account_type=payload.account_type,
        balance=payload.balance,
        initial_balance=payload.balance,
        kyc_status=payload.kyc_status,
        risk_tier=payload.risk_tier,
        currency=payload.currency
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.post("/{customer_id}/reset", response_model=CustomerResponse)
def reset_customer_balance(customer_id: str, db: Session = Depends(get_db)):
    """Reset a customer's balance back to initial baseline"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer.balance = customer.initial_balance
    customer.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(customer)
    return customer

@router.post("/reset-all", response_model=List[CustomerResponse])
def reset_all_customer_balances(db: Session = Depends(get_db)):
    """Reset all simulated customer balances to initial baselines"""
    customers = db.query(Customer).all()
    for c in customers:
        c.balance = c.initial_balance
        c.updated_at = datetime.datetime.utcnow()
    db.commit()
    return db.query(Customer).order_by(Customer.created_at.asc()).all()

@router.post("/simulate", response_model=CustomerSimulateResponse)
def simulate_customer_transaction(req: CustomerSimulateRequest, db: Session = Depends(get_db)):
    """
    Executes an autonomous AI agent transaction with a simulated customer account.
    Validates permissions, budget caps, customer KYC status, and adjusts balances upon approval.
    """
    # 1. Look up Customer
    customer = db.query(Customer).filter(Customer.id == req.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail=f"Customer with ID '{req.customer_id}' not found.")

    # 2. Look up Agent
    agent = db.query(Agent).filter(Agent.id == req.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent with ID '{req.agent_id}' not found.")

    previous_balance = customer.balance

    # 3. Determine recipient and direction
    is_debit = (req.action == "payment:create")
    if is_debit:
        recipient = req.recipient or "verified_merchant_switch"
        # Overdraft check: verify customer has sufficient funds before authorizing
        if customer.balance < req.amount:
            return CustomerSimulateResponse(
                success=False,
                decision="DENY",
                customer_id=customer.id,
                customer_name=customer.name,
                account_number=customer.account_number,
                previous_balance=previous_balance,
                new_balance=previous_balance,
                balance_delta=0.0,
                action=req.action,
                amount=req.amount,
                currency=customer.currency,
                settled=False,
                risk_score=95,
                risk_level="HIGH",
                reason=f"Account balance insufficient. Available: ₹{previous_balance:,.2f}, Requested: ₹{req.amount:,.2f}",
                risk_factors=["Insufficient customer account balance (Overdraft blocked)"],
                simulated_tx_id=None,
                approval_id=None,
                message=f"Transaction rejected fail-closed: Insufficient funds in {customer.name}'s account."
            )
    else:
        # Credit transaction (e.g. loan disbursement or refund credit)
        recipient = customer.account_number

    # 4. Construct rich context for AgentGuard Risk & Policy Engine
    eval_context = {
        "customer_id": customer.id,
        "customer_name": customer.name,
        "customer_account": customer.account_number,
        "customer_kyc": customer.kyc_status,
        "customer_risk": customer.risk_tier,
        "customer_account_type": customer.account_type,
        "current_balance": customer.balance,
    }
    if req.context:
        eval_context.update(req.context)

    # 5. Route through AgentGuard Authorization Pipeline
    auth_req = AuthorizeRequest(
        agent_id=agent.id,
        action=req.action,
        amount=req.amount,
        currency=customer.currency,
        recipient=recipient,
        context=eval_context
    )

    try:
        auth_response = authorize_agent_action(
            req=auth_req,
            authorization=f"Bearer {agent.api_key}",
            db=db
        )
    except HTTPException as e:
        # Blocked fail-closed by policy, emergency stop, revocation, or budget limit
        detail_dict = e.detail if isinstance(e.detail, dict) else {"reason": str(e.detail)}
        return CustomerSimulateResponse(
            success=False,
            decision="DENY",
            customer_id=customer.id,
            customer_name=customer.name,
            account_number=customer.account_number,
            previous_balance=previous_balance,
            new_balance=previous_balance,
            balance_delta=0.0,
            action=req.action,
            amount=req.amount,
            currency=customer.currency,
            settled=False,
            risk_score=detail_dict.get("risk_score", 100),
            risk_level="HIGH",
            reason=detail_dict.get("reason", "Blocked by AgentGuard policy control plane"),
            risk_factors=[detail_dict.get("reason", "Policy violation")],
            simulated_tx_id=None,
            approval_id=None,
            message=f"AgentGuard blocked action: {detail_dict.get('reason', 'Policy violation')}"
        )

    # 6. Process decision
    if auth_response.decision == "ALLOW":
        if is_debit:
            customer.balance -= req.amount
            delta = -req.amount
        else:
            customer.balance += req.amount
            delta = req.amount

        customer.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(customer)

        return CustomerSimulateResponse(
            success=True,
            decision="ALLOW",
            customer_id=customer.id,
            customer_name=customer.name,
            account_number=customer.account_number,
            previous_balance=previous_balance,
            new_balance=customer.balance,
            balance_delta=delta,
            action=req.action,
            amount=req.amount,
            currency=customer.currency,
            settled=True,
            risk_score=auth_response.risk_score,
            risk_level=auth_response.risk_level,
            reason=auth_response.reason,
            risk_factors=auth_response.risk_factors,
            simulated_tx_id=auth_response.simulated_tx_id,
            approval_id=None,
            message=f"Authorized & Settled! Customer balance updated to ₹{customer.balance:,.2f}."
        )

    elif auth_response.decision == "HUMAN_APPROVAL":
        # Paused on hold pending operator review in queue
        return CustomerSimulateResponse(
            success=True,
            decision="HUMAN_APPROVAL",
            customer_id=customer.id,
            customer_name=customer.name,
            account_number=customer.account_number,
            previous_balance=previous_balance,
            new_balance=previous_balance,
            balance_delta=0.0,
            action=req.action,
            amount=req.amount,
            currency=customer.currency,
            settled=False,
            risk_score=auth_response.risk_score,
            risk_level=auth_response.risk_level,
            reason=auth_response.reason,
            risk_factors=auth_response.risk_factors,
            simulated_tx_id=None,
            approval_id=auth_response.approval_id,
            message=f"Flagged for Human Review (Risk: {auth_response.risk_score}/100). Balance placed on hold pending operator clearance."
        )

    else:
        # DENY
        return CustomerSimulateResponse(
            success=False,
            decision="DENY",
            customer_id=customer.id,
            customer_name=customer.name,
            account_number=customer.account_number,
            previous_balance=previous_balance,
            new_balance=previous_balance,
            balance_delta=0.0,
            action=req.action,
            amount=req.amount,
            currency=customer.currency,
            settled=False,
            risk_score=auth_response.risk_score,
            risk_level=auth_response.risk_level,
            reason=auth_response.reason,
            risk_factors=auth_response.risk_factors,
            simulated_tx_id=None,
            approval_id=None,
            message=f"AgentGuard Denied: {auth_response.reason}"
        )
