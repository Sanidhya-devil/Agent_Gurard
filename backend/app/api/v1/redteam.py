from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from pydantic import BaseModel

from app.database.connection import get_db
from app.services.redteam_service import redteam_service

router = APIRouter()

class ExecuteVectorRequest(BaseModel):
    custom_memo: Optional[str] = None

@router.get("/vectors")
def get_attack_vectors():
    """
    Returns the catalog of configured Red Team adversarial attack vectors targeting Gates 1-6.
    """
    return {
        "status": "SUCCESS",
        "vectors": redteam_service.get_attack_vectors()
    }

@router.post("/execute/{vector_id}")
def execute_vector(vector_id: str, payload: Optional[ExecuteVectorRequest] = None, db: Session = Depends(get_db)):
    """
    Executes a specific adversarial attack vector against AgentGuard fail-closed pipeline.
    """
    custom_memo = payload.custom_memo if payload else None
    try:
        result = redteam_service.execute_vector(vector_id=vector_id, db=db, custom_memo=custom_memo)
        return {
            "status": "SUCCESS",
            "vector_id": vector_id,
            "result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/run-battery")
def run_attack_battery(db: Session = Depends(get_db)):
    """
    Executes the full automated Red Team assault battery and triggers the Kill Switch circuit breaker.
    """
    try:
        report = redteam_service.execute_battery(db)
        return {
            "status": "SUCCESS",
            "report": report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset")
def reset_redteam_fleet(db: Session = Depends(get_db)):
    """
    Resets the Kill Switch and restores normal fleet state after Red Team testing.
    """
    try:
        res = redteam_service.reset_fleet(db)
        return {
            "status": "SUCCESS",
            "fleet": res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
