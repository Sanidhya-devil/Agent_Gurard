from sqlalchemy.orm import Session
from app.models.agent import Agent
from app.database.state_store import state_store

class RevocationService:
    @staticmethod
    def is_agent_revoked(agent_id: str) -> bool:
        return state_store.is_agent_revoked(agent_id)

    @staticmethod
    def revoke_agent(db: Session, agent_id: str) -> bool:
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            return False
        agent.status = "REVOKED"
        db.commit()
        state_store.set_agent_revoked(agent_id, True)
        return True

    @staticmethod
    def activate_agent(db: Session, agent_id: str) -> bool:
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            return False
        agent.status = "ACTIVE"
        db.commit()
        state_store.set_agent_revoked(agent_id, False)
        return True

revocation_service = RevocationService()
