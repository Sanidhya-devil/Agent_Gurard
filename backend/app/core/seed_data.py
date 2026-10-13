import uuid
from sqlalchemy.orm import Session
from app.models.policy import Permission, AgentPermission
from app.models.agent import Agent
from app.models.customer import Customer

INITIAL_PERMISSIONS = [
    {"id": "payment:create", "name": "Create Payment", "description": "Initiate payments to recipients/merchants"},
    {"id": "payment:view", "name": "View Payment", "description": "Query payment status and balances"},
    {"id": "payment:refund", "name": "Refund Payment", "description": "Trigger transaction refunds"},
    {"id": "loan:create", "name": "Create Loan", "description": "Initiate new loan applications"},
    {"id": "loan:view", "name": "View Loan", "description": "Inspect loan status and terms"},
    {"id": "loan:disburse", "name": "Disburse Loan", "description": "Release loan funds to borrower accounts"},
    {"id": "refund:create", "name": "Create Customer Refund", "description": "Issue customer service refunds"},
]

INITIAL_AGENTS = [
    {
        "id": "agent_payment_01",
        "name": "PaymentAgent",
        "type": "PAYMENT",
        "status": "ACTIVE",
        "risk_level": "LOW",
        "daily_limit": 50000.0,
        "transaction_limit": 10000.0,
        "api_key": "agent_key_payment_sec_001",
        "description": "Autonomous merchant and vendor payment agent",
        "permissions": ["payment:create", "payment:view", "payment:refund"]
    },
    {
        "id": "agent_loan_02",
        "name": "LoanAgent",
        "type": "LOAN",
        "status": "ACTIVE",
        "risk_level": "MEDIUM",
        "daily_limit": 100000.0,
        "transaction_limit": 25000.0,
        "api_key": "agent_key_loan_sec_002",
        "description": "Autonomous retail credit and disbursement agent",
        "permissions": ["loan:create", "loan:view", "loan:disburse"]
    },
    {
        "id": "agent_refund_03",
        "name": "RefundAgent",
        "type": "REFUND",
        "status": "ACTIVE",
        "risk_level": "LOW",
        "daily_limit": 20000.0,
        "transaction_limit": 5000.0,
        "api_key": "agent_key_refund_sec_003",
        "description": "Customer support dispute and automated refund agent",
        "permissions": ["payment:refund", "payment:view"]
    }
]

INITIAL_CUSTOMERS = [
    {
        "id": "cust_arjun_01",
        "name": "Arjun Mehta",
        "email": "arjun.mehta@fintechcorp.in",
        "account_number": "AC-90812345",
        "account_type": "SAVINGS",
        "balance": 75000.0,
        "initial_balance": 75000.0,
        "kyc_status": "VERIFIED",
        "risk_tier": "LOW",
        "currency": "INR",
    },
    {
        "id": "cust_priya_02",
        "name": "Priya Sharma",
        "email": "priya.sharma@retailventures.in",
        "account_number": "AC-77123984",
        "account_type": "CURRENT",
        "balance": 120000.0,
        "initial_balance": 120000.0,
        "kyc_status": "PENDING",
        "risk_tier": "MEDIUM",
        "currency": "INR",
    },
    {
        "id": "cust_vikram_03",
        "name": "Vikram Singh (Offshore)",
        "email": "vikram.singh@globalcapital.ky",
        "account_number": "AC-44910287",
        "account_type": "OFFSHORE",
        "balance": 450000.0,
        "initial_balance": 450000.0,
        "kyc_status": "FLAGGED",
        "risk_tier": "HIGH",
        "currency": "INR",
    },
    {
        "id": "cust_neha_04",
        "name": "Neha Patel",
        "email": "neha.patel@studentunion.in",
        "account_number": "AC-33019284",
        "account_type": "SAVINGS",
        "balance": 1500.0,
        "initial_balance": 1500.0,
        "kyc_status": "VERIFIED",
        "risk_tier": "LOW",
        "currency": "INR",
    },
]

def seed_database(db: Session):
    # Seed Permissions
    for p_data in INITIAL_PERMISSIONS:
        existing_p = db.query(Permission).filter(Permission.id == p_data["id"]).first()
        if not existing_p:
            p = Permission(**p_data)
            db.add(p)
    db.commit()

    # Seed Agents
    for a_data in INITIAL_AGENTS:
        existing_a = db.query(Agent).filter(Agent.id == a_data["id"]).first()
        if not existing_a:
            agent = Agent(
                id=a_data["id"],
                name=a_data["name"],
                type=a_data["type"],
                status=a_data["status"],
                risk_level=a_data["risk_level"],
                daily_limit=a_data["daily_limit"],
                transaction_limit=a_data["transaction_limit"],
                api_key=a_data["api_key"],
                description=a_data["description"]
            )
            db.add(agent)
            db.commit()

            # Attach permissions
            for perm_id in a_data["permissions"]:
                ap = AgentPermission(
                    id=str(uuid.uuid4()),
                    agent_id=agent.id,
                    permission_id=perm_id
                )
                db.add(ap)
            db.commit()

    # Seed Customers
    for c_data in INITIAL_CUSTOMERS:
        existing_c = db.query(Customer).filter(Customer.id == c_data["id"]).first()
        if not existing_c:
            cust = Customer(**c_data)
            db.add(cust)
    db.commit()

