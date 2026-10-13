from typing import Tuple
from app.database.state_store import state_store

class BudgetService:
    @staticmethod
    def get_budget_status(agent_id: str, daily_limit: float, transaction_limit: float) -> Tuple[float, float]:
        spent_today = state_store.get_spent_today(agent_id)
        remaining_today = max(0.0, daily_limit - spent_today)
        return spent_today, remaining_today

    @staticmethod
    def check_and_reserve(
        agent_id: str,
        amount: float,
        daily_limit: float,
        transaction_limit: float
    ) -> Tuple[bool, str, float]:
        """
        Atomically tests and reserves budget to prevent concurrency race conditions.
        """
        return state_store.check_and_consume_budget(
            agent_id=agent_id,
            amount=amount,
            daily_limit=daily_limit,
            tx_limit=transaction_limit
        )

    @staticmethod
    def reset_budget(agent_id: str) -> None:
        state_store.reset_agent_budget(agent_id)

    @staticmethod
    def reset_all_budgets() -> None:
        state_store.reset_all_budgets()

budget_service = BudgetService()
