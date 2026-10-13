from typing import Tuple, List
from sqlalchemy.orm import Session
from app.models.policy import AgentPermission

class PolicyService:
    @staticmethod
    def get_agent_permissions(db: Session, agent_id: str) -> List[str]:
        records = db.query(AgentPermission).filter(AgentPermission.agent_id == agent_id).all()
        return [r.permission_id for r in records]

    @staticmethod
    def check_permission(db: Session, agent_id: str, required_action: str) -> Tuple[bool, str]:
        """
        Validates least-privilege permission for an agent action.
        Supports exact match (e.g. 'payment:create') and wildcard ('payment:*').
        """
        perms = PolicyService.get_agent_permissions(db, agent_id)
        
        # Check direct match
        if required_action in perms:
            return True, f"Permission granted for action '{required_action}'"
            
        # Check prefix wildcard (e.g. 'payment:*')
        action_prefix = required_action.split(":")[0] + ":*"
        if action_prefix in perms or "*:*" in perms or "*" in perms:
            return True, f"Wildcard permission granted for action '{required_action}'"
            
        return False, f"Permission denied: Agent '{agent_id}' does not possess required permission '{required_action}'. Allowed: {perms}"

policy_service = PolicyService()
