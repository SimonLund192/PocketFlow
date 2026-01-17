# Copilot Instructions (Budget App)

You are working in this repository with:
- Frontend: Next.js 14 App Router (TypeScript), shadcn/ui, fetch-based API client in `frontend/lib/api.ts`
- Backend: FastAPI (REST) + MongoDB in `backend/app/`
- No authentication currently

## Always-On Rules

### 1) Reuse before building
- Before creating a new component, hook, utility, or endpoint, search for existing implementations and extend them.
- Prefer modifying existing files over adding new abstractions.

### 2) Keep changes scoped
- Avoid repo-wide refactors unless explicitly asked.
- Only refactor code in areas you touch, and keep refactors small and reviewable.

### 3) Frontend rules (Next.js App Router)
- Use the existing routing structure under `frontend/app/*`.
- Prefer Server Components by default. Only use Client Components when required (`"use client"`).
- Keep UI consistent with existing layout/components under `frontend/components/layout` and dashboard components under `frontend/components/dashboard`.
- Use shadcn/ui components from `frontend/components/ui` and Tailwind conventions already used in the project.
- Do not redesign existing screens unless explicitly requested.

### 4) Backend rules (FastAPI)
- Follow REST conventions and existing patterns in `backend/app/routes.py`.
- Validate all request payloads with Pydantic models in `backend/app/models.py`.
- Return consistent JSON responses and correct HTTP status codes.
- Handle errors explicitly (not silent failures). Prefer clear, user-safe error messages.

### 5) API integration rules
- Frontend should call backend through `frontend/lib/api.ts`. Do not scatter `fetch(...)` usage across pages/components.
- Base backend URL is `http://localhost:8000` (reuse existing config patterns if present).

### 6) Testing rules (mandatory going forward)
- New features must include tests.
- When touching existing logic, add tests that lock in behavior.
- Use:
  - Frontend: Jest + React Testing Library
  - Backend: pytest
- If tests are not configured yet, implement the minimal setup required to test the changes you introduce (keep it lightweight).

### 7) Finish every task by
- Running or updating tests relevant to the change.
- Self-reviewing changes like a PR: readability, naming, consistency, production readiness.
- Removing dead code and unused imports in touched files.
- Adding comments only where they clarify non-obvious logic.
