from __future__ import annotations

import secrets
import time
from dataclasses import dataclass
from typing import Dict, Optional

from app.auth import UserContext
from app.models import AiToolCallPlan


@dataclass
class StoredPlan:
	id: str
	user_id: str
	created_at: float
	plan: AiToolCallPlan
	user_text: str


class InMemoryPlanStore:
	"""Short-lived in-memory store for proposed AI plans.

	Security properties:
	- Plans are user-scoped (must match ctx.user_id when fetching/confirming).
	- Plans expire automatically via TTL.
	- Plans are one-time use on confirm (removed on successful get_for_user).

	This is intentionally simple and suitable for single-process dev/test.
	"""

	def __init__(self, *, ttl_seconds: int = 300):
		self._ttl_seconds = ttl_seconds
		self._plans: Dict[str, StoredPlan] = {}

	def create(self, *, ctx: UserContext, plan: AiToolCallPlan, user_text: str) -> StoredPlan:
		plan_id = secrets.token_urlsafe(16)
		stored = StoredPlan(
			id=plan_id,
			user_id=ctx.user_id,
			created_at=time.time(),
			plan=plan,
			user_text=user_text,
		)
		self._plans[plan_id] = stored
		self._purge_expired()
		return stored

	def get_for_user(self, *, ctx: UserContext, plan_id: str, consume: bool = False) -> Optional[StoredPlan]:
		self._purge_expired()
		stored = self._plans.get(plan_id)
		if stored is None:
			return None
		if stored.user_id != ctx.user_id:
			return None
		if consume:
			del self._plans[plan_id]
		return stored

	def _purge_expired(self) -> None:
		now = time.time()
		expired = [
			pid
			for pid, stored in self._plans.items()
			if now - stored.created_at > self._ttl_seconds
		]
		for pid in expired:
			self._plans.pop(pid, None)


_default_store: Optional[InMemoryPlanStore] = None


def default_plan_store() -> InMemoryPlanStore:
	global _default_store
	if _default_store is None:
		_default_store = InMemoryPlanStore(ttl_seconds=300)
	return _default_store
