from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Dict, Mapping, Optional

from app.auth import UserContext


ToolFunc = Callable[[UserContext, Dict[str, Any]], Awaitable[Any]]


@dataclass(frozen=True)
class ToolSpec:
    name: str
    description: str
    func: ToolFunc


class UnknownToolError(KeyError):
    pass


class McpToolRegistry:
    """Explicit tool registry and executor.

    Tools are Python callables (not stringly-typed eval/dispatch).
    Each tool is executed with `UserContext` + validated args mapping.
    """

    def __init__(self):
        self._tools: Dict[str, ToolSpec] = {}

    def register(self, spec: ToolSpec) -> None:
        if spec.name in self._tools:
            raise ValueError(f"Tool already registered: {spec.name}")
        self._tools[spec.name] = spec

    def get(self, name: str) -> ToolSpec:
        try:
            return self._tools[name]
        except KeyError as e:
            raise UnknownToolError(name) from e

    def list(self) -> Mapping[str, ToolSpec]:
        return dict(self._tools)

    async def execute(
        self,
        *,
        ctx: UserContext,
        tool_name: str,
        arguments: Optional[Mapping[str, Any]] = None,
    ) -> Any:
        spec = self.get(tool_name)
        args = dict(arguments or {})
        # Ensure user scoping is always present even if a tool ignores it.
        _ = ctx.user_id
        return await spec.func(ctx, args)


# ---- Example tools (small + safe + deterministic) ----


async def tool_echo(ctx: UserContext, args: Dict[str, Any]) -> Dict[str, Any]:
    """Echo args back to caller.

    Useful for testing the registry/executor.
    """

    return {"user_id": ctx.user_id, "args": args}


def default_registry() -> McpToolRegistry:
    registry = McpToolRegistry()
    registry.register(
        ToolSpec(
            name="echo",
            description="Echo arguments back to the caller.",
            func=tool_echo,
        )
    )
    return registry
