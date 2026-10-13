from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.agent import Agent

class AuthService:
    @staticmethod
    def authenticate_agent(db: Session, agent_id: str, api_key: Optional[str] = None) -> Tuple[bool, Optional[Agent], str]:
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            return False, None, f"Agent with ID '{agent_id}' does not exist"
        
        # If API key is provided, verify it
        if api_key:
            # Bearer token prefix stripping
            clean_key = api_key.replace("Bearer ", "").strip()
            if agent.api_key != clean_key:
                return False, None, "Invalid API key credentials for agent"
                
        return True, agent, "Agent authenticated successfully"

auth_service = AuthService()
