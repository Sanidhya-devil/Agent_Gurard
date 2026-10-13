"""
AgentGuard Python SDK
Govern every agent. Control every action. Protect every transaction.
"""

from agentguard.client import AgentGuard
from agentguard.decorators import protect
from agentguard.models import AuthorizeResult
from agentguard.adapters.langchain import AgentGuardTool
from agentguard.exceptions import (
    AgentGuardException,
    PolicyDeniedException,
    HumanApprovalRequiredException,
    KillSwitchActiveException,
    AuthenticationFailedException,
)

__version__ = "1.0.0"

__all__ = [
    "AgentGuard",
    "protect",
    "AuthorizeResult",
    "AgentGuardTool",
    "AgentGuardException",
    "PolicyDeniedException",
    "HumanApprovalRequiredException",
    "KillSwitchActiveException",
    "AuthenticationFailedException",
]
