# Copilot Instructions (Pocketflow)

You are working in the Pocketflow repository.

## Stack Overview

* Frontend: Next.js 14 App Router (TypeScript), shadcn/ui
* Backend: FastAPI (REST) + MongoDB (Motor)
* Frontend tests: Jest + React Testing Library
* Backend tests: pytest + pytest-asyncio

---

## Always-On Rules

### 1) Reuse before building

* Before creating a new component, hook, utility, or endpoint, search for existing implementations and extend them.
* Prefer modifying existing files over introducing new abstractions.
* Avoid parallel implementations of the same concept.

### 2) Keep changes scoped

* Avoid repo-wide refactors unless explicitly requested.
* Refactor only in areas you touch and keep changes small and reviewable.
* Do not mix cleanup with feature work unless necessary for correctness.

### 3) User scoping is mandatory

* All domain data (transactions, budgets, goals, dashboard aggregations, users) is **user-owned**.
* Backend:

  * All user-scoped endpoints must depend on `app.auth.get_user_context()`.
  * Queries and mutations must filter by the current user and must not allow cross-user access.
* Frontend:

  * All API requests must go through `frontend/lib/api.ts`.
  * `api.ts` must consistently attach the `X-User-Id` header via the existing user-selection mechanism.
* Tests:

  * New user-owned features must include at least one isolation test (user A cannot read or modify user B’s data).

### 4) Frontend rules (Next.js App Router)

* Use the routing structure under `frontend/app/`.
* Prefer Server Components by default. Only use Client Components when required (`"use client"`).
* Keep UI consistent with existing layout and patterns under:

  * `frontend/components/layout`
  * `frontend/components/dashboard`
* Use shadcn/ui components from `frontend/components/ui`.
* Do not redesign existing screens or layouts unless explicitly requested.

### 5) Backend rules (FastAPI)

* Follow REST conventions and existing router patterns under `backend/app/routes/`.
* Validate all request payloads with Pydantic models in `backend/app/models.py`.
* Use correct HTTP status codes and consistent JSON error responses.
* Handle errors explicitly; do not rely on silent failures or implicit behavior.

### 6) API integration rules

* Frontend must not call `fetch` directly outside of `frontend/lib/api.ts`.
* `frontend/lib/api.ts` is the single source of truth for backend communication.
* Backend base URL is `http://localhost:8000` (reuse existing config patterns).

### 7) Testing rules (mandatory)

* All new features must include tests.
* When modifying existing logic, update or add tests to lock in behavior.
* Use:

  * Frontend: Jest + React Testing Library (`frontend/__tests__/`)
  * Backend: pytest (`backend/tests/`)

### 8) Finish every task by

* Running relevant tests and fixing failures.
* Reviewing changes as if they were a PR (clarity, naming, consistency).
* Removing dead code and unused imports in touched files.
* Adding comments only where they clarify non-obvious logic.
