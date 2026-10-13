from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.database.connection import Base, engine, SessionLocal
from app.core.seed_data import seed_database
from app.api.v1 import (
    authorization,
    agents,
    permissions,
    budget,
    admin,
    audit,
    approvals,
    transactions,
    simulator,
    customers
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed initial data
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
        print("Database initialized and seeded successfully.")
    finally:
        db.close()
    yield
    # Shutdown logic if any

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_TAGLINE,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 Routers
app.include_router(authorization.router, prefix=settings.API_V1_STR, tags=["Authorization Pipeline"])
app.include_router(agents.router, prefix=f"{settings.API_V1_STR}/agents", tags=["Agent Management"])
app.include_router(permissions.router, prefix=f"{settings.API_V1_STR}/permissions", tags=["Permissions Policy"])
app.include_router(budget.router, prefix=settings.API_V1_STR, tags=["Budget Controller"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["Admin & Kill Switch"])
app.include_router(audit.router, prefix=f"{settings.API_V1_STR}/audit", tags=["Audit Logs"])
app.include_router(approvals.router, prefix=f"{settings.API_V1_STR}/approvals", tags=["Human Approvals"])
app.include_router(transactions.router, prefix=f"{settings.API_V1_STR}/transactions", tags=["Transaction Activity"])
app.include_router(simulator.router, prefix=f"{settings.API_V1_STR}/simulator", tags=["Demo Simulator"])
app.include_router(customers.router, prefix=f"{settings.API_V1_STR}/customers", tags=["Customer Simulator"])

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "tagline": settings.PROJECT_TAGLINE,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "AgentGuard Governance Engine"}
