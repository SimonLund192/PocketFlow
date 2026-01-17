# Contributing to Pocketflow

Pocketflow is a budget and finance application built with a Next.js 14 frontend and a FastAPI backend.
The codebase prioritizes clarity, correctness, and strict user data isolation.

---

## Repository Structure

### Frontend (Next.js 14 App Router)

* `frontend/app/` – Route-based pages (Server Components by default)
* `frontend/components/` – Reusable components

  * `components/ui/` – shadcn/ui components
  * `components/layout/` – Shared layout (Sidebar, shell)
  * `components/dashboard/` – Dashboard-specific components
* `frontend/contexts/` – React contexts (e.g. user selection)
* `frontend/lib/api.ts` – Centralized API client (single source of truth)
* `frontend/__tests__/` – Jest + React Testing Library tests

### Backend (FastAPI + MongoDB)

* `backend/app/main.py` – FastAPI app entrypoint
* `backend/app/routes.py` – Router aggregator
* `backend/app/routes/` – Per-feature routers (transactions, budgets, goals, dashboard, users)
* `backend/app/models.py` – Pydantic models
* `backend/app/database.py` – MongoDB helpers
* `backend/app/auth.py` – User context dependency (dev-mode today, auth-ready)
* `backend/app/seed_data.py` – Development seed data
* `backend/tests/` – pytest integration tests

---

## Development Principles

### Reuse-first development

Before adding new code, check for existing:

* components
* utilities
* API client functions
* backend route or model patterns

Extend existing code whenever possible instead of duplicating behavior.

### Keep changes small and focused

* One feature or fix per branch.
* Avoid unrelated refactors.
* Cleanup is welcome, but only within the scope of the change.

---

## User data ownership (critical)

All domain data in Pocketflow is scoped to a user.

* Backend endpoints must enforce user scoping via `get_user_context()`.
* Frontend requests must include the selected user context automatically via `frontend/lib/api.ts`.
* Cross-user data access is a correctness bug and must be covered by tests.

---

## API Conventions

* RESTful endpoints under `/api/*`
* JSON request and response bodies
* Path parameters for identifiers (`/api/resource/{id}`)
* Query parameters for filtering and ranges
* Frontend communicates with backend exclusively via `frontend/lib/api.ts`

Local backend base URL: `http://localhost:8000`

---

## Testing

This project uses fast, lightweight tests:

### Backend

* Framework: pytest + pytest-asyncio
* Style: async integration tests using an ASGI client

Run:

```bash
docker compose run --rm backend pytest
```

### Frontend

* Framework: Jest + React Testing Library
* Tests live in `frontend/__tests__/`

Run:

```bash
npm test
```

When adding features or fixing bugs, update or add tests to lock in behavior.

---

## Code Quality Checklist

Before committing:

* Remove unused imports and dead code in touched files
* Keep naming consistent and descriptive
* Prefer explicit, readable code over clever abstractions
* Handle errors explicitly and safely
* Add comments only where they add clarity
