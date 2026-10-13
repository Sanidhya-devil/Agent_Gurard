import threading
from typing import Optional, Tuple
import datetime
from app.core.config import settings

try:
    import redis
except ImportError:
    redis = None

class StateStore:
    def __init__(self):
        self._redis_client = None
        self._lock = threading.Lock()
        
        # In-memory fallbacks matching Redis key structure
        self._memory_data = {
            "agentguard:global_stop": "false",
        }
        self._revocations = set() # set of revoked agent_ids
        self._budget_counters = {} # key -> float spent today
        
        # Connect to Redis if configured
        if settings.REDIS_URL and redis:
            try:
                client = redis.from_url(settings.REDIS_URL, decode_responses=True)
                client.ping()
                self._redis_client = client
                print("Connected to Redis successfully.")
            except Exception as e:
                print(f"Redis connection failed, falling back to atomic in-memory state store: {e}")
                self._redis_client = None

    # Global Emergency Kill Switch
    def get_global_stop(self) -> bool:
        if self._redis_client:
            try:
                val = self._redis_client.get("agentguard:global_stop")
                return val == "true"
            except Exception:
                pass
        with self._lock:
            return self._memory_data.get("agentguard:global_stop") == "true"

    def set_global_stop(self, stop: bool) -> None:
        val_str = "true" if stop else "false"
        if self._redis_client:
            try:
                self._redis_client.set("agentguard:global_stop", val_str)
            except Exception:
                pass
        with self._lock:
            self._memory_data["agentguard:global_stop"] = val_str

    # Agent Revocation
    def is_agent_revoked(self, agent_id: str) -> bool:
        if self._redis_client:
            try:
                val = self._redis_client.get(f"agentguard:revoked:{agent_id}")
                if val is not None:
                    return val == "true"
            except Exception:
                pass
        with self._lock:
            return agent_id in self._revocations

    def set_agent_revoked(self, agent_id: str, revoked: bool) -> None:
        val_str = "true" if revoked else "false"
        if self._redis_client:
            try:
                if revoked:
                    self._redis_client.set(f"agentguard:revoked:{agent_id}", "true")
                else:
                    self._redis_client.delete(f"agentguard:revoked:{agent_id}")
            except Exception:
                pass
        with self._lock:
            if revoked:
                self._revocations.add(agent_id)
            else:
                self._revocations.discard(agent_id)

    # Budget Checking & Atomic Consumption (Race Condition Protection)
    def get_spent_today(self, agent_id: str, date_str: Optional[str] = None) -> float:
        if date_str is None:
            date_str = datetime.date.today().isoformat()
        key = f"agentguard:budget:{agent_id}:{date_str}"
        
        if self._redis_client:
            try:
                val = self._redis_client.get(key)
                return float(val) if val else 0.0
            except Exception:
                pass
        with self._lock:
            return float(self._budget_counters.get(key, 0.0))

    def check_and_consume_budget(
        self,
        agent_id: str,
        amount: float,
        daily_limit: float,
        tx_limit: float,
        date_str: Optional[str] = None
    ) -> Tuple[bool, str, float]:
        """
        Atomically checks per-transaction and daily limits,
        and if valid, reserves/consumes the budget.
        Returns: (is_allowed, reason, remaining_daily_budget)
        """
        if amount > tx_limit:
            return False, f"Transaction amount ₹{amount:,.2f} exceeds per-transaction limit ₹{tx_limit:,.2f}", 0.0

        if date_str is None:
            date_str = datetime.date.today().isoformat()
        key = f"agentguard:budget:{agent_id}:{date_str}"

        with self._lock:
            current_spent = float(self._budget_counters.get(key, 0.0))
            if current_spent + amount > daily_limit:
                remaining = max(0.0, daily_limit - current_spent)
                return False, f"Transaction amount ₹{amount:,.2f} exceeds remaining daily budget ₹{remaining:,.2f} (Daily limit ₹{daily_limit:,.2f})", remaining
            
            # Consume atomically
            new_spent = current_spent + amount
            self._budget_counters[key] = new_spent
            remaining = daily_limit - new_spent

            if self._redis_client:
                try:
                    self._redis_client.set(key, str(new_spent))
                except Exception:
                    pass

            return True, "Budget validated and reserved", remaining

    def reset_state_for_tests(self):
        with self._lock:
            self._memory_data = {"agentguard:global_stop": "false"}
            self._revocations.clear()
            self._budget_counters.clear()

state_store = StateStore()
