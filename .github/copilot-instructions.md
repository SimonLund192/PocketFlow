You are the GitHub Copilot coding agent working inside this repository. Follow these instructions strictly.

0) Prime directive
Produce a working, minimal, end-to-end Personal Budget Tracker using the exact stack described below.
Prefer small, incremental, verifiable changes over large refactors.
Keep the repo structure exactly as specified. Create missing files and folders accordingly.

1) Tech stack (fixed)
Frontend: Next.js 14 (App Router) + React + TypeScript, Tailwind CSS, shadcn/ui, Recharts
Backend: FastAPI (Python) + MongoDB (Motor async driver)
AI: Mistral AI (mistral-large-latest) via tool-calling agent pattern
Deployment: Docker + Docker Compose (backend + MongoDB)
Dev workflow: Two terminals
  Terminal A: docker compose up --build (backend + MongoDB)
  Terminal B: cd frontend && npm install && npm run dev (frontend)

2) Project structure
```
budget-tracker/
├── .github/
│   ├── copilot-instructions.md   # This file
│   └── workflows/                # CI/CD workflows
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── pyproject.toml
│   ├── .env / .env.example
│   ├── app/
│   │   ├── main.py              # FastAPI app with lifespan handler
│   │   ├── database.py          # Motor collections + index creation
│   │   ├── models.py            # All Pydantic models
│   │   ├── auth.py              # get_user_context() → X-User-Id header
│   │   ├── routes.py            # Router composition
│   │   ├── routes/              # Feature routers (categories, budgets, budget_line_items, goals, etc.)
│   │   ├── services/            # Business logic layer (budget_line_item_service, etc.)
│   │   ├── migrations/          # Data migration scripts
│   │   ├── ai/                  # AI chat agent
│   │   │   ├── agent.py         # AIAgent with tool-calling loop
│   │   │   ├── client.py        # Mistral LLMClient wrapper
│   │   │   ├── config.py        # AIConfig (pydantic-settings)
│   │   │   ├── tools.py         # Tool definitions + executors
│   │   │   ├── logging.py       # AI-specific logger
│   │   │   └── system_prompt.txt
│   │   └── seed_data.py
│   └── tests/
│       ├── conftest.py
│       ├── test_budget_line_item_service.py
│       └── test_budget_line_item_api.py
├── frontend/
│   ├── app/                     # Next.js App Router pages
│   │   ├── page.tsx             # Dashboard
│   │   ├── budget/page.tsx      # Budget page (5 tabs: income, shared-expenses, personal-expenses, shared-savings, fun)
│   │   ├── goals/page.tsx       # Goals page
│   │   ├── analytics/page.tsx   # Analytics page
│   │   ├── account/page.tsx     # Settings / Categories CRUD
│   │   ├── database/page.tsx    # Database viewer
│   │   └── login/page.tsx
│   ├── components/              # Reusable UI (Header, Tabs, KPICard, StatCard, AIChat, etc.)
│   ├── lib/                     # API helpers, auth context, utilities
│   └── __tests__/
├── docs/                        # Extensive design + schema docs
├── docker-compose.yml
└── package.json                 # Root workspace (if any)
```

3) Backend conventions
- Python 3.11, FastAPI, async everywhere.
- Use Motor (async MongoDB driver). Collections defined in `backend/app/database.py`.
- Pydantic v2 models in `backend/app/models.py`. Use `model_dump()` not `.dict()`.
- User context: `backend/app/auth.py` → `get_user_context()` reads `X-User-Id` header. No real auth yet.
- **Always filter by `user_id`** in every DB query to enforce user isolation.
- Routes go in `backend/app/routes/<feature>.py`, registered via `backend/app/routes.py`.
- Service layer in `backend/app/services/` for business logic; routes stay thin.
- Use `logging` (stdlib) for backend logs. AI module has its own logger (`pocketflow.ai`).
- Ensure no unused variables. Prefix unused arguments with `_`.
- Owner slot model: `"user1" | "user2" | "shared"` — user2 is NOT a real auth user.
- Run `docker compose run --rm backend pytest` to verify tests.

4) Frontend conventions
- TypeScript strict mode. No `any` unless unavoidable.
- Tailwind CSS + shadcn/ui components. No custom CSS files.
- Reusable components in `frontend/components/` (Header, Tabs, KPICard, StatCard, AIChat).
- API calls go through helpers in `frontend/lib/api.ts` which attaches `X-User-Id` header.
- **Deep Linking:** Synchronize filter state, pagination, and active tabs with URL query parameters so users can deeplink to their current view.
- Use `useSearchParams` / `useRouter` for URL state.
- Pages follow pattern: Header → Tabs (if applicable) → Content.
- Ensure no unused variables. Prefix unused args with `_`.
- Run `cd frontend && npm test` to verify.

5) Database (MongoDB)
- Three core collections: `categories`, `budgets`, `budget_line_items`.
- Plus: `transactions`, `goals`, `users`.
- Indexes created on startup via `create_indexes()` in lifespan handler.
- Category types align with budget tabs: `income`, `shared-expenses`, `personal-expenses`, `shared-savings`, `fun`.
- Line items reference categories by ObjectId (`category_id`), not string.
- Unique constraints: `(user_id, name, type)` on categories; `(user_id, month)` on budgets.

6) AI Chat
- Backend: `backend/app/ai/` — Mistral tool-calling agent.
- Tools defined in `tools.py`, executed against real budget data.
- System prompt loaded from `system_prompt.txt` with `{current_date}` and `{current_month}` placeholders.
- Frontend: `frontend/components/AIChat.tsx` — floating chat widget.

7) Testing
- Backend: pytest + httpx AsyncClient. Fixtures in `conftest.py`.
- Frontend: Jest + React Testing Library. Tests in `frontend/__tests__/`.

8) Git
- Never run git commands unless explicitly instructed.
- Never create commits unless explicitly instructed.

9) General
- Keep files small and single-purpose; prefer multiple files over one large file.
- Always write out the plan and ask for approval before starting a new task.
