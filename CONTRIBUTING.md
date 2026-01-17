# Contributing to Budget App

This repository contains a Next.js 14 (App Router) frontend and a FastAPI + MongoDB backend.
The goal is a clean, predictable codebase where financial behavior is test-backed and easy to extend.

---

## Repository Structure

### Frontend (Next.js 14 App Router)
- `frontend/app/` contains route pages:
  - `app/page.tsx` (Dashboard)
  - `app/transactions/page.tsx`
  - `app/budgets/page.tsx`
  - `app/goals/page.tsx`
- `frontend/components/` contains reusable components:
  - `components/ui/` shadcn/ui components
  - `components/layout/` layout components (Sidebar, etc.)
  - `components/dashboard/` dashboard-specific components
- `frontend/lib/api.ts` contains API client functions used by pages/components
- `frontend/lib/utils.ts` contains general utilities

### Backend (FastAPI + MongoDB)
- `backend/app/main.py` FastAPI app entry
- `backend/app/routes.py` API endpoints
- `backend/app/models.py` Pydantic models
- `backend/app/database.py` MongoDB connection
- `backend/app/seed_data.py` seed script

---

## Development Principles

### Reuse-first development
Before adding new code, check for an existing:
- component
- utility function
- API function
- backend route pattern
and extend it rather than duplicating behavior.

### Keep changes small
Prefer small, focused PRs:
- One feature or fix per branch
- Avoid unrelated refactors
- Refactor only where you are already making changes

### UI consistency
- Reuse existing layout components in `frontend/components/layout`.
- Use shadcn/ui components from `frontend/components/ui`.
- Keep styling consistent with existing pages and dashboard components.

---

## API Conventions

- RESTful endpoints (GET/POST/PUT/DELETE)
- JSON request/response
- Path parameters: `/api/resource/{id}`
- Query parameters for filtering/ranges
- Frontend calls backend through `frontend/lib/api.ts` (single source of truth)

Backend base URL (local dev): `http://localhost:8000`

---

## Testing (going forward)

There is currently no test setup. New work should introduce tests along with the feature.

Recommended:
- Frontend: Jest + React Testing Library
- Backend: pytest

When you change behavior, add tests to lock it in.
When you fix a bug, add a regression test.

---

## Code Quality Checklist

Before committing:
- Remove unused imports and dead code in touched files
- Keep naming consistent and descriptive
- Prefer explicit code over clever abstractions
- Add comments only where they add clarity
- Ensure errors are handled explicitly and safely
