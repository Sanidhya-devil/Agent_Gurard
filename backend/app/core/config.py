from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "AgentGuard"
    PROJECT_TAGLINE: str = "Govern every agent. Control every action. Protect every transaction."
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database configuration (defaults to SQLite for local turnkey run, or PostgreSQL via env)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./agentguard.db")
    
    # Redis configuration (optional; falls back to atomic thread-safe state store)
    REDIS_URL: Optional[str] = os.getenv("REDIS_URL", None)
    
    # Risk Engine Thresholds (Configurable per TRD Section 19)
    RISK_LOW_THRESHOLD: int = 40       # < 40 -> ALLOW
    RISK_HIGH_THRESHOLD: int = 75      # >= 75 -> HUMAN_APPROVAL / BLOCK
    
    # Fail-Closed mode (TRD Section 17)
    FAIL_CLOSED: bool = True
    
    # CORS Origins
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"]
    
    model_config = {"env_file": ".env", "case_sensitive": True}

settings = Settings()
