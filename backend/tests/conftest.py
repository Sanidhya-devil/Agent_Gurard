import pytest
import os
import sys

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.database.state_store import state_store
from app.database.connection import SessionLocal, Base, engine
from app.core.seed_data import seed_database

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()
    yield

@pytest.fixture(autouse=True)
def reset_state():
    state_store.reset_state_for_tests()
    db = SessionLocal()
    try:
        from app.models.agent import Agent
        agents = db.query(Agent).all()
        for a in agents:
            a.status = "ACTIVE"
        db.commit()
    finally:
        db.close()
    yield
    state_store.reset_state_for_tests()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
