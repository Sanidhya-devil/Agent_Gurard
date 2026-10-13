from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
import datetime
from app.models.transaction import Transaction
from app.models.agent import Agent
from app.core.config import settings

class RiskAssessmentResult:
    def __init__(self, score: int, level: str, reason: str, recommended_action: str, factors: List[str]):
        self.score = score
        self.level = level
        self.reason = reason
        self.recommended_action = recommended_action
        self.factors = factors

class RiskService:
    @staticmethod
    def evaluate_risk(
        db: Session,
        agent: Agent,
        action: str,
        amount: float,
        recipient: str,
        context: Dict[str, Any]
    ) -> RiskAssessmentResult:
        score = 5 # baseline baseline trust
        factors: List[str] = []

        # 1. Frequency / Velocity Anomaly
        # Check context override first (e.g., demo scenario input)
        explicit_freq = context.get("frequency")
        recent_tx_count = 0
        if explicit_freq is not None:
            recent_tx_count = int(explicit_freq)
        else:
            fifteen_mins_ago = datetime.datetime.utcnow() - datetime.timedelta(minutes=15)
            recent_tx_count = db.query(Transaction).filter(
                Transaction.agent_id == agent.id,
                Transaction.created_at >= fifteen_mins_ago
            ).count()

        if recent_tx_count >= 7:
            score += 40
            factors.append(f"High transaction burst frequency ({recent_tx_count} recent requests)")
        elif recent_tx_count >= 4:
            score += 20
            factors.append(f"Moderate transaction velocity ({recent_tx_count} recent requests)")

        # 2. Recipient Novelty / Risk Flag
        suspicious_keywords = ["new_recipient", "unverified", "crypto", "offshore", "temp_", "darknet"]
        is_suspicious_keyword = any(k in recipient.lower() for k in suspicious_keywords)
        
        # Check historical interactions with this recipient
        previous_recipient_tx = db.query(Transaction).filter(
            Transaction.agent_id == agent.id,
            Transaction.recipient == recipient,
            Transaction.decision == "ALLOW"
        ).first()

        if is_suspicious_keyword:
            score += 30
            factors.append(f"Target recipient '{recipient}' flagged as unverified or high-risk")
        elif not previous_recipient_tx:
            score += 15
            factors.append(f"First-time transfer to new recipient '{recipient}'")

        # 3. Transaction Size vs Limits
        if agent.transaction_limit > 0:
            ratio = amount / agent.transaction_limit
            if ratio >= 0.85:
                score += 25
                factors.append(f"Transaction utilizes {int(ratio*100)}% of agent per-transaction limit")
            elif ratio >= 0.60:
                score += 15
                factors.append(f"Large transaction size relative to normal bounds ({int(ratio*100)}% limit)")

        # 4. Off-Hours / Nocturnal Anomaly
        # Check context time or system clock
        time_str = context.get("time")
        is_off_hours = False
        if time_str:
            try:
                hour = int(time_str.split(":")[0])
                if 1 <= hour <= 5:
                    is_off_hours = True
            except Exception:
                pass
        else:
            current_hour = datetime.datetime.now().hour
            if 1 <= current_hour <= 5:
                is_off_hours = True

        if is_off_hours:
            score += 15
            factors.append("Off-hours operation (unusual execution timeframe)")

        # 5. Agent Baseline Risk Profile
        if agent.risk_level == "HIGH":
            score += 20
            factors.append("Agent flagged with elevated baseline operational risk profile")
        elif agent.risk_level == "MEDIUM":
            score += 10

        # 6. Customer KYC & Risk Tier Assessment (Fake Customer / Account Profile)
        customer_kyc = context.get("customer_kyc") or context.get("kyc_status")
        customer_risk = context.get("customer_risk") or context.get("customer_risk_tier")
        if customer_kyc == "FLAGGED":
            score += 45
            factors.append("Customer account KYC is FLAGGED (High AML/Fraud watchlist alert)")
        elif customer_kyc == "PENDING":
            score += 15
            factors.append("Customer account KYC is PENDING verification")

        if customer_risk == "HIGH":
            score += 25
            factors.append("Customer account classified as HIGH risk tier (Offshore/High-Value)")
        elif customer_risk == "MEDIUM":
            score += 10
            factors.append("Customer account classified as MEDIUM risk tier")

        # Bound score between 0 and 99
        final_score = min(max(score, 5), 98)

        # Categorize
        if final_score < settings.RISK_LOW_THRESHOLD:
            level = "LOW"
            recommended_action = "ALLOW"
            reason = "Standard risk profile. Metrics within safe operating parameters."
        elif final_score < settings.RISK_HIGH_THRESHOLD:
            level = "MEDIUM"
            recommended_action = "ALLOW"
            reason = f"Moderate contextual anomaly detected: {', '.join(factors[:2])}"
        else:
            level = "HIGH"
            recommended_action = "HUMAN_APPROVAL"
            reason = f"High-risk anomaly pattern detected: {'; '.join(factors)}"

        return RiskAssessmentResult(
            score=final_score,
            level=level,
            reason=reason,
            recommended_action=recommended_action,
            factors=factors
        )

risk_service = RiskService()
