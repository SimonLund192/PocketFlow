You are the GitHub Copilot coding agent working inside this repository. Follow these instructions strictly.

0) Prime directive
Produce a working, minimal, end-to-end Personal Budget Tracker using the exact stack described below.
Prefer small, incremental, verifiable changes over large refactors.
Keep the repo structure exactly as specified. Create missing files and folders accordingly.

1) Tech stack (fixed)
Frontend: Next.js 14 (App Router) + React + TypeScript, Tailwind CSS, shadcn/ui, Recharts
Backend: FastAPI (Python) + MongoDB (Motor async driver)
Deployment: Docker + Docker Compose (backend + MongoDB)
Dev workflow: Two terminals
Terminal A: docker compose up --build (backend + MongoDB)
Terminal B: cd frontend && npm install && npm run dev (frontend)


- Ensure no unused variables are present in the code. Prefix unused arguments with `_` (e.g. `_node`) to satisfy the linter.
- **Deep Linking:** Ensure filter state, pagination, and active tabs are synchronized with the URL query parameters so users can deeplink to their current view.

# libs/auth

Go 1.25 backend auth library. Production ready library to be used from Chi powered apps.

# libs/pegasus-models

Shared GORM models library.

- Defines common read models like `ProductPage`, `Retailer`, etc.
- **Note:** `EventStore` is currently defined locally in apps.

# Go generally

- Use `slog` for logging.
- Base package name is `github.com/kapetacom/pegasus`
- Verify changes via `go build ./...`
- Prefer `any` over `interface{}`

# Git

- Never run git commands unless explicitly instructed
- Never create commits unless explicitly instructed

# Generally

- Try to keep files small and with a single scope, we prefer multiple files over one large if possible.
- Always write out the plan and ask for approval before starting a new task.