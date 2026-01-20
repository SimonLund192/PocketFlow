Personal Budget Tracker
A modern personal finance management application with a beautiful dashboard interface.

Stack
Frontend: Next.js 14, React, Tailwind CSS, shadcn/ui, Recharts
Backend: FastAPI (Python), MongoDB
Deployment: Docker & Docker Compose
Getting Started
Prerequisites
Docker Desktop installed
Node.js 18+ and npm installed
Running the Application
Terminal 1 - Backend & Database:

docker-compose up --build
This will start:

Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs
MongoDB: localhost:27017
Terminal 2 - Frontend:

cd frontend
npm install
npm run dev
The frontend will be available at:

Frontend: http://localhost:3000
Seed Sample Data
After starting docker-compose, run this to populate the database with sample data:

cd backend
python app/seed_data.py
Stopping the Application
Stop docker-compose:

docker-compose down
To remove volumes as well:

docker-compose down -v
API Endpoints
GET /api/transactions - Get all transactions
POST /api/transactions - Create a new transaction
GET /api/dashboard/stats - Get dashboard statistics
GET /api/dashboard/balance-trends - Get balance trends for chart
GET /api/dashboard/expense-breakdown - Get expense breakdown by category
DELETE /api/transactions/{id} - Delete a transaction
File Structure
At a high level, this repo is split into a Next.js frontend and a FastAPI backend:

Pocketflow/
├── frontend/                  # Next.js 14 App Router (TypeScript)
│   ├── app/                   # Routes (Server Components by default)
│   ├── components/            # UI + page components (shadcn/ui)
│   ├── contexts/              # React contexts (e.g. AuthContext)
│   ├── lib/api.ts             # Centralized fetch-based API client (do not scatter fetch calls)
│   └── __tests__/              # Jest + React Testing Library
├── backend/                   # FastAPI + MongoDB (Motor)
│   ├── app/
│   │   ├── main.py            # FastAPI app entrypoint
│   │   ├── routes.py          # Router aggregator (includes per-feature routers)
│   │   ├── routes/            # Per-feature routers (transactions, dashboard, budgets, goals, users)
│   │   ├── models.py          # Pydantic models
│   │   ├── database.py        # Mongo connection helpers
│   │   ├── auth.py            # User context dependency (dev mode today; auth-ready interface)
│   │   └── seed_data.py       # Sample data seeder
│   └── tests/                 # pytest integration tests
├── docs/                      # Developer docs (incl. AUTH_FUTURE.md)
└── docker-compose.yml         # Docker orchestration (backend + MongoDB)
Testing
This repo uses lightweight, fast tests in both backend and frontend.

Backend (pytest)
Framework: pytest + pytest-asyncio
Style: async integration tests via an ASGI client
Run tests (recommended via Docker so deps match the running backend image):

docker compose run --rm backend pytest
Frontend (Jest + React Testing Library)
Framework: Jest + React Testing Library
Tests live in frontend/__tests__/
Run tests:

cd frontend
npm test
API style
REST conventions
Backend routes are under the /api prefix (see backend/app/main.py).
FastAPI routers are composed in backend/app/routes.py and split by feature under backend/app/routes/.
Endpoints generally follow REST conventions (GET/POST/PUT/DELETE).
User context (dev-mode today; auth-ready interface)
This app currently has no real authentication enforced end-to-end.

Backend: user-scoped endpoints depend on app.auth.get_user_context() which currently requires the X-User-Id header.
Frontend: user selection is stored via getSelectedUserId() in frontend/lib/api.ts, and api.ts attaches the X-User-Id header consistently.
To swap in real auth later (JWT/cookies), see docs/AUTH_FUTURE.md.

Project Structure
budget-tracker/
├── frontend/          # Next.js frontend application
├── backend/           # FastAPI backend application
│   ├── app/
│   │   ├── main.py       # FastAPI app
│   │   ├── routes.py     # Router aggregator
│   │   ├── routes/       # Feature routers
│   │   ├── models.py     # Pydantic models
│   │   ├── database.py   # MongoDB connection
│   │   ├── auth.py       # User context dependency (dev mode / auth-ready interface)
│   │   └── seed_data.py  # Sample data seeder
│   ├── Dockerfile
│   └── requirements.txt
└── docker-compose.yml # Docker orchestration (backend + MongoDB only)
Development
Frontend runs locally with hot reload for faster development. Backend and MongoDB run in Docker containers.